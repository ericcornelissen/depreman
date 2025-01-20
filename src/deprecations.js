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

import { spawn } from "node:child_process";

/**
 * Obtain all deprecation warnings for the current project.
 *
 * @param {NpmCliOptions} options The configuration for deprecations to get.
 * @returns {Promise<Deprecation[]>} A list of deprecation warnings.
 */
export async function obtainDeprecations(options) {
	return new Promise((resolve, reject) => {
		const process = spawn(
			"npm",
			[
				"clean-install",
				"--no-audit",
				"--no-fund",
				"--no-update-notifier",
				...(options.omitDev ? ["--omit", "dev"] : []),
				...(options.omitOptional ? ["--omit", "optional"] : []),
				...(options.omitPeer ? ["--omit", "peer"] : []),
			],
			{
				shell: false,
			},
		);

		const deprecations = [];

		process.stderr.on("data", (line) => {
			if (isDeprecationWarning(line)) {
				const deprecated = extractDeprecation(line);
				const details = parseDeprecation(deprecated);
				deprecations.push(details);
			}
		});

		process.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve(deprecations.filter(unique));
			} else {
				reject("execution failed");
			}
		});
	});
}

const prefix = Buffer.from("npm warn deprecated ");

/**
 * Determine if a line from the npm CLI is a deprecation warning.
 *
 * @param {string} line A line from the npm CLI.
 * @returns {boolean} `true` if the line is a deprecation warning.
 */
function isDeprecationWarning(line) {
	return line.slice(0, prefix.length).equals(prefix);
}

/**
 * Extract the deprecation warning content from a line outputted by the npm CLI.
 *
 * @param {string} line The raw line outputted by the npm CLI.
 * @returns {string} The line without the deprecation warning prefix.
 */
function extractDeprecation(line) {
	return line.slice(prefix.length, line.length).toString();
}

/**
 * Parse a raw deprecation warning outputted by the npm CLI.
 *
 * @param {string} str The deprecation warning.
 * @returns {Deprecation} The parsed deprecation.
 */
function parseDeprecation(str) {
	let pkg, reason, name, version;

	{
		const i = str.indexOf(":");
		pkg = str.substring(0, i);
		reason = str.substring(i+1, /* end */).trim();
	}

	{
		const i = pkg.lastIndexOf("@");
		name = pkg.substring(0, i);
		version = pkg.substring(i+1, /* end */);
	}

	return { name, version, reason };
}

/**
 * A filter function to remove duplicate {@link Deprecation} objects.
 *
 * @param {Deprecation} a An element of `array`.
 * @param {number} index The index of element `a` in `array`.
 * @param {Deprecation[]} array The full array to filter.
 * @returns {boolean} `true` if `a` is the first occurrence in `array`.
 */
function unique(a, index, array) {
	return index === array.findIndex(b => a.name === b.name && a.version === b.version);
}

/**
 * @typedef NpmCliOptions
 * @property {boolean} omitDev Set `--omit dev`.
 * @property {boolean} omitOptional Set `--omit optional`.
 * @property {boolean} omitPeer Set `--omit peer`.
 */

/**
 * @typedef Deprecation
 * @property {string} name The name of the deprecated package.
 * @property {string} version The version of the deprecated package.
 * @property {string} reason The deprecation message.
 */
