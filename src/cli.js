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

import { Ok } from "./result.js";

/**
 * @param {string[]} argv
 * @returns {Result<Config, null>}
 */
export function parseArgv(argv) {
	const help = argv.includes("--help") || argv.includes("-h");
	const everything = !(argv.includes("--errors-only"));
	const omitDev = argv.includes("--omit=dev");
	const omitOptional = argv.includes("--omit=optional");
	const omitPeer = argv.includes("--omit=peer");
	const reportUnused = argv.includes("--report-unused");

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
