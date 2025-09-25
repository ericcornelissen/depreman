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
 * @template T, O
 * @typedef Option
 * @property {function(): boolean} isNone
 * @property {function(): boolean} isSome
 * @property {function(Option<O>): T | O} or
 * @property {function(): T} value
 */

/**
 * @template T
 */
export class Some {
	#value;

	/**
	 * @param {T} value
	 */
	constructor(value) {
		this.#value = value;
	}

	/**
	 * @returns {boolean}
	 */
	isNone() {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isSome() {
		return true;
	}

	/**
	 * @returns {T}
	 */
	or() {
		return this;
	}

	/**
	 * @returns {T}
	 */
	value() {
		return this.#value;
	}
}

/**
 * @type {Option<never>}
 */
export const None = {
	/**
	 * @returns {boolean}
	 */
	isNone() {
		return true;
	},

	/**
	 * @returns {boolean}
	 */
	isSome() {
		return false;
	},

	/**
	 * @template T
	 * @param {Option<T>} other
	 * @returns {T}
	 */
	or(other) {
		return other;
	},

	/**
	 * @returns {never}
	 * @throws {TypeError}
	 */
	value() {
		throw new TypeError("None has no value");
	},
}
