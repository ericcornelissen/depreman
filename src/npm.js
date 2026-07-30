// Copyright (C) 2025-2026  Eric Cornelissen
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

import * as os from "node:os";

import { parseJSON } from "./json.js";
import { Object } from "./object.js";
import { None, Some } from "./option.js";
import { Promise } from "./promise.js";
import { Err, Ok } from "./result.js";
import { typeOf, types } from "./types.js";

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
		for (const dependencies of [
			manifest.value().dependencies,
			manifest.value().devDependencies,
			manifest.value().optionalDependencies,
			manifest.value().peerDependencies,
		]) {
			for (const [name, rhs] of Object.entries(dependencies)) {
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
		const list = await this.#list();
		if (list.isErr()) {
			return list;
		}

		const pool = Promise.pool(os.cpus().length);
		for (const pkg of list.value()) {
			pool.add(() => this.#deprecation(pkg));
		}

		const results = await pool.await();
		for (const result of results) {
			if (result.isErr()) {
				return result;
			}
		}

		const deprecations = results
			.map(result => result.value())
			.filter(option => option.isSome())
			.map(option => option.value());
		return new Ok(deprecations);
	}

	/**
	 * @returns {Promise<Result<PackageHierarchy, string>>}
	 */
	async hierarchy() {
		const manifest = await this.#getManifest();
		if (manifest.isErr()) {
			return manifest;
		}

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
		return result
			.map(({ stdout }) => stdout)
			.andThen((stdout) => parseJSON(stdout))
			.map(hierarchy => this.#normalizeHierarchy(hierarchy))
			.map(hierarchy => this.#annotateHierarchy(manifest.value(), hierarchy))
			.mapErr(({ stderr }) => `npm list failed:\n${stderr}`);
	}

	/**
	 * @returns {Promise<Result<void, string>>}
	 */
	async install() {
		const cmd = "npm";
		const args = [
			"install",
			"--no-audit",
			"--no-fund",
			"--no-update-notifier",
		];

		const result = await this.#cp.exec(cmd, args);
		if (result.isErr()) {
			const { stderr } = result.error();
			return new Err(`npm install failed:\n${stderr}`);
		}

		return new Ok();
	}

	/**
	 * @param {Manifest} manifest
	 * @param {PackageHierarchy} hierarchy
	 * @returns {Promise<PackageHierarchy>}
	 */
	#annotateHierarchy(manifest, hierarchy) {
		const { dependencies } = hierarchy;
		for (const [name, info] of Object.entries(dependencies)) {
			const scope = this.#scopeOf(manifest, name);
			info.scope = scope.value();

			const transitive = Object.values(info.dependencies);
			while (transitive.length > 0) {
				const dependency = transitive.pop();
				dependency.scope = info.scope;
				transitive.push(...Object.values(dependency.dependencies));
			}
		}

		return hierarchy;
	}

	/**
	 * @param {Package} pkg
	 * @returns {Promise<Result<Option<DeprecatedPackage>, string>>}
	 */
	async #deprecation(pkg) {
		const result = await this.#view(pkg);
		if (result.isErr()) {
			return result;
		}

		const view = result.value();
		return new Ok(
			Object.hasOwn(view, "deprecated")
				? new Some({ ...pkg, reason: view.deprecated })
				: None
		);
	}

	/**
	 * @returns {Promise<Result<Manifest, string>>}
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
	 * @returns {Promise<Result<Package[], string>>}
	 */
	async #list() {
		const hierarchy = await this.hierarchy();
		if (hierarchy.isErr()) {
			return hierarchy;
		}

		const queue = Object.entries(hierarchy.value().dependencies);
		const pkgs = new Map();
		while (queue.length > 0) {
			const [name, info] = queue.pop();

			const pkg = { name, version: info.version };
			const id = `${pkg.name}@${pkg.version}`;
			pkgs.set(id, pkg);

			queue.push(...Object.entries(info.dependencies));
		}

		return new Ok(pkgs.values().toArray());
	}

	/**
	 * @param {PackageHierarchy} hierarchy
	 * @returns {Promise<PackageHierarchy>}
	 */
	#normalizeHierarchy(hierarchy) {
		hierarchy.dependencies ||= {};

		delete hierarchy.dependencies[hierarchy.name];
		for (const [name, info] of Object.entries(hierarchy.dependencies)) {
			if (info.extraneous || Object.keys(info).length === 0) {
				delete hierarchy.dependencies[name];
			} else {
				this.#normalizeHierarchy(hierarchy.dependencies[name]);
			}
		}

		return hierarchy;
	}

	/**
	 * @param {Manifest} manifest
	 * @param {string} pkg
	 * @returns {Option<Scope, string>}
	 */
	#scopeOf(manifest, pkg) {
		const {
			dependencies,
			devDependencies,
			optionalDependencies,
			peerDependencies,
		} = manifest;

		const categories = {
			prod: dependencies,
			dev: devDependencies,
			optional: optionalDependencies,
			peer: peerDependencies,
		};

		for (const [scope, list] of Object.entries(categories)) {
			for (const got of Object.keys(list)) {
				if (got === pkg) {
					return new Some(scope);
				}
			}
		}

		return None;
	}

	/**
	 * @param {Package} pkg
	 * @returns {Promise<Result<PackageView, string>>}
	 */
	async #view(pkg) {
		const cmd = "npm";
		const args = [
			"view",
			"--json",
			`${pkg.name}@${pkg.version}`,
		];

		const result = await this.#cp.exec(cmd, args);
		const view = result
			.mapErr(({ stderr }) => stderr)
			.andThen(({ stdout }) => parseJSON(stdout))
			.map((stdout) => typeOf(stdout) === types.array ? stdout[0] : stdout);
		if (view.isErr()) {
			return new Err(`npm view failed:\n${view.error()}`);
		}

		return view;
	}
}

/**
 * @typedef {Map<string, Package>} Aliases
 */

/**
 * @typedef Dependency
 * @property {{[key: string]: Dependency}} dependencies
 * @property {string} version
 * @property {Scope} scope
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
 * @typedef PackageView
 * @property {string} [deprecated]
 */

/**
 * @typedef PackageHierarchy
 * @property {{[key: string]: Dependency}} dependencies
 * @property {string} name
 * @property {string} version
 */

/** @import { Scope } from "./config.js" */
/** @import { ExecCP } from "./cp.js" */
/** @import { ReadFS } from "./fs.js" */
/** @import { Option } from "./option.js" */
/** @import { Result } from "./result.js" */
