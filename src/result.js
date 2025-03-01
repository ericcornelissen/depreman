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
 * @typedef Result<O, E>
 * @property {function(): E} error
 * @property {function(): boolean} isErr
 * @property {function(): boolean} isOk
 * @property {function(): O} value
 */

/**
 * @class
 * @template T
 */
export class Ok {
	/**
	 * @param {T} value
	 */
	constructor(value) {
		this.v = value;
	}

	/**
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
	 * @returns {T}
	 */
	value() {
		return this.v;
	}
}

/**
 * @class
 * @template T
 */
export class Err {
	/**
	 * @param {T} error
	 */
	constructor(error) {
		this.e = error;
	}

	/**
	 * @returns {T}
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
	 * @throws {TypeError}
	 */
	value() {
		throw new TypeError("Err has no value");
	}
}
