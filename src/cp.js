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
		return new Promise((resolve) => {
			this.#cp.exec(
				`${cmd} ${args.join(" ")}`,
				(error, stdout, stderr) => {
					const result = {
						stdout: stdout.toString(),
						stderr: stderr.toString(),
					};

					if (error) {
						const err = new Err(result);
						resolve(err);
					}

					const ok = new Ok(result);
					resolve(ok);
				},
			);
		});
	}
}

/**
 * @typedef ExecCP
 * @property {Exec} exec
 */

/**
 * @typedef {function(string, string[]): Promise<Result<Output, Output>>} Exec
 */

/**
 * @typedef Output
 * @property {string} stderr
 * @property {string} stdout
 */

/**
 * @typedef cp
 * @property {function(string, execCallback): void} exec
 * @property {function(Error, string, string): void} execCallback
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
