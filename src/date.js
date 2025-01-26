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
	constructor(date) {
		const { year, month, day } = date;
		if (!isValid(date)) {
			throw new Error(`invalid date '${year}-${month}-${day}'`);
		}

		this.year = year;
		this.month = month;
		this.day = day;
	}

	is(other) {
		if (!(other instanceof DepremanDate)) {
			throw new Error(`not a date '${other}'`);
		}

		return this.year === other.year
			&& this.month === other.month
			&& this.day === other.day;
	}

	isBefore(other) {
		if (!(other instanceof DepremanDate)) {
			throw new Error(`not a date '${other}'`);
		}

		if (this.year < other.year) {
			return true;
		} else if (this.year === other.year) {
			if (this.month < other.month) {
				return true;
			} else if (this.month === other.month && this.day < other.day) {
				return true;
			}
		}

		return false;
	}
}

export function parse(str) {
	const parsed = dateExpr.exec(str);
	if (parsed === null) {
		throw new Error(`invalid date '${str}' (must be 'yyyy-mm-dd')`);
	}

	const { yyyy, mm, dd } = parsed.groups;
	return new DepremanDate({
		year: parseInt(yyyy, 10),
		month: parseInt(mm, 10),
		day: parseInt(dd, 10),
	});
}

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
 * Determine if a raw (unverified) date is a valid date.
 *
 * The year is validated in a way to catch likely mistakes for the purposes of
 * an expiry date (e.g. a year past 10.000 is probably not intended as an expiry
 * date). The day is validated approximately, not considering the month.
 *
 * @param {RawDate} rawDate A potential date.
 * @returns {boolean} `true` if the date is valid, `false` otherwise.
 */
function isValid({ year, month, day }) {
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
