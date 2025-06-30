// Copyright (C) 2025  Eric Cornelissen
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

import { Err } from "./result.js";

export class Yarn {
	/**
	 * @returns {Promise<Result<Aliases, string>>}
	 */
	aliases() {
		return new Err("not implemented");
	}

	/**
	 * @returns {Promise<Result<DeprecatedPackage[], string>>}
	 */
	deprecations() {
		return new Err("not implemented");
	}

	/**
	 * @returns {Promise<Result<PackageHierarchy, string>>}
	 */
	hierarchy() {
		return new Err("not implemented");
	}
}

/**
 * @typedef {Map<string, Package>} Aliases
 */

/**
 * @typedef Deprecation
 * @property {string} reason
 */

/**
 * @typedef {Package & Deprecation} DeprecatedPackage
 */

/**
 * @typedef Package
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef PackageHierarchy
 * @property {{[key: string]: HierarchyDependency}} dependencies
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef HierarchyDependency
 * @property {{[key: string]: HierarchyDependency}} dependencies
 * @property {string} version
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
