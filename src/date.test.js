// Copyright (C) 2024  Eric Cornelissen
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

import * as assert from "node:assert/strict";
import { test } from "node:test";

import {
	DepremanDate,
	parse,
	today,
} from "./date.js";

test("date.js", async (t) => {
	await t.test("DepremanDate", async (t) => {
		await t.test("is", async (t) => {
			const trueCases = {
				"sample, 2025-01-01": {
					year: 2025,
					month: 1,
					day: 1,
				},
				"sample, 2024-12-31": {
					year: 2024,
					month: 12,
					day: 31,
				},
			};

			for (const [name, testCase] of Object.entries(trueCases)) {
				await t.test(name, () => {
					const a = new DepremanDate(testCase);
					const b = new DepremanDate(testCase);
					assert.ok(a.is(b));
				});
			}

			const falseCases = {
				"different year, month, day": {
					a: {
						year: 2025,
						month: 1,
						day: 1,
					},
					b: {
						year: 2024,
						month: 12,
						day: 31,
					},
				},
				"different year, month (same day)": {
					a: {
						year: 2025,
						month: 1,
						day: 1,
					},
					b: {
						year: 2024,
						month: 2,
						day: 1,
					},
				},
				"different year, day (same month)": {
					a: {
						year: 2025,
						month: 1,
						day: 1,
					},
					b: {
						year: 2024,
						month: 1,
						day: 2,
					},
				},
				"different month, day (same year)": {
					a: {
						year: 2024,
						month: 1,
						day: 1,
					},
					b: {
						year: 2024,
						month: 2,
						day: 2,
					},
				},
				"different year (same month, day)": {
					a: {
						year: 2025,
						month: 1,
						day: 1,
					},
					b: {
						year: 2024,
						month: 1,
						day: 1,
					},
				},
				"different month (same year, day)": {
					a: {
						year: 2024,
						month: 1,
						day: 1,
					},
					b: {
						year: 2024,
						month: 12,
						day: 1,
					},
				},
				"different day (same year, month)": {
					a: {
						year: 2024,
						month: 1,
						day: 1,
					},
					b: {
						year: 2024,
						month: 1,
						day: 31,
					},
				},
			};

			for (const [name, testCase] of Object.entries(falseCases)) {
				await t.test(name, () => {
					const a = new DepremanDate(testCase.a);
					const b = new DepremanDate(testCase.b);
					assert.ok(!a.is(b));
				});
			}

			const badCases = {
				"other is not a date": {
					a: new DepremanDate({ year: 2024, month: 11, day: 3 }),
					b: "foobar",
					want: /^Error: not a date 'foobar'$/,
				},
			};

			for (const [name, testCase] of Object.entries(badCases)) {
				const { a, b, want } = testCase;
				await t.test(name, () => {
					assert.throws(
						() => a.is(b),
						want,
					);
				});
			}
		});

		await t.test("isBefore", async (t) => {
			const trueCases = {
				"previous year": {
					a: {
						year: 2024,
						month: 11,
						day: 1,
					},
					b: {
						year: 2025,
						month: 1,
						day: 1,
					}
				},
				"previous month (same year)": {
					a: {
						year: 2024,
						month: 11,
						day: 1,
					},
					b: {
						year: 2024,
						month: 12,
						day: 1,
					}
				},
				"previous day (same year, month)": {
					a: {
						year: 2024,
						month: 11,
						day: 1,
					},
					b: {
						year: 2024,
						month: 11,
						day: 2,
					}
				},
			};

			for (const [name, testCase] of Object.entries(trueCases)) {
				await t.test(name, () => {
					const a = new DepremanDate(testCase.a);
					const b = new DepremanDate(testCase.b);
					assert.ok(a.isBefore(b));
				});
			}

			const falseCases = {
				"next year": {
					a: {
						year: 2024,
						month: 11,
						day: 2,
					},
					b: {
						year: 2023,
						month: 1,
						day: 1,
					}
				},
				"next month": {
					a: {
						year: 2024,
						month: 11,
						day: 2,
					},
					b: {
						year: 2024,
						month: 10,
						day: 1,
					}
				},
				"next day": {
					a: {
						year: 2024,
						month: 11,
						day: 2,
					},
					b: {
						year: 2024,
						month: 11,
						day: 1,
					}
				},
				"same date": {
					a: {
						year: 2024,
						month: 11,
						day: 2,
					},
					b: {
						year: 2024,
						month: 11,
						day: 2,
					}
				},
			};

			for (const [name, testCase] of Object.entries(falseCases)) {
				await t.test(name, () => {
					const a = new DepremanDate(testCase.a);
					const b = new DepremanDate(testCase.b);
					assert.ok(!a.isBefore(b));
				});
			}

			const badCases = {
				"other is not a date": {
					a: new DepremanDate({ year: 2024, month: 11, day: 3 }),
					b: "foobar",
					want: /^Error: not a date 'foobar'$/,
				},
			};

			for (const [name, testCase] of Object.entries(badCases)) {
				const { a, b, want } = testCase;
				await t.test(name, () => {
					assert.throws(
						() => a.isBefore(b),
						want,
					);
				});
			}
		});
	});

	await t.test("parse", async (t) => {
		const goodTestCases = [
			{
				str: "2024-12-31",
				want: {
					year: 2024,
					month: 12,
					day: 31,
				},
			},
			{
				str: "2025-01-01",
				want: {
					year: 2025,
					month: 1,
					day: 1,
				},
			},
			{
				str: "2024-1-1",
				want: {
					year: 2024,
					month: 1,
					day: 1,
				},
			},
		];

		for (const testCase of goodTestCases) {
			await t.test(`good: ${testCase.str}`, () => {
				const got = parse(testCase.str);
				assert.ok(got instanceof DepremanDate);
				assert.equal(got.year, testCase.want.year);
				assert.equal(got.month, testCase.want.month);
				assert.equal(got.day, testCase.want.day);
			});
		}

		const badTestCases = [
			{
				str: "foobar",
				want: /^Error: invalid date 'foobar' \(must be 'yyyy-mm-dd'\)$/,
			},
			{
				str: "25-01-01",
				want: /^Error: invalid date '25-01-01' \(must be 'yyyy-mm-dd'\)$/,
			},
		];

		for (const testCase of badTestCases) {
			const { str, want } = testCase;
			await t.test(`bad: ${str}`, () => {
				assert.throws(
					() => parse(str),
					want,
				);
			});
		}
	});

	await t.test("today", () => {
		const got = today();
		assert.ok(got instanceof DepremanDate);
		assert.ok(got.year > 2000);
		assert.ok(got.month >= 1 && got.month <= 12);
		assert.ok(got.day >= 1 && got.day <= 31);
	});
});
