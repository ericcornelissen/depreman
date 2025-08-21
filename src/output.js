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

import { typeOf, types } from "./types.js";

/**
 * @param {Results} result
 * @param {Unused} unused
 * @param {Options} options
 * @param {Styler} chalk
 * @returns {{ ok: boolean, result: string }}
 */
export function printAndExit(result, unused, options, chalk) {
	let ok = true;
	const output = [];

	for (const pkg of result.sort(byName)) {
		const id = pkgToString(pkg);

		const header = `${id} ${chalk.italic(`("${pkg.reason}")`)}:`;
		if (pkg.kept.length > 0) {
			ok = false;
			output.push(header);
		} else if (options.everything) {
			output.push(chalk.dim(header));
		}

		for (const { path } of pkg.kept) {
			const entry = `\t. > ${path.map(pkgToString).join(" > ")}`;
			output.push(entry);
		}

		if (options.everything) {
			for (const { path, reason } of pkg.ignored) {
				output.push(
					`\t${chalk.dim(`. > ${path.map(pkgToString).join(" > ")}`)}`,
					`\t\t${chalk.dim(`(allowed "${typeOf(reason) === types.string ? reason : "no reason given"}")`)}`,
				);
			}
		}
	}

	if (unused.length > 0) {
		ok = false;
		output.push("Unused ignore directives(s):");
		for (const path of unused) {
			output.push(`\t. > ${path.join(" > ")}`);
		}
	}

	return {
		ok,
		report: output.join("\n"),
	};
}

/**
 * @param {Package} pkgA
 * @param {Package} pkgB
 * @returns {-1 | 0 | 1}
 */
function byName(pkgA, pkgB) {
	const a = pkgToString(pkgA);
	const b = pkgToString(pkgB);
	return a.localeCompare(b);
}

/**
 * @param {Package} pkg
 * @returns {string}
 */
function pkgToString(pkg) {
	return `${pkg.name}@${pkg.version}`;
}

/** @typedef {Result[]} Results */

/** @typedef {string[][]} Unused */

/**
 * @typedef Package
 * @property {string} name The package name.
 * @property {string} version The package version.
 */

/**
 * @typedef _Result
 * @property {string} reason The deprecation message.
 * @property {{ path: Package[] }[]} kept
 * @property {{ path: Package[], reason: string | boolean }[]} ignored
 */

/**
 * @typedef {Package & _Result} Result
 */

/**
 * @typedef Options
 * @property {boolean} everything Whether to output all deprecations.
 */

/** @typedef {import("./style.js").Styler} Styler */
