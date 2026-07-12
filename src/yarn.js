// Copyright (C) 2025-2026  Eric Cornelissen
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

import { parseJSON } from "./json.js";
import { Err, Ok } from "./result.js";

export class Yarn {
	/**
	 * @type {ExecCP}
	 */
	#cp;

	/**
	 * @param {object} p
	 * @param {ExecCP} p.cp
	 */
	constructor({ cp }) {
		// NOTE: Support for options is not yet supported for Yarn.
		this.#cp = cp;
	}

	/**
	 * @returns {Result<Aliases, string>}
	 */
	aliases() {
		// NOTE: Support for resolving aliases is not yet supported for Yarn.
		return new Ok(new Map());
	}

	/**
	 * @returns {Promise<Result<DeprecatedPackage[], string>>}
	 */
	async deprecations() {
		const cmd = "yarn";
		const args = [
			"npm",
			"audit",
			"--recursive",
			"--json",
		];

		const result = await this.#cp.exec(cmd, args);
		if (result.isOk()) {
			return new Ok([]);
		}

		const { stdout } = result.error();
		const lines = stdout.trim().split("\n");
		const deprecations = [];
		for (const line of lines) {
			const json = parseJSON(line);
			if (json.isErr()) {
				const error = json.error();
				return new Err(`yarn npm audit output not JSON: ${error}`);
			}

			const advisory = json.value();
			if (!advisory.children.ID.endsWith(" (deprecation)")) {
				continue;
			}

			const versions = advisory.children["Tree Versions"];
			for (const version of versions) {
				deprecations.push({
					name: advisory.value,
					version,
					reason: advisory.children.Issue,
				});
			}
		}

		return new Ok(deprecations);
	}

	/**
	 * @returns {Promise<Result<PackageHierarchy, string>>}
	 */
	async hierarchy() {
		const cmd = "yarn";
		const args = [
			"info",
			"--recursive",
			"--json",
		];

		const result = await this.#cp.exec(cmd, args);
		if (result.isErr()) {
			const { stderr } = result.error();
			return new Err(`yarn info failed:\n${stderr}`);
		}

		const { stdout } = result.value();
		const lines = stdout.trim().split("\n");
		const dependencies = new Map();
		for (const line of lines) {
			const json = parseJSON(line);
			if (json.isErr()) {
				const error = json.error();
				return new Err(`yarn info output not JSON: ${error}`);
			}

			const dependency = json.value();
			dependencies.set(
				dependency.value,
				dependency.children.Dependencies?.map(({ locator }) => locator),
			);
		}

		const rootLine = lines.findLast(() => true);
		const rootJson = parseJSON(rootLine).value();
		const root = rootJson.value;

		const hierarchy = { dependencies: {} };
		const queue = [[root, hierarchy]];
		while (queue.length > 0) {
			const [id, object] = queue.pop();

			const transitives = dependencies.get(id) || [];
			for (const dependency of transitives) {
				const { name, version } = parseLocator(dependency);
				object.dependencies[name] = {
					version,
					dependencies: {},
				};

				queue.push([dependency, object.dependencies[name]]);
			}
		}

		return new Ok(hierarchy);
	}
}

/**
 * @param {string} locator
 * @returns {Package}
 */
function parseLocator(locator) {
	const match = /^(?<name>.+)@[^@]+:(?<version>[^:]+)/u.exec(locator);
	return match.groups;
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

/** @import { ExecCP } from "./cp.js" */
/** @import { Result } from "./result.js" */
