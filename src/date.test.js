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

import * as assert from "node:assert/strict";
import { test } from "node:test";

import * as fc from "fast-check";

import {
	DepremanDate,
	parse,
	today,
} from "./date.js";

test("date.js", (t) => {
	const arbitrary = {
		day: () => fc.integer({ min: 1, max: 31 }),
		month: () => fc.integer({ min: 1, max: 12 }),
		year: () => fc.integer({ min: 2000, max: 3000 }),

		rawDate: () =>
			fc.record({
				year: arbitrary.year(),
				month: arbitrary.month(),
				day: arbitrary.day(),
			}),

		invalidDate: () =>
			fc.oneof(
				// Strings not following the 'x-y-z' format
				fc.string().filter(str => str.split("-").length !== 3),

				// Strings following the 'x-y-z' format but not 'yyyy-mm-dd'
				fc.tuple(fc.string(), fc.string(), fc.string())
					.filter(([x, y, z]) => !/^\d{4}$/u.test(x) || !/^\d{1,2}$/u.test(y) || !/^\d{1,2}$/u.test(z))
					.map(([x, y, z]) => `${x}-${y}-${z}`),
			),
	};

	t.test("DepremanDate", (t) => {
		t.test("constructor", () => {
			fc.assert(
				fc.property(
					arbitrary.rawDate(),
					(raw) => {
						assert.doesNotThrow(() => {
							new DepremanDate(raw); // eslint-disable-line no-new
						});
					},
				),
			);
		});

		t.test("is", (t) => {
			t.test("compare to self", () => {
				fc.assert(
					fc.property(
						arbitrary.rawDate(),
						(raw) => {
							const date = new DepremanDate(raw);
							assert.ok(date.is(date));
						},
					),
				);
			});

			t.test("identical date", () => {
				fc.assert(
					fc.property(
						arbitrary.rawDate(),
						(raw) => {
							const dateA = new DepremanDate(raw);
							const dateB = new DepremanDate(raw);
							assert.ok(dateA.is(dateB));
							assert.ok(dateB.is(dateA));
						},
					),
				);
			});

			t.test("different year", () => {
				fc.assert(
					fc.property(
						fc.record({
							raw: arbitrary.rawDate(),
							year: arbitrary.year(),
						}),
						({ raw, year }) => {
							fc.pre(raw.year !== year);

							const dateA = new DepremanDate({ ...raw });
							const dateB = new DepremanDate({ ...raw, year });
							assert.ok(!dateA.is(dateB));
							assert.ok(!dateB.is(dateA));
						},
					),
				);
			});

			t.test("different month", () => {
				fc.assert(
					fc.property(
						fc.record({
							month: arbitrary.month(),
							raw: arbitrary.rawDate(),
						}),
						({ month, raw }) => {
							fc.pre(raw.month !== month);

							const dateA = new DepremanDate({ ...raw });
							const dateB = new DepremanDate({ ...raw, month });
							assert.ok(!dateA.is(dateB));
							assert.ok(!dateB.is(dateA));
						},
					),
				);
			});

			t.test("different day", () => {
				fc.assert(
					fc.property(
						fc.record({
							day: arbitrary.day(),
							raw: arbitrary.rawDate(),
						}),
						({ day, raw }) => {
							fc.pre(raw.day !== day);

							const dateA = new DepremanDate({ ...raw });
							const dateB = new DepremanDate({ ...raw, day });
							assert.ok(!dateA.is(dateB));
							assert.ok(!dateB.is(dateA));
						},
					),
				);
			});

			t.test("wrong type", () => {
				fc.assert(
					fc.property(
						fc.record({
							any: fc.anything(),
							raw: arbitrary.rawDate(),
						}),
						({ any, raw }) => {
							const date = new DepremanDate(raw);
							assert.throws(
								() => !date.is(any),
								{
									name: "TypeError",
									message: "other is not a date",
								},
							);
						},
					),
				);
			});
		});

		t.test("isBefore", (t) => {
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
				"previous month": {
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
				"previous day": {
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
				t.test(name, () => {
					const a = new DepremanDate(testCase.a);
					const b = new DepremanDate(testCase.b);
					assert.ok(a.isBefore(b));
				});
			}

			const falseCases = {
				"next year": {
					a: {
						year: 2024,
						month: 1,
						day: 1,
					},
					b: {
						year: 2023,
						month: 11,
						day: 2,
					}
				},
				"next month": {
					a: {
						year: 2024,
						month: 11,
						day: 1,
					},
					b: {
						year: 2024,
						month: 10,
						day: 2,
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
			};

			for (const [name, testCase] of Object.entries(falseCases)) {
				t.test(name, () => {
					const a = new DepremanDate(testCase.a);
					const b = new DepremanDate(testCase.b);
					assert.ok(!a.isBefore(b));
				});
			}

			t.test("one date is always before another", () => {
				fc.assert(
					fc.property(
						fc.record({
							rawA: arbitrary.rawDate(),
							rawB: arbitrary.rawDate(),
						}),
						({ rawA, rawB }) => {
							const dateA = new DepremanDate(rawA);
							const dateB = new DepremanDate(rawB);
							assert.ok(dateA.isBefore(dateB) || dateB.isBefore(dateA) || dateA.is(dateB));
						},
					),
				);
			});

			t.test("compare to self", () => {
				fc.assert(
					fc.property(
						arbitrary.rawDate(),
						(raw) => {
							const date = new DepremanDate(raw);
							assert.ok(!date.isBefore(date));
						},
					),
				);
			});

			t.test("wrong type", () => {
				fc.assert(
					fc.property(
						fc.record({
							any: fc.anything(),
							raw: arbitrary.rawDate(),
						}),
						({ any, raw }) => {
							const date = new DepremanDate(raw);
							assert.throws(
								() => !date.isBefore(any),
								{
									name: "TypeError",
									message: "other is not a date",
								},
							);
						},
					),
				);
			});
		});
	});

	t.test("parse", (t) => {
		const goodTestCases = {
			"full year": {
				str: "2024-12-31",
				raw: {
					year: 2024,
					month: 12,
					day: 31,
				},
			},
			"day and month prefixed with zero": {
				str: "2025-01-01",
				raw: {
					year: 2025,
					month: 1,
					day: 1,
				},
			},
			"day and month NOT prefixed with zero": {
				str: "2024-1-1",
				raw: {
					year: 2024,
					month: 1,
					day: 1,
				},
			},
			"earliest valid date": {
				str: "2000-01-01",
				raw: {
					year: 2000,
					month: 1,
					day: 1,
				},
			},
			"earliest month and day": {
				str: "2025-01-01",
				raw: {
					year: 2025,
					month: 1,
					day: 1,
				},
			},
			"earliest month": {
				str: "2025-01-04",
				raw: {
					year: 2025,
					month: 1,
					day: 4,
				},
			},
			"earliest day": {
				str: "2025-02-01",
				raw: {
					year: 2025,
					month: 2,
					day: 1,
				},
			},
			"latest valid date": {
				str: "2999-12-31",
				raw: {
					year: 2999,
					month: 12,
					day: 31,
				},
			},
			"latest month and day": {
				str: "2025-12-31",
				raw: {
					year: 2025,
					month: 12,
					day: 31,
				},
			},
			"latest month": {
				str: "2025-12-4",
				raw: {
					year: 2025,
					month: 12,
					day: 4,
				},
			},
			"latest day": {
				str: "2025-2-31",
				raw: {
					year: 2025,
					month: 2,
					day: 31,
				},
			},
		};

		for (const [name, testCase] of Object.entries(goodTestCases)) {
			const { str, raw } = testCase;
			t.test(name, () => {
				const result = parse(str);
				assert.ok(result.isOk());

				const got = result.value();
				assert.ok(got instanceof DepremanDate);

				const want = new DepremanDate(raw);
				assert.ok(got.is(want));
			});
		}

		const badTestCases = {
			"month 0": {
				str: "2025-00-01",
				want: "invalid date '2025-00-01'",
			},
			"month 13": {
				str: "2025-13-01",
				want: "invalid date '2025-13-01'",
			},
			"day 32": {
				str: "2025-01-32",
				want: "invalid date '2025-01-32'",
			},
			"day 0": {
				str: "2025-01-00",
				want: "invalid date '2025-01-00'",
			},
			"too far in the past (catch likely mistakes in the year)": {
				str: "1025-01-01",
				want: "invalid date '1025-01-01'",
			},
			"too far in the future (catch likely mistakes in the year)": {
				str: "3035-01-01",
				want: "invalid date '3035-01-01'",
			},
			"not a date": {
				str: "foobar",
				want: "invalid date 'foobar' (must be 'yyyy-mm-dd')",
			},
			"short year": {
				str: "25-01-01",
				want: "invalid date '25-01-01' (must be 'yyyy-mm-dd')",
			},
			"valid year with prefix": {
				str: "prefix2025-01-01",
				want: "invalid date 'prefix2025-01-01' (must be 'yyyy-mm-dd')",
			},
			"valid year with suffix": {
				str: "2025-01-01suffix",
				want: "invalid date '2025-01-01suffix' (must be 'yyyy-mm-dd')",
			},
		};

		for (const [name, testCase] of Object.entries(badTestCases)) {
			const { str, want } = testCase;
			t.test(name, () => {
				const result = parse(str);
				assert.ok(result.isErr());

				const err = result.error();
				assert.equal(err, want);
			});
		}

		t.test("correct format", () => {
			fc.assert(
				fc.property(
					arbitrary.rawDate(),
					(rawDate) => {
						const { year, month, day } = rawDate;
						const str = `${year}-${month}-${day}`;

						const result = parse(str);
						assert.ok(result.isOk());

						const got = result.value();
						assert.ok(got instanceof DepremanDate);

						const want = new DepremanDate(rawDate);
						assert.ok(got.is(want));
					},
				),
			);
		});

		t.test("wrong format", () => {
			fc.assert(
				fc.property(
					arbitrary.invalidDate(),
					(str) => {
						const result = parse(str);
						assert.ok(result.isErr());

						const err = result.error();
						assert.equal(err, `invalid date '${str}' (must be 'yyyy-mm-dd')`);
					},
				),
			);
		});
	});

	t.test("today", () => {
		const got = today();
		assert.ok(got instanceof DepremanDate);

		const want = new DepremanDate({
			year: (new Date()).getFullYear(),
			month: (new Date()).getMonth() + 1,
			day: (new Date()).getDate(),
		});
		assert.ok(got.is(want));
	});
});
