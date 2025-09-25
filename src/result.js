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

import { None, Some } from "./option.js";

/**
 * @template O, P, E, F
 * @typedef Result
 * @property {function(Result<O, E>): Result<O, E>} and
 * @property {function((ok: O) => Result<P, E>): Result<P, E>} andThen
 * @property {function(): E} error
 * @property {function(): boolean} isErr
 * @property {function(): boolean} isOk
 * @property {function((ok: O) => P): Result<P, E>} map
 * @property {function((err: E) => F): Result<O, F>} mapErr
 * @property {function(): Option<O>} ok
 * @property {function(): O} value
 */

/**
 * @template O
 */
export class Ok {
	#value;

	/**
	 * @param {O} value
	 */
	constructor(value) {
		this.#value = value;
	}

	/**
	 * @template E
	 * @param {Result<O, E>} other
	 * @returns {Result<O, E>}
	 */
	and(other) {
		return other;
	}

	/**
	 * @template P, E
	 * @param {(ok: O) => Result<P, E>} callback
	 * @returns {Result<P, E>}
	 */
	andThen(callback) {
		return callback(this.#value);
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
	 * @template P, E
	 * @param {(ok: O) => P} callback
	 * @returns {Result<P, E>}
	 */
	map(callback) {
		const value = callback(this.#value);
		return new Ok(value);
	}

	/**
	 * @template E
	 * @returns {Result<O, E>}
	 */
	mapErr() {
		return this;
	}

	/**
	 * @returns {Option<O>}
	 */
	ok() {
		return new Some(this.#value);
	}

	/**
	 * @returns {O}
	 */
	value() {
		return this.#value;
	}
}

/**
 * @template E
 */
export class Err {
	#error;

	/**
	 * @param {E} error
	 */
	constructor(error) {
		this.#error = error;
	}

	/**
	 * @template O
	 * @returns {Result<O, E>}
	 */
	and() {
		return this;
	}

	/**
	 * @template O
	 * @returns {Result<O, E>}
	 */
	andThen() {
		return this;
	}

	/**
	 * @returns {E}
	 */
	error() {
		return this.#error;
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
	 * @template O
	 * @returns {Result<O, E>}
	 */
	map() {
		return this;
	}

	/**
	 * @template O, F
	 * @param {function(E): F} callback
	 * @returns {Result<O, F>}
	 */
	mapErr(callback) {
		const error = callback(this.#error);
		return new Err(error);
	}

	/**
	 * @returns {Option<never>}
	 */
	ok() {
		return None;
	}

	/**
	 * @returns {never}
	 * @throws {TypeError}
	 */
	value() {
		throw (
			typeof this.#error === "string"
				? new TypeError(this.#error)
				: new TypeError("Err has no value")
		);
	}
}

/** @import { Option } from "./option.js" */
