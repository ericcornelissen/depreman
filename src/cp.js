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

/**
 * @type {ExecCP}
 */
export class CP {
	/**
	 * @type {cp}
	 */
	#cp;

	/**
	 * @param {cp} cp
	 */
	constructor(cp) {
		this.#cp = cp;
	}

	/**
	 * @param {string} cmd
	 * @param {string[]} args
	 * @returns {Promise<Result<Output, Output>>}
	 */
	exec(cmd, args) {
		const opts = {
			shell: false,
		};

		return new Promise((resolve) => {
			const process = this.#cp.spawn(cmd, args, opts);

			const stdout = [];
			process.stdout.on("data", (fragment) => {
				stdout.push(fragment);
			});

			const stderr = [];
			process.stderr.on("data", (fragment) => {
				stderr.push(fragment);
			});

			process.on("close", (exitCode) => {
				const result = {
					exitCode,
					stdout: stdout.join(""),
					stderr: stderr.join(""),
				};

				if (exitCode !== 0) {
					const err = new Err(result);
					resolve(err);
				}

				const ok = new Ok(result);
				resolve(ok);
			});
		});
	}
}

/**
 * @typedef ExecCP
 * @property {Exec} exec
 *
 * @typedef {function(string, string[]): Promise<Result<Output, Output>>} Exec
 *
 * @typedef Output
 * @property {number} exitCode
 * @property {string} stderr
 * @property {string} stdout
 */

/**
 * @typedef cp
 * @property {function(string, string[], options): process} spawn
 *
 * @typedef options
 * @property {boolean} shell
 *
 * @typedef process
 * @property {function(string, function(number, string): null)} on
 * @property {stream} stdout
 *
 * @typedef stream
 * @property {function(string, function(Buffer): null)} on
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
