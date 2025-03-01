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
 * @typedef {Object} Config
 * @property {boolean | string | undefined} '+'
 * @property {boolean | string | undefined} '*'
 * @property {Config} [key]
 */

/**
 * @typedef FileSystem
 * @property {ReadFile} readFile
 */

/** @typedef {function(string): Promise<string>} ReadFile */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 * */
