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

import { Err, Ok } from "./result.js";

/**
 * @param {PackageManager} pm
 * @returns {Promise<Result<DeprecatedPackage[], string>>}
 */
export async function getDeprecatedPackages(pm) {
	const packages = await pm.deprecations();
	const [aliases, hierarchy] = await Promise.all([
		pm.aliases(),
		pm.hierarchy(),
	]);

	const err = packages.and(aliases).and(hierarchy);
	if (err.isErr()) {
		return new Err(err.error());
	}

	if (hierarchy.value().dependencies) {
		delete hierarchy.value().dependencies[hierarchy.value().name];
	}

	for (const pkg of packages.value()) {
		pkg.paths = findPackagePaths(pkg, hierarchy.value(), aliases.value());
	}

	return new Ok(packages.value());
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
 * @typedef {Package & _Deprecation} DeprecatedPackage
 */

/**
 * @typedef _Deprecation
 * @property {PackagePath[]} paths
 * @property {string} reason
 */

/**
 * @typedef Package
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef {Package[]} PackagePath
 */

/**
 * @typedef PackageManager
 * @property {function(): Promise<Result<Aliases, string>>} aliases
 * @property {function(): Promise<Result<DeprecatedPackage[], string>>} deprecations
 * @property {function(): Promise<Result<PackageHierarchy, string>>} hierarchy
 */

/** @typedef {import("./npm.js").Aliases} Aliases */
/** @typedef {import("./npm.js").PackageHierarchy} PackageHierarchy */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
