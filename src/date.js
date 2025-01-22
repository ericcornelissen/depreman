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

const dateExpr = /^(?<yyyy>\d{4})-(?<mm>\d{1,2})-(?<dd>\d{1,2})$/;

export class DepremanDate {
	constructor(date) {
		if (!isValid(date)) {
			throw new Error(`invalid date '${year}-${month}-${day}'`);
		}

		this.year = date.year;
		this.month = date.month;
		this.day = date.day;
	}

	is(that) {
		if (!(that instanceof DepremanDate)) {
			throw new Error(`not a date '${that}'`);
		}

		return this.year === that.year
			&& this.month === that.month
			&& this.day === that.day;
	}

	isBefore(that) {
		if (!(that instanceof DepremanDate)) {
			throw new Error(`not a date '${that}'`);
		}

		if (this.year < that.year) {
			return true;
		} else if (this.year === that.year) {
			if (this.month < that.month) {
				return true;
			} else if (this.month === that.month && this.day < that.day) {
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
	return year >= 2000 && year <= 9999
		&& month >= 1 && month <= 12
		&& day >= 1 && day <= 31;
}

/**
 * @typedef RawDate
 * @property {number} year
 * @property {number} month
 * @property {number} day
 */
