// Copyright (C) 2024-2026  Eric Cornelissen
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
export async function getConfig(fs) {
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
 * @param {boolean} isRoot
 * @returns {Option<string[]>}
 */
function validateConfig(config, isRoot=true) {
	if (typeOf(config) !== types.object) {
		return new Some(["config must be an object"]);
	}

	const problems = [
		...validateChildren(config, isRoot),
		...validateDirectives(config, isRoot),
		...validateKeys(config),
	];

	if (problems.length > 0) {
		return new Some(problems);
	}

	return None;
}

/**
 * @param {Config} config
 * @param {boolean} isRoot
 * @returns {string[]}
 */
function validateChildren(config, isRoot) {
	const children = Object.entries(config).filter(([key]) => !isDirective(key));
	if (children.length === 0 && !Object.hasOwn(config, "#ignore") && !isRoot) {
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
 * @param {boolean} isRoot
 * @returns {string[]}
 */
function validateDirectives(config, isRoot) {
	const directives = Object.entries(config).filter(([key]) => isDirective(key));

	const problems = [];
	for (const [key, value] of directives) {
		if (isRoot) {
			problems.push(`unexpected directive '${key}' in the root`);
		} else {
			const problem = validateDirective(config, key, value);
			if (problem.isSome()) {
				problems.push(problem.value());
			}
		}
	}

	return problems;
}

/**
 * @param {Config} config
 * @param {string} key
 * @param {unknown} value
 * @returns {Option<string>}
 */
function validateDirective(config, key, value) {
	const type = typeOf(value);
	switch (key) {
		case "#expire":
			if (!Object.hasOwn(config, "#ignore")) {
				return new Some("has '#expire' without '#ignore'");
			}

			if (type !== types.string) {
				return new Some(`unexpected type for '#expire': ${type}`);
			}

			break;
		case "#ignore":
			if (!(type === types.boolean || type === types.string)) {
				return new Some(`unexpected type for '#ignore': ${type}`);
			}

			if (value.length === 0) {
				return new Some("cannot use empty string for '#ignore'");
			}

			break;
		case "#scope": {
			if (type !== types.array) {
				return new Some(`unexpected type for '#scope': ${type}`);
			}

			if (value.length === 0) {
				return new Some("the '#scope' directive may not be empty");
			}

			const wrong = value.find(scope => !isScope(scope));
			if (wrong !== undefined) {
				return new Some(`unexpected '#scope' entry: ${wrong}`);
			}

			break;
		}
		default:
			return new Some(`unknown directive '${key}'`);
	}

	return None;
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

		const index = key.lastIndexOf("@");
		if (index === -1 || index === 0) {
			problems.push(`invalid rule name '${key}'`);
			continue;
		}

		const version = key.slice(index);
		if (version.length === 1) {
			problems.push(`missing version for '${key.slice(0, index)}'`);
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
