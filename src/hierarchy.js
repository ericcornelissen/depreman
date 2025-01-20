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

import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";

/**
 * Enhance deprecation information with the dependency paths for the current
 * project.
 *
 * @param {NpmCliOptions} options The configuration for the npm CLI.
 * @returns {function(Package[]): Promise<Deprecation[]>} A function to map {@link Package}s to {@link Deprecation}s.
 */
export function obtainDependencyPaths(options) {
	return async function obtainDependencyPaths(packages) {
		const [hierarchy, aliases] = await Promise.all([
			obtainHierarchy(options),
			obtainAliases(),
		]);

		const result = [];
		for (const pkg of packages) {
			result.push({
				...pkg,
				paths: findEach(hierarchy, aliases, pkg),
			});
		}

		return result;
	}
}

function findEach(hierarchy, aliases, pkg, path = []) {
	const found = [];
	if (hierarchy.dependencies) {
		for (const [_name, info] of Object.entries(hierarchy.dependencies)) {
			const alias = aliases.get(_name);
			const [name, version] = (
				alias === undefined
					? [_name, info.version]
					: [alias.name, alias.version]
			);

			if (name === pkg.name && version === pkg.version) {
				found.push([...path, pkg]);
			} else {
				found.push(
					...findEach(info, aliases, pkg, [...path, { name, version }]),
				);
			}

		}
	}

	return found;
}

/**
 * Obtain a mapping of dependencies to their aliases.
 *
 * For example creates a mapping from `foo` to `bar@3.1.4` for `"foo":
 * "npm:bar@3.1.4"`.
 *
 * @returns {Promise<AliasMap>} A mapping of dependencies to their aliases.
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
 * Obtain the dependency hierarchy of the current project.
 *
 * @param {NpmCliOptions} options The configuration for the npm CLI.
 * @returns {Promise<Object>} The dependency hierarchy of the current project.
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

/** @typedef {import("./deprecations.js").NpmCliOptions} NpmCliOptions */
/** @typedef {import("./deprecations.js").Deprecation} Package */

/**
 * @typedef _Deprecation
 * @property {string[]} paths All paths at which the deprecate dependency is present.
 *
 * @typedef {Package & _Deprecation} Deprecation
 */

/**
 * @typedef {Map<string, { name: string, version: string }>} AliasMap
 */
