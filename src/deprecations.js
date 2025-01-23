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

import { exec, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

/**
 * @param {Options} options
 * @returns {Promise<DeprecatedPackage[]>}
 */
export async function getDeprecatedPackages(options) {
	const packages = await obtainDeprecation(options);
	const [hierarchy, aliases] = await Promise.all([
		obtainHierarchy(options),
		obtainAliases(),
	]);

	for (const pkg of packages) {
		pkg.paths = findPackagePaths(pkg, hierarchy, aliases);
	}

	return packages;
}

/**
 * @param {Options} options
 * @returns {Promise<DeprecatedPackage[]>}
 */
async function obtainDeprecation(options) {
	return new Promise((resolve, reject) => {
		const process = spawn(
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

		process.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve(deprecations.filter(unique));
			} else {
				reject("execution failed");
			}
		});
	});
}

/**
 * @param {Options} options
 * @returns {Promise<PackageHierarchy>}
 */
function obtainHierarchy(options) {
	const optionalArgs = [
		...(options.omitDev ? ["--omit", "dev"] : []),
		...(options.omitOptional ? ["--omit", "optional"] : []),
		...(options.omitPeer ? ["--omit", "peer"] : []),
	].join(" ");

	return new Promise((resolve, reject) =>
		exec(
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
	);
}

/**
 * `"foo": "npm:bar@3.1.4"` will result in a mapping from `foo` to `bar@3.1.4`.
 *
 * @returns {Promise<Aliases>}
 */
async function obtainAliases() {
	const rawManifest = await readFile("./package.json", { encoding: "utf-8" });
	const manifest = JSON.parse(rawManifest);

	const aliases = new Map();
	for (const deps of [
		manifest.dependencies || {},
		manifest.devDependencies || {},
	]) {
		for (const [name, rhs] of Object.entries(deps)) {
			const aliasMatch = /^npm:(@?.+?)@(.+)$/.exec(rhs);
			if (aliasMatch) {
				const [, alias, version] = aliasMatch;
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
	const dependencies = hierarchy.dependencies;
	if (!dependencies) {
		return [];
	}

	const paths = [];
	for (const [name_, info] of Object.entries(dependencies)) {
		const alias = aliases.get(name_);

		const name = alias === undefined ? name_ : alias.name;
		const version = info.version;
		const path_ = [...path, { name, version }];

		if (name === pkg.name && version === pkg.version) {
			paths.push(path_);
		} else {
			paths.push(...findPackagePaths(pkg, info, aliases, path_));
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
	let pkg, reason, name, version;

	{
		const i = str.indexOf(":");
		pkg = str.substring(0, i);
		reason = str.substring(i + 1, /* end */).trim();
	}

	{
		const i = pkg.lastIndexOf("@");
		name = pkg.substring(0, i);
		version = pkg.substring(i + 1, /* end */);
	}

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

/** @typedef {Map<string, Package>} Aliases */
/** @typedef {Package[]} PackagePath */
