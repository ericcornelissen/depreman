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

import { None, Some } from "./option.js";

/**
 * @param {Object} p
 * @param {ReadFS} p.fs
 * @param {ChildProcess} p.cp
 * @param {Options} p.options
 * @returns {Promise<DeprecatedPackage[]>}
 */
export async function getDeprecatedPackages({ cp, fs, options }) {
	const packages = await obtainDeprecation({ cp, fs, options });
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
 * @param {ReadFS} p.fs
 * @param {Options} p.options
 * @returns {Promise<DeprecatedPackage[]>}
 */
async function obtainDeprecation({ cp, fs, options }) {
	const cleanInstall = await hasLockfile(fs);
	const args = [
		(cleanInstall ? "clean-install" : "install"),
		"--no-audit",
		"--no-fund",
		"--no-update-notifier",
	];

	if (options.omitDev) {
		args.push("--omit", "dev");
	}
	if (options.omitOptional) {
		args.push("--omit", "optional");
	}
	if (options.omitPeer) {
		args.push("--omit", "peer");
	}

	const result = await cp.exec("npm", args);
	if (result.isErr()) {
		const { stderr } = result.error();
		throw new Error(`npm install failed:\n${stderr}`);
	}

	const { stderr } = result.value();
	const deprecations = [];
	for (const line of stderr.split(/\n/u)) {
		const deprecation = parseDeprecationWarning(line);
		if (deprecation.isSome()) {
			deprecations.push(deprecation.value());
		}
	}

	return deprecations.filter(unique);
}

/**
 * @param {Object} p
 * @param {ChildProcess} p.cp
 * @param {Options} p.options
 * @returns {Promise<PackageHierarchy>}
 */
async function obtainHierarchy({ cp, options }) {
	const args = [
		"list",
		"--all",
		"--json",
	];

	if (options.omitDev) {
		args.push("--omit", "dev");
	}
	if (options.omitOptional) {
		args.push("--omit", "optional");
	}
	if (options.omitPeer) {
		args.push("--omit", "peer");
	}

	const result = await cp.exec("npm", args);
	if (result.isErr()) {
		const { stderr } = result.error();
		throw new Error(`npm list failed:\n${stderr}`);
	}

	const { stdout } = result.value();
	const hierarchy = JSON.parse(stdout);
	if (hierarchy.dependencies) {
		delete hierarchy.dependencies[hierarchy.name];
	}

	return hierarchy;
}

/**
 * `"foo": "npm:bar@3.1.4"` will result in a mapping from `foo` to `bar@3.1.4`.
 *
 * @param {Object} p
 * @param {ReadFS} p.fs
 * @returns {Promise<Aliases>}
 */
async function obtainAliases({ fs }) {
	const rawManifest = await fs.readFile("./package.json");
	if (rawManifest.isErr()) {
		throw new Error(`could not get package.json: ${rawManifest.error()}`);
	}

	const manifest = JSON.parse(rawManifest.value());

	const aliases = new Map();
	for (const deps of [
		manifest.dependencies || {},
		manifest.devDependencies || {},
	]) {
		for (const [name, rhs] of Object.entries(deps)) {
			const aliasMatch = /npm:(?<alias>@?[^@]+)@(?<version>.+)/u.exec(rhs);
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
		const dep = aliases.has(depName)
			? aliases.get(depName)
			: { name: depName, version: depInfo.version };

		const depPath = [...path, dep];
		if (dep.name === pkg.name && dep.version === pkg.version) {
			paths.push(depPath);
		} else {
			paths.push(...findPackagePaths(pkg, depInfo, aliases, depPath));
		}
	}

	return paths;
}

/**
 * @param {string} line
 * @returns {Option<DeprecatedPackage>}
 */
function parseDeprecationWarning(line) {
	const prefix = "npm warn deprecated ";
	if (!line.toLowerCase().startsWith(prefix)) {
		return None;
	}

	const str = line.slice(prefix.length);

	let i = str.indexOf(":");
	const pkg = str.slice(0, i);
	const reason = str.slice(i + 1).trim();

	i = pkg.lastIndexOf("@");
	const name = pkg.slice(0, i);
	const version = pkg.slice(i + 1);

	return new Some({ name, version, reason });
}

/**
 * @param {ReadFS} fs
 * @returns {Promise<boolean>}
 */
async function hasLockfile(fs) {
	return await fs.access("./package-lock.json");
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
/** @typedef {Package[]} PackagePath */
/** @typedef {function(string, string[], Object): Object} Spawn */

/** @typedef {import("./fs.js").ReadFS} ReadFS */

/**
 * @template T
 * @typedef {import("./option.js").Option<T>} Option
 */
