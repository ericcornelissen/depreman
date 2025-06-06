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

import { mock } from "node:test";

import { Err, Ok } from "./result.js";

/**
 * @type {ExecCP}
 */
export class CP {
	/**
	 * @param {Object<string, MockCommand>} commands
	 */
	constructor(commands) {
		this.exec = mock.fn((cmd, args) => {
			const want = `${cmd} ${args.join(" ")}`;
			for (const command in commands) {
				if (want.includes(command)) {
					const { error, stdout, stderr } = commands[command];
					const result = {
						exitCode: error ? 1 : 0,
						stderr: stderr || "",
						stdout: stdout || "",
					};

					if (error) {
						const err = new Err(result);
						return Promise.resolve(err);
					}

					const ok = new Ok(result);
					return Promise.resolve(ok);
				}
			}

			throw new Error(`command not found '${want}'`);
		});
	}
}

/**
 * @typedef MockCommand
 * @property {boolean} [error]
 * @property {string} [stdout]
 * @property {string} [stderr]
 */

/** @typedef {import("./cp.js").ExecCP} ExecCP */
