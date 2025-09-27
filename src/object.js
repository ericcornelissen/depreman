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

import { typeOf } from "./types.js";

/**
 * @param {unknown} obj
 * @returns {[string, unknown][]}
 */
function entries(obj) {
	if (typeOf(obj) === "undefined" || typeOf(obj) === "null") {
		return [];
	}

	return Object.entries(obj);
}

/**
 * @param {unknown} obj
 * @param {string} key
 * @returns {boolean}
 */
function hasOwn(obj, key) {
	return Object.hasOwn(obj, key);
}

/**
 * @param {unknown} obj
 * @returns {string[]}
 */
function keys(obj) {
	if (typeOf(obj) === "undefined" || typeOf(obj) === "null") {
		return [];
	}

	return Object.keys(obj);
}

/**
 * @param {unknown} obj
 * @returns {string[]}
 */
function values(obj) {
	if (typeOf(obj) === "undefined" || typeOf(obj) === "null") {
		return [];
	}

	return Object.values(obj);
}

const object = {
	entries,
	hasOwn,
	keys,
	values,
};

export { object as Object };
