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

/**
 * @param {any} value
 * @returns {string}
 */
export function typeOf(value) {
	if (value === null) {
		return "null";
	}

	if (Array.isArray(value)) {
		return "array";
	}

	return typeof value;
}

export const types = {
	array: "array",
	boolean: "boolean",
	null: "null",
	number: "number",
	object: "object",
	string: "string",
	undefined: "undefined",
};

/**
 * @typedef {"array" | "boolean" | "null" | "number" | "object" | "string" | "undefined"} TypeName
 */
