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

import { typeOf } from "./types.js";

/**
 * @param {unknown} object
 * @returns {[string, unknown][]}
 */
function entries(object) {
	if (typeOf(object) === "undefined" || typeOf(object) === "null") {
		return [];
	}

	return Object.entries(object);
}

/**
 * @param {unknown} object
 * @param {string} key
 * @returns {boolean}
 */
function hasOwn(object, key) {
	if (typeOf(object) === "undefined" || typeOf(object) === "null") {
		return false;
	}

	return Object.hasOwn(object, key);
}

/**
 * @param {unknown} object
 * @returns {string[]}
 */
function keys(object) {
	if (typeOf(object) === "undefined" || typeOf(object) === "null") {
		return [];
	}

	return Object.keys(object);
}

/**
 * @param {unknown} object
 * @returns {string[]}
 */
function values(object) {
	if (typeOf(object) === "undefined" || typeOf(object) === "null") {
		return [];
	}

	return Object.values(object);
}

const object = {
	entries,
	hasOwn,
	keys,
	values,
};

export { object as Object };
