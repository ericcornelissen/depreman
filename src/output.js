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

/**
 * @param {Results} result
 * @param {Unused} unused
 * @param {Options} options
 * @param {Styler} chalk
 * @returns {[string, number]} The report and exit code.
 */
export function printAndExit(result, unused, options, chalk) {
	let exitCode = 0;
	const output = [];

	for (const pkg of result) {
		const id = pkgToString(pkg);
		if (pkg.kept.length > 0) {
			exitCode = 1;

			const msg = `${id} ${chalk.italic(`("${pkg.reason}")`)}:`;
			output.push(msg);
		} else if (options.everything) {
			output.push(chalk.dim(id));
		}

		for (const { path } of pkg.kept) {
			const msg = `\t. > ${path.map(pkgToString).join(" > ")}`;
			output.push(msg);
		}

		if (options.everything) {
			for (const { path, reason } of pkg.ignored) {
				output.push(`\t${chalk.dim(`. > ${path.map(pkgToString).join(" > ")}`)}`);
				output.push(`\t\t${chalk.dim(`(allowed "${typeof reason === "string" ? reason : "no reason given"}")`)}`);
			}
		}
	}

	if (unused?.length > 0) {
		exitCode = 1;
		output.push("Unused ignore directives(s):");
		for (const path of unused) {
			output.push(`\t. > ${path.join(" > ")}`);
		}
	}

	return {
		exitCode,
		report: output.join("\n"),
	};
}

/**
 * @param {Result} pkg
 * @returns {string}
 */
function pkgToString(pkg) {
	return `${pkg.name}@${pkg.version}`;
}

/** @typedef {Iterable<Result>} Results */

/**  @typedef {Iterable<string[]>} Unused */

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
 *
 * @typedef {Package & _Result} Result
 */

/**
 * @typedef Options
 * @property {boolean} everything Whether to output all deprecations.
 */

/**
 * @typedef Styler
 * @property {(string) => string} dim
 * @property {(string) => string} italic
 */
