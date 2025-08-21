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

import chalk from "chalk";

/**
 * @returns {CliStyler}
 */
export function create() {
	return new CliStyler();
}

class CliStyler {
	/**
	 * @param {string} msg
	 * @returns {string}
	 */
	dim(msg) {
		return chalk.dim(msg);
	}

	/**
	 * @param {string} msg
	 * @returns {string}
	 */
	italic(msg) {
		return chalk.italic(msg);
	}
}

/**
 * @typedef Styler
 * @property {(string) => string} dim
 * @property {(string) => string} italic
 */
