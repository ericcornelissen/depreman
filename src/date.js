// Copyright (C) 2024-2025  Eric Cornelissen
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

const DATE_EXPR = /^(?<yyyy>\d{4})-(?<mm>\d{1,2})-(?<dd>\d{1,2})$/u;

const MIN_YEAR = 2000, MAX_YEAR = 3000;
const MIN_MONTH = 1, MAX_MONTH = 12;
const MIN_DAY = 1, MAX_DAY = 31;

/**
 * @param {string} str
 * @returns {Result<DepremanDate, string>}
 */
export function parse(str) {
	const parsed = DATE_EXPR.exec(str);
	if (parsed === null) {
		return new Err(`invalid date '${str}' (must be 'yyyy-mm-dd')`);
	}

	const { yyyy, mm, dd } = parsed.groups;
	const rawDate = {
		year: Number.parseInt(yyyy, 10),
		month: Number.parseInt(mm, 10),
		day: Number.parseInt(dd, 10),
	};

	if (!isValid(rawDate)) {
		return new Err(`invalid date '${yyyy}-${mm}-${dd}'`);
	}

	const date = new DepremanDate(rawDate);
	return new Ok(date);
}

/**
 * @returns {DepremanDate}
 */
export function today() {
	const date = new Date();
	return new DepremanDate({
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
	});
}

/**
 * @private
 */
export class DepremanDate {
	#year; #month; #day;

	/**
	 * @param {RawDate} date
	 */
	constructor(date) {
		const { year, month, day } = date;
		this.#year = year;
		this.#month = month;
		this.#day = day;
	}

	/**
	 * @param {DepremanDate} other
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	is(other) {
		if (!(other instanceof DepremanDate)) {
			throw new TypeError("other is not a date");
		}

		return this.#year === other.#year
			&& this.#month === other.#month
			&& this.#day === other.#day;
	}

	/**
	 * @param {DepremanDate} other
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	isBefore(other) {
		if (!(other instanceof DepremanDate)) {
			throw new TypeError("other is not a date");
		}

		if (this.#year < other.#year) {
			return true;
		} else if (this.#year === other.#year) {
			if (this.#month < other.#month) {
				return true;
			} else if (this.#month === other.#month && this.#day < other.#day) {
				return true;
			}
		}

		return false;
	}
}

/**
 * @param {RawDate} date
 * @returns {boolean}
 */
function isValid(date) {
	const { year, month, day } = date;
	return year >= MIN_YEAR && year < MAX_YEAR
		&& month >= MIN_MONTH && month <= MAX_MONTH
		&& day >= MIN_DAY && day <= MAX_DAY;
}

/**
 * @typedef RawDate
 * @property {number} year
 * @property {number} month
 * @property {number} day
 */

/** @import { Result } from "./result.js" */
