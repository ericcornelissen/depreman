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

import { Err, Ok } from "./result.js";

export class FS {
	/**
	 * @type {fs}
	 */
	#fs;

	/**
	 * @param {fs} fs
	 */
	constructor(fs) {
		this.#fs = fs;
	}

	/**
	 * @param {string} filepath
	 * @returns {Promise<boolean>}
	 */
	async access(filepath) {
		try {
			await this.#fs.access(filepath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * @param {string} filepath
	 * @returns {Promise<Result<string, string>>}
	 */
	async readFile(filepath) {
		const options = { encoding: "utf8" };
		try {
			const content = await this.#fs.readFile(filepath, options);
			return new Ok(content);
		} catch (error) {
			return new Err(error.message);
		}
	}
}

/**
 * @typedef ReadFS
 * @property {AccessFile} access
 * @property {ReadFile} readFile
 */

/** @typedef {function(string): Promise<boolean>} AccessFile */
/** @typedef {function(string): Promise<Result<string, string>>} ReadFile */

/**
 * @typedef fs
 * @property {function(string): Promise<boolean>} access
 * @property {function(string, { encoding: string }): Promise<string>} readFile
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
