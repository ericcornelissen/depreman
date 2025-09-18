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
 * @param {string} raw
 * @returns {Result<unknown, string>}
 */
export function parseJSON(raw) {
	try {
		return new Ok(JSON.parse(raw));
	} catch (error) {
		return new Err(error.message);
	}
}

/**
 * @template O, E
 * @typedef {import("./result.js").Result<O, E>} Result
 */
