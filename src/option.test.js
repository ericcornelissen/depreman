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

import * as assert from "node:assert/strict";
import { test } from "node:test";

import * as fc from "fast-check";

import { None, Some } from "./option.js";

test("option.js", (t) => {
	t.test("None", (t) => {
		t.test("isNone", () => {
			const got = None.isNone();
			const want = true;
			assert.equal(got, want);
		});

		t.test("isSome", () => {
			const got = None.isSome();
			const want = false;
			assert.equal(got, want);
		});

		t.test("or", () => {
			t.test("None", () => {
				const got = None.or(None);
				const want = None;
				assert.equal(got, want);
			});

			t.test("Some", () => {
				fc.assert(
					fc.property(fc.anything(), (value) => {
						const some = new Some(value);

						const got = None.or(some);
						const want = some;
						assert.equal(got, want);
					}),
				);
			});
		});

		t.test("value", () => {
			assert.throws(
				() => None.value(),
				{
					name: "TypeError",
					message: "None has no value",
				},
			);
		});
	});

	t.test("Some", (t) => {
		t.test("isNone", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const some = new Some(value);

					const got = some.isNone();
					const want = false;
					assert.equal(got, want);
				}),
			);
		});

		t.test("isSome", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const some = new Some(value);

					const got = some.isSome();
					const want = true;
					assert.equal(got, want);
				}),
			);
		});

		t.test("or", () => {
			t.test("None", () => {
				fc.assert(
					fc.property(fc.anything(), (value) => {
						const some = new Some(value);

						const got = some.or(None);
						const want = some;
						assert.equal(got, want);
					}),
				);
			});

			t.test("Some", () => {
				fc.assert(
					fc.property(
						fc.anything(),
						fc.anything(),
						(valueA, valueB) => {
							const someA = new Some(valueA);
							const someB = new Some(valueB);

							const got = someA.or(someB);
							const want = someA;
							assert.equal(got, want);
						},
					),
				);
			});
		});

		t.test("value", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const some = new Some(value);

					const got = some.value();
					const want = value;
					assert.equal(got, want);
				}),
			);
		});
	});
});
