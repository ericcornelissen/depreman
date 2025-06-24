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
 * @template O, E
 * @typedef Result
 * @property {function(Result<O,E>): Result<O,E>} and
 * @property {function(): E} error
 * @property {function(): boolean} isErr
 * @property {function(): boolean} isOk
 * @property {function(): O} value
 */

/**
 * @template O
 */
export class Ok {
	/**
	 * @param {O} value
	 */
	constructor(value) {
		this.v = value;
	}

	/**
	 * @template E
	 * @param {Result<O,E>} other
	 * @returns {Result<O,E>}
	 */
	and(other) {
		return other;
	}

	/**
	 * @returns {never}
	 * @throws {TypeError}
	 */
	error() {
		throw new TypeError("Ok has no error");
	}

	/**
	 * @returns {boolean}
	 */
	isErr() {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isOk() {
		return true;
	}

	/**
	 * @returns {O}
	 */
	value() {
		return this.v;
	}
}

/**
 * @template E
 */
export class Err {
	/**
	 * @param {E} error
	 */
	constructor(error) {
		this.e = error;
	}

	/**
	 * @template O
	 * @returns {Result<O,E>}
	 */
	and() {
		return this;
	}

	/**
	 * @returns {E}
	 */
	error() {
		return this.e;
	}

	/**
	 * @returns {boolean}
	 */
	isErr() {
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isOk() {
		return false;
	}

	/**
	 * @returns {never}
	 * @throws {TypeError}
	 */
	value() {
		throw new TypeError("Err has no value");
	}
}
