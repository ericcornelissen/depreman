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
 * @param {string[]} argv
 * @returns {Result<Config, string>}
 */
export function parseArgv(argv) {
	argv.splice(0, 2); // eslint-disable-line no-magic-numbers
	const help = removeFromList(argv, "--help") || removeFromList(argv, "-h");
	const everything = !(removeFromList(argv, "--errors-only"));
	const omitDev = removeFromList(argv, "--omit=dev");
	const omitOptional = removeFromList(argv, "--omit=optional");
	const omitPeer = removeFromList(argv, "--omit=peer");
	const reportUnused = removeFromList(argv, "--report-unused");

	const remaining = argv.filter((arg) => arg.startsWith("-"));
	if (remaining.length > 0) {
		return new Err(`spurious flag(s): ${remaining.join(", ")}`);
	}

	if (argv.length > 0) {
		return new Err(`spurious arguments(s): ${argv.join(", ")}`);
	}

	return new Ok({
		help,
		everything,
		omitDev,
		omitOptional,
		omitPeer,
		reportUnused,
	});
}

/**
 * @param {string[]} haystack
 * @param {string} needle
 * @returns {boolean}
 */
function removeFromList(haystack, needle) {
	const i = haystack.indexOf(needle);
	if (i === -1) {
		return false;
	}

	haystack.splice(i, 1);
	return true;
}

/**
 * @typedef Config
 * @property {boolean} help
 * @property {boolean} everything
 * @property {boolean} omitDev
 * @property {boolean} omitOptional
 * @property {boolean} omitPeer
 * @property {boolean} reportUnused
 */

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
