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
import { Err, Ok } from "./result.js";

/**
 * @param {FileSystem} fs
 * @returns {Promise<Config>}
 * @throws {Error}
 */
export async function getConfiguration(fs) {
	const rawConfig = await readConfigFile({ fs, file: "./.ndmrc" });
	if (rawConfig.isErr()) {
		throw new Error(rawConfig.error());
	}

	const config = parseRawConfig(rawConfig.value());
	if (config.isErr()) {
		throw new Error(config.error());
	}

	const problems = validateConfig(config.value());
	if (problems.isSome()) {
		throw new Error(problems.value().join("\n"));
	}

	return config.value();
}

/**
 * @param {Object} p
 * @param {string} p.file
 * @param {FileSystem} p.fs
 * @returns {Promise<Result<string, string>>}
 */
async function readConfigFile({ file, fs }) {
	try {
		const content = await fs.readFile(file);
		return new Ok(content);
	} catch {
		return new Err("Configuration file .ndmrc not found");
	}
}

/**
 * @param {Object} p
 * @param {string} p.file
 * @param {FileSystem} p.fs
 * @returns {Result<Config, string>}
 */
function parseRawConfig(raw) {
	try {
		const parsed = JSON.parse(raw);
		return new Ok(parsed);
	} catch (error) {
		return new Err(`Configuration file invalid (${error.message})`);
	}
}

/**
 * @param {Config} config
 * @returns {Option<string[]>}
 */
function validateConfig(config, root=true) {
	if (typeOf(config) !== "object") {
		return new Some(["config must be an object"]);
	}

	const problems = [];
	for (const [key, value] of Object.entries(config)) {
		if (isDirective(key)) {
			if (root) {
				problems.push(`unexpected directive '${key}' in the root`);
			} else {
				const type = typeOf(value)
				switch (key) {
				case "#expire":
					if (!Object.hasOwn(config, "#ignore")) {
						problems.push(`has '#expire' without '#ignore'`);
					} else if (type !== "string") {
						problems.push(`unexpected type for '#expire': ${type}`);
					}

					break;
				case "#ignore":
					if (!(type === "boolean" || type === "string")) {
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
 * @param {any} value
 * @return {string}
 */
function typeOf(value) {
	if (value === null) {
		return "null";
	}

	if (Array.isArray(value)) {
		return "array";
	}

	return typeof value;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isDirective(key) {
	return key.startsWith("#");
}

/**
 * @typedef {{
 *   "#ignore": boolean | string,
 *   "#expire": string,
 *   "*": Config,
 *   "+": Config,
 *   [key: string]: Config,
 * }} Config
 */

/**
 * @typedef FileSystem
 * @property {ReadFile} readFile
 */

/** @typedef {function(string): Promise<string>} ReadFile */

/**
 * @template T
 * @typedef {import("./option.js").Option<T>} Option
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
