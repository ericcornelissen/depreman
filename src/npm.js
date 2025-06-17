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
 * @type {NPM}
 */
export class NPM {
	/**
	 * @type {ExecCP}
	 */
	#cp;

	/**
	 * @type {ReadFS}
	 */
	#fs;

	/**
	 * @param {Object} p
	 * @param {ExecCP} p.cp
	 * @param {ReadFS} p.fs
	 */
	constructor({ cp, fs }) {
		this.#cp = cp;
		this.#fs = fs;
	}

	/**
	 * @param {InstallOptions} options
	 * @returns {Promise<Result<Object, string>>}
	 */
	async install(options) {
		const hasLockfile = await this.#hasLockfile();

		const cmd = "npm";
		const args = [
			(hasLockfile ? "clean-install" : "install"),
			"--no-audit",
			"--no-fund",
			"--no-update-notifier",
		];

		if (options.omitDev) {
			args.push("--omit", "dev");
		}
		if (options.omitOptional) {
			args.push("--omit", "optional");
		}
		if (options.omitPeer) {
			args.push("--omit", "peer");
		}

		const result = await this.#cp.exec(cmd, args);
		if (result.isErr()) {
			const { exitCode, stderr } = result.error();
			return new Err(`npm install failed with code ${exitCode}:\n${stderr}`);
		}

		const { stderr } = result.value();
		return new Ok(stderr);
	}

	/**
	 * @param {ListOptions} options
	 * @returns {Promise<Result<Object, string>>}
	 */
	async list(options) {
		const cmd = "npm";
		const args = [
			"list",
			"--all",
			"--json",
		];

		if (options.omitDev) {
			args.push("--omit", "dev");
		}
		if (options.omitOptional) {
			args.push("--omit", "optional");
		}
		if (options.omitPeer) {
			args.push("--omit", "peer");
		}

		const result = await this.#cp.exec(cmd, args);
		if (result.isErr()) {
			const { exitCode, stderr } = result.error();
			return new Err(`npm list failed with code ${exitCode}:\n${stderr}`);
		}

		const { stdout } = result.value();
		const hierarchy = JSON.parse(stdout);
		return new Ok(hierarchy);
	}

	/**
   * @returns {Promise<boolean>}
	 */
	async #hasLockfile() {
		return await this.#fs.access("./package-lock.json");
	}
}

/**
 * @typedef NPM
 * @property {Install} install
 * @property {List} list
 */

/**
 * @typedef {function(InstallOptions): Promise<Result<string, string>>} Install
 * @typedef {function(ListOptions): Promise<Result<Object, string>>} List
 *
 * @typedef InstallOptions
 * @property {boolean} omitDev
 * @property {boolean} omitOptional
 * @property {boolean} omitPeer
 *
 * @typedef ListOptions
 * @property {boolean} omitDev
 * @property {boolean} omitOptional
 * @property {boolean} omitPeer
 */

/**
 * @typedef {import("./cp.js").ExecCP} ExecCP
 * @typedef {import("./fs.js").ReadFS} ReadFS
 *
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
