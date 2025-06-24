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

const dateExpr = /^(?<yyyy>\d{4})-(?<mm>\d{1,2})-(?<dd>\d{1,2})$/u;

export class DepremanDate {
	#year; #month; #day;

	/**
	 * @param {RawDate} date
	 */
	constructor(date) {
		const { year, month, day } = date;
		if (!isValid(date)) {
			throw new Error(`invalid date '${year}-${month}-${day}'`);
		}

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
 * @param {string} str
 * @returns {DepremanDate}
 * @throws {Error}
 */
export function parse(str) {
	const parsed = dateExpr.exec(str);
	if (parsed === null) {
		throw new Error(`invalid date '${str}' (must be 'yyyy-mm-dd')`);
	}

	const { yyyy, mm, dd } = parsed.groups;
	return new DepremanDate({
		year: Number.parseInt(yyyy, 10),
		month: Number.parseInt(mm, 10),
		day: Number.parseInt(dd, 10),
	});
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

const MIN_YEAR = 2000, MAX_YEAR = 9999;
const MIN_MONTH = 1, MAX_MONTH = 12;
const MIN_DAY = 1, MAX_DAY = 31;

/**
 * @param {RawDate} date
 * @returns {boolean}
 */
function isValid(date) {
	const { year, month, day } = date;
	return year >= MIN_YEAR && year <= MAX_YEAR
		&& month >= MIN_MONTH && month <= MAX_MONTH
		&& day >= MIN_DAY && day <= MAX_DAY;
}

/**
 * @typedef RawDate
 * @property {number} year
 * @property {number} month
 * @property {number} day
 */
