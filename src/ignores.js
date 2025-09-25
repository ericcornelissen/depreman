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

import * as date from "./date.js";
import * as semver from "./semver.js";
import { typeOf, types } from "./types.js";

const kUsed = Symbol.for("#used"); // eslint-disable-line top/no-top-level-side-effects
const kIgnore = "#ignore";
const kExpire = "#expire";

/**
 * @param {Config} config
 * @param {DeprecatedPackage[]} deprecations
 * @returns {DeprecationVerdict[]}
 * @throws {Error}
 */
export function removeIgnored(config, deprecations) {
	const result = [];
	for (const deprecation of deprecations) {
		const kept = [], ignored = [];
		for (const path of deprecation.paths) {
			const ignore = isIgnored(config, path);
			if (ignore) {
				ignored.push({
					path,
					reason: typeOf(ignore) === types.string ? ignore : null,
				});
			} else {
				kept.push({ path });
			}
		}

		result.push({
			name: deprecation.name,
			version: deprecation.version,
			reason: deprecation.reason,
			ignored,
			kept,
		});
	}

	return result;
}

/**
 * @param {Config} config
 * @param {string[]} path
 * @returns {string[][]}
 */
export function unusedIgnores(config, path=[]) {
	const unused = [];
	if (Object.hasOwn(config, kIgnore) && !config[kUsed]) {
		unused.push(path);
	}

	for (const rule in config) {
		if (rule.startsWith("#")) {
			continue;
		}

		const nestedPath = [...path, rule];
		const nestedUnused = unusedIgnores(config[rule], nestedPath);
		unused.push(...nestedUnused);
	}

	return unused;
}

/**
 * @param {Config} config
 * @param {string[]} path
 * @returns {boolean | string}
 * @throws {Error}
 */
function isIgnored(config, path) {
	if (path.length === 0) {
		return getDecision(config);
	}

	const [current, ...remaining] = path;
	for (const rule in config) {
		if (rule.startsWith("#")) {
			continue;
		}

		// Match 0-or-more
		if (rule === "*") {
			const reason = isIgnored(config, remaining) || isIgnored(config[rule], path);
			if (reason) {
				return reason;
			}

			continue;
		}

		// Match 1-or-more
		if (rule === "+") {
			const reason = isIgnored(config, remaining) || isIgnored(config[rule], remaining);
			if (reason) {
				return reason;
			}

			continue;
		}

		// Match name+semver
		const [name, version] = parseRule(rule);
		if (name === current.name && semver.satisfies(current.version, version).value()) {
			const reason = isIgnored(config[rule], remaining);
			if (reason) {
				return reason;
			}
		}
	}

	return false;
}

/**
 * @param {Config} config
 * @returns {boolean | string}
 * @throws {Error}
 */
function getDecision(config) {
	const decision = parseDecision(config);
	if (decision && !isExpired(config)) {
		return decision;
	}

	return false;
}

/**
 * @param {Config} config
 * @returns {boolean | string}
 * @throws {Error}
 */
function parseDecision(config) {
	let ignore = false;
	if (Object.hasOwn(config, kIgnore)) {
		ignore = config[kIgnore];
		config[kUsed] = true;
	} else if (Object.hasOwn(config["*"] || {}, kIgnore)) {
		ignore = config["*"][kIgnore];
		config["*"][kUsed] = true;
	}

	switch (typeOf(ignore)) {
		case types.boolean:
		case types.string:
			if (ignore.length === 0) {
				throw new Error(`cannot use empty string for '${kIgnore}', use 'true' instead`);
			} else {
				return ignore;
			}
		default:
			throw new Error(`invalid '${kIgnore}' value: ${ignore}`);
	}
}

/**
 * @param {Config} config
 * @returns {boolean}
 */
function isExpired(config) {
	const expire = config[kExpire] ?? config["*"]?.[kExpire];
	if (expire !== undefined) {
		const expires = date.parse(expire).value();
		const today = date.today();
		return expires.isBefore(today) || expires.is(today);
	}

	return false;
}

/**
 * @param {string} pkg
 * @returns {[string, string]}
 * @throws {Error}
 */
function parseRule(pkg) {
	const i = pkg.lastIndexOf("@");
	if (i === -1) {
		throw new Error(`invalid rule name '${pkg}'`);
	}

	const name = pkg.slice(0, i);
	const version = pkg.slice(i + 1);
	return [name, version];
}

/**
 * @typedef DeprecationVerdict
 * @property {string} name
 * @property {string} version
 * @property {string} reason
 * @property {{path: string[], reason: boolean | string}} ignored
 * @property {{path: string[]}} kept
 */

/** @import { Config } from "./config.js" */
/** @import { DeprecatedPackage } from "./deprecations.js" */
