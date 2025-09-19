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

import { parseJSON } from "./json.js";
import { Object } from "./object.js";
import { None, Some } from "./option.js";
import { Err, Ok } from "./result.js";

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
	 * @type {Options}
	 */
	#options;

	/**
	 * @param {object} p
	 * @param {ExecCP} p.cp
	 * @param {ReadFS} p.fs
	 * @param {Options} p.options
	 */
	constructor({ cp, fs, options }) {
		this.#cp = cp;
		this.#fs = fs;
		this.#options = options;
	}

	/**
	 * @returns {Promise<Result<Aliases, string>>}
	 */
	async aliases() {
		const manifest = await this.#getManifest();
		if (manifest.isErr()) {
			return new Err(`could not get manifest: ${manifest.error()}`);
		}

		const aliases = new Map();
		for (const deps of [
			manifest.value().dependencies,
			manifest.value().devDependencies,
			manifest.value().optionalDependencies,
			manifest.value().peerDependencies,
		]) {
			for (const [name, rhs] of Object.entries(deps)) {
				const aliasMatch = /npm:(?<alias>@?[^@]+)@(?<version>.+)/u.exec(rhs);
				if (aliasMatch) {
					const { alias, version } = aliasMatch.groups;
					aliases.set(name, { name: alias, version });
				}
			}
		}

		return new Ok(aliases);
	}

	/**
	 * @returns {Promise<Result<DeprecatedPackage[], string>>}
	 */
	async deprecations() {
		const result = await this.install();
		if (result.isErr()) {
			return result;
		}

		const { stderr } = result.value();
		const deprecations = [];
		for (const line of stderr.split(/\n/u)) {
			const deprecation = this.#parseDeprecationWarning(line);
			if (deprecation.isSome()) {
				deprecations.push(deprecation.value());
			}
		}

		return new Ok(deprecations);
	}

	/**
	 * @returns {Promise<Result<PackageHierarchy, string>>}
	 */
	async hierarchy() {
		const cmd = "npm";
		const args = [
			"list",
			"--all",
			"--json",
		];

		if (this.#options.omitDev) {
			args.push("--omit", "dev");
		}
		if (this.#options.omitOptional) {
			args.push("--omit", "optional");
		}
		if (this.#options.omitPeer) {
			args.push("--omit", "peer");
		}

		const result = await this.#cp.exec(cmd, args);
		const hierarchy = result
			.map(({ stdout }) => stdout)
			.mapErr(({ stderr }) => stderr)
			.andThen((stdout) => parseJSON(stdout));
		if (hierarchy.isErr()) {
			return new Err(`npm list failed:\n${hierarchy.error()}`);
		}

		return hierarchy;
	}

	/**
	 * @returns {Promise<Result<{stdout: string, stderr: string}, string>>}
	 */
	async install() {
		const hasLockfile = await this.#hasLockfile();

		const cmd = "npm";
		const args = [
			(hasLockfile ? "clean-install" : "install"),
			"--no-audit",
			"--no-fund",
			"--no-update-notifier",
		];

		if (this.#options.omitDev) {
			args.push("--omit", "dev");
		}
		if (this.#options.omitOptional) {
			args.push("--omit", "optional");
		}
		if (this.#options.omitPeer) {
			args.push("--omit", "peer");
		}

		const result = await this.#cp.exec(cmd, args);
		if (result.isErr()) {
			const { stderr } = result.error();
			return new Err(`npm install failed:\n${stderr}`);
		}

		return result;
	}

	/**
	 * @returns {Promise<Manifest>}
	 */
	async #getManifest() {
		const rawManifest = await this.#fs.readFile("./package.json");
		if (rawManifest.isErr()) {
			return new Err(`could not read package.json: ${rawManifest.error()}`);
		}

		const manifest = parseJSON(rawManifest.value());
		if (manifest.isErr()) {
			return new Err(`could not parse package.json: ${manifest.error()}`);
		}

		return manifest;
	}

	/**
	 * @returns {Promise<boolean>}
	 */
	async #hasLockfile() {
		return await this.#fs.access("./package-lock.json");
	}

	/**
	 * @param {string} line
	 * @returns {Option<DeprecatedPackage>}
	 */
	#parseDeprecationWarning(line) {
		const prefix = "npm warn deprecated ";
		if (!line.toLowerCase().startsWith(prefix)) {
			return None;
		}

		const str = line.slice(prefix.length);

		let i = str.indexOf(":");
		const pkg = str.slice(0, i);
		const reason = str.slice(i + 1).trim();

		i = pkg.lastIndexOf("@");
		const name = pkg.slice(0, i);
		const version = pkg.slice(i + 1);

		return new Some({ name, version, reason });
	}
}

/**
 * @typedef {Map<string, Package>} Aliases
 */

/**
 * @typedef Dependency
 * @property {{[key: string]: Dependency}} dependencies
 * @property {string} version
 */

/**
 * @typedef {Package & Deprecation} DeprecatedPackage
 */

/**
 * @typedef Deprecation
 * @property {string} reason
 */

/**
 * @typedef Manifest
 * @property {{[key: string]: string} | undefined} dependencies
 * @property {{[key: string]: string} | undefined} devDependencies
 * @property {{[key: string]: string} | undefined} optionalDependencies
 * @property {{[key: string]: string} | undefined} peerDependencies
 */

/**
 * @typedef Options
 * @property {boolean} omitDev
 * @property {boolean} omitOptional
 * @property {boolean} omitPeer
 */

/**
 * @typedef Package
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef PackageHierarchy
 * @property {{[key: string]: Dependency}} dependencies
 * @property {string} name
 * @property {string} version
 */

/**
 * @template T
 * @typedef {import("./option.js").Option<T>} Option
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */

/** @typedef {import("./cp.js").ExecCP} ExecCP */
/** @typedef {import("./fs.js").ReadFS} ReadFS */
