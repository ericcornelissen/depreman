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

import { parseJSON } from "./json.js";
import { Object } from "./object.js";
import { None, Some } from "./option.js";
import { Err } from "./result.js";
import { typeOf, types } from "./types.js";

/**
 * @param {ReadFS} fs
 * @returns {Promise<Result<Config, string>>}
 */
export async function getConfiguration(fs) {
	const rawConfig = await fs.readFile("./.ndmrc");
	if (rawConfig.isErr()) {
		return new Err(`could not get .ndmrc: ${rawConfig.error()}`);
	}

	const config = parseJSON(rawConfig.value());
	if (config.isErr()) {
		return new Err(`Configuration file invalid (${config.error()})`);
	}

	const problems = validateConfig(config.value());
	if (problems.isSome()) {
		return new Err(problems.value().join("\n"));
	}

	return config;
}

/**
 * @param {Config} config
 * @param {boolean} root
 * @returns {Option<string[]>}
 */
function validateConfig(config, root=true) {
	if (typeOf(config) !== types.object) {
		return new Some(["config must be an object"]);
	}

	const problems = [
		...validateChildren(config, root),
		...validateDirectives(config, root),
		...validateKeys(config),
	];

	if (problems.length > 0) {
		return new Some(problems);
	}

	return None;
}

/**
 * @param {Config} config
 * @param {boolean} root
 * @returns {string[]}
 */
function validateChildren(config, root) {
	const children = Object.entries(config).filter(([key]) => !isDirective(key));
	if (children.length === 0 && !Object.hasOwn(config, "#ignore") && !root) {
		return ["ineffective leaf (no '#ignore' found)"];
	}

	const problems = [];
	for (const [key, value] of children) {
		const subProblems = validateConfig(value, false);
		if (subProblems.isSome()) {
			problems.push(
				...subProblems.value().map(problem => `${key}: ${problem}`),
			);
		}
	}

	return problems;
}

/**
 * @param {Config} config
 * @param {boolean} root
 * @returns {string[]}
 */
function validateDirectives(config, root) {
	const directives = Object.entries(config).filter(([key]) => isDirective(key));

	const problems = [];
	for (const [key, value] of directives) {
		if (root) {
			problems.push(`unexpected directive '${key}' in the root`);
		} else {
			const type = typeOf(value);
			switch (key) {
				case "#expire":
					if (!Object.hasOwn(config, "#ignore")) {
						problems.push(`has '#expire' without '#ignore'`);
					} else if (type !== types.string) {
						problems.push(`unexpected type for '#expire': ${type}`);
					}

					break;
				case "#ignore":
					if (!(type === types.boolean || type === types.string)) {
						problems.push(`unexpected type for '#ignore': ${type}`);
					} else if (value.length === 0) {
						problems.push("cannot use empty string for '#ignore'");
					}
					break;
				case "#scope":
					if (type === types.array) {
						if (value.length === 0) {
							problems.push("the '#scope' directive may not be empty");
						}

						const wrong = value.find(scope => !isScope(scope));
						if (wrong !== undefined) {
							problems.push(`unexpected '#scope' entry: ${wrong}`);
						}
					} else {
						problems.push(`unexpected type for '#scope': ${type}`);
					}
					break;
				default:
					problems.push(`unknown directive '${key}'`);
			}
		}
	}

	return problems;
}

/**
 * @param {Config} config
 * @returns {string[]}
 */
function validateKeys(config) {
	const problems = [];
	for (const key of Object.keys(config)) {
		if (isDirective(key) || isWildcard(key)) {
			continue;
		}

		const i = key.lastIndexOf("@");
		if (i === -1 || i === 0) {
			problems.push(`invalid rule name '${key}'`);
			continue;
		}

		const version = key.slice(i);
		if (version.length === 1) {
			problems.push(`missing version for '${key.slice(0, i)}'`);
			continue;
		}
	}

	return problems;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isDirective(key) {
	return key.startsWith("#");
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isWildcard(key) {
	return key === "*" || key === "+";
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isScope(value) {
	return ["dev", "optional", "peer", "prod"].includes(value);
}

/**
 * @typedef {{"#expire": string, "#ignore": boolean | string, "#scope": Scope[], "*": Config, "+": Config, [key: string]: Config}} Config
 */

/**
 * @typedef {"dev" | "optional" | "peer" | "prod"} Scope
 */

/** @import { ReadFS } from "./fs.js" */
/** @import { Option } from "./option.js" */
/** @import { Result } from "./result.js" */
