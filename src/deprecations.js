// Copyright (C) 2024-2025  Eric Cornelissen
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, version 3 of the License only.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Buffer } from "node:buffer";

/**
 * @param {Object} p
 * @param {FileSystem} p.fs
 * @param {ChildProcess} p.cp
 * @param {Options} p.options
 * @returns {Promise<DeprecatedPackage[]>}
 */
export async function getDeprecatedPackages({ cp, fs, options }) {
	const packages = await obtainDeprecation({ cp, options });
	const [hierarchy, aliases] = await Promise.all([
		obtainHierarchy({ cp, options }),
		obtainAliases({ fs }),
	]);

	for (const pkg of packages) {
		pkg.paths = findPackagePaths(pkg, hierarchy, aliases);
	}

	return packages;
}

/**
 * @param {Object} p
 * @param {ChildProcess} p.cp
 * @param {Options} p.options
 * @returns {Promise<DeprecatedPackage[]>}
 */
function obtainDeprecation({ cp, options }) {
	return new Promise((resolve, reject) => {
		const process = cp.spawn(
			"npm",
			[
				"clean-install",
				"--no-audit",
				"--no-fund",
				"--no-update-notifier",
				...(options.omitDev ? ["--omit", "dev"] : []),
				...(options.omitOptional ? ["--omit", "optional"] : []),
				...(options.omitPeer ? ["--omit", "peer"] : []),
			],
			{
				shell: false,
			},
		);

		const deprecations = [];

		process.stderr.on("data", (line) => {
			if (isDeprecationWarning(line)) {
				const deprecation = parseDeprecationWarning(line);
				deprecations.push(deprecation);
			}
		});

		process.on("close", (exitCode, error) => {
			if (exitCode === 0) {
				resolve(deprecations.filter(unique));
			} else {
				reject(error);
			}
		});
	});
}

/**
 * @param {Object} p
 * @param {ChildProcess} p.cp
 * @param {Options} p.options
 * @returns {Promise<PackageHierarchy>}
 */
function obtainHierarchy({ cp, options }) {
	const optionalArgs = [
		...(options.omitDev ? ["--omit", "dev"] : []),
		...(options.omitOptional ? ["--omit", "optional"] : []),
		...(options.omitPeer ? ["--omit", "peer"] : []),
	].join(" ");

	return new Promise((resolve, reject) => {
		cp.exec(
			`npm list --all --json ${optionalArgs}`,
			{ shell: false },
			(error, stdout) => {
				if (error) {
					reject(error);
				} else {
					const hierarchy = JSON.parse(stdout);
					if (hierarchy.dependencies) {
						delete hierarchy.dependencies[hierarchy.name];
					}
					resolve(hierarchy);
				}
			},
		)
	});
}

/**
 * `"foo": "npm:bar@3.1.4"` will result in a mapping from `foo` to `bar@3.1.4`.
 *
 * @param {Object} p
 * @param {FileSystem} fs
 * @returns {Promise<Aliases>}
 */
async function obtainAliases({ fs }) {
	const rawManifest = await fs.readFile("./package.json", { encoding: "utf-8" });
	const manifest = JSON.parse(rawManifest);

	const aliases = new Map();
	for (const deps of [
		manifest.dependencies || {},
		manifest.devDependencies || {},
	]) {
		for (const [name, rhs] of Object.entries(deps)) {
			const aliasMatch = /^npm:(?<alias>@?.+?)@(?<version>.+)$/u.exec(rhs);
			if (aliasMatch) {
				const { alias, version } = aliasMatch.groups;
				aliases.set(name, { name: alias, version });
			}
		}
	}

	return aliases;
}

/**
 * @param {Package} pkg
 * @param {PackageHierarchy} hierarchy
 * @param {Aliases} aliases
 * @param {Package[]} path
 * @returns {PackagePath[]}
 */
function findPackagePaths(pkg, hierarchy, aliases, path = []) {
	const { dependencies } = hierarchy;
	if (!dependencies) {
		return [];
	}

	const paths = [];
	for (const [depName, depInfo] of Object.entries(dependencies)) {
		const { version } = depInfo;

		const name = aliases.has(depName) ? aliases.get(depName).name : depName;
		const depPath = [...path, { name, version }];

		if (name === pkg.name && version === pkg.version) {
			paths.push(depPath);
		} else {
			paths.push(...findPackagePaths(pkg, depInfo, aliases, depPath));
		}
	}

	return paths;
}

const prefix = Buffer.from("npm warn deprecated ");

/**
 * @param {string} line
 * @returns {boolean}
 */
function isDeprecationWarning(line) {
	return line.slice(0, prefix.length).equals(prefix);
}

/**
 * @param {string} line
 * @returns {DeprecatedPackage}
 */
function parseDeprecationWarning(line) {
	const str = line.slice(prefix.length, line.length).toString();

	let i = str.indexOf(":");
	const pkg = str.substring(0, i);
	const reason = str.substring(i + 1, str.length).trim();

	i = pkg.lastIndexOf("@");
	const name = pkg.substring(0, i);
	const version = pkg.substring(i + 1, pkg.length);

	return { name, version, reason };
}

/**
 * @param {DeprecatedPackage} a
 * @param {number} index
 * @param {DeprecatedPackage[]} array
 * @returns {boolean}
 */
function unique(a, index, array) {
	return index === array.findIndex(b => a.name === b.name && a.version === b.version);
}

/**
 * @typedef Options
 * @property {boolean} omitDev
 * @property {boolean} omitOptional
 * @property {boolean} omitPeer
 */

/**
 * @typedef Package
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef {Package & _Deprecation} DeprecatedPackage
 *
 * @typedef _Deprecation
 * @property {PackagePath[]} paths
 * @property {string} reason
 */

/**
 * @typedef PackageHierarchy
 * @property {Object<string, HierarchyDependency>} dependencies
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef HierarchyDependency
 * @property {Object<string, HierarchyDependency>} dependencies
 * @property {bool} overridden
 * @property {string} resolved
 * @property {string} version
 */

/**
 * @typedef ChildProcess
 * @property {Spawn} spawn
 */

/** @typedef {Map<string, Package>} Aliases */
/** @typedef {import("./config.js").FileSystem} FileSystem */
/** @typedef {Package[]} PackagePath */
/** @typedef {function(string, string[], Object): Object} Spawn */
