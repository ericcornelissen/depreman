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

	const children = Object.keys(config).filter(key => !isDirective(key));
	if (children.length === 0 && !Object.hasOwn(config, "#ignore") && !root) {
		return new Some(["ineffective leaf (no '#ignore' found)"]);
	}
	const problems = [];
	for (const [key, value] of Object.entries(config)) {
		if (isDirective(key)) {
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
					}
					break;
				default:
					problems.push(`unknown directive '${key}'`);
				}
			}
		} else {
			const subProblems = validateConfig(value, false);
			if (subProblems.isSome()) {
				problems.push(
					...subProblems.value().map(problem => `${key}: ${problem}`),
				);
			}
		}
	}

	if (problems.length > 0) {
		return new Some(problems);
	}

	return None;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isDirective(key) {
	return key.startsWith("#");
}

/**
 * @typedef Config
 * @property {boolean | string} ["#ignore"]
 * @property {string} ["#expire"]
 * @property {Config} ["*"]
 * @property {Config} ["+"]
 * @property {Config} [key]
 */

/** @typedef {import("./fs.js").ReadFS} ReadFS */

/**
 * @template T
 * @typedef {import("./option.js").Option<T>} Option
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
