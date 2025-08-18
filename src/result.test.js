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

import { Err, Ok } from "./result.js";

test("result.js", (t) => {
	const arbitrary = {
		err: () => fc.anything().map((err) => new Err(err)),
		ok: () => fc.anything().map((value) => new Ok(value)),
	};

	t.test("Err", (t) => {
		t.test("and", (t) => {
			t.test("Err", () => {
				fc.assert(
					fc.property(
						arbitrary.err(),
						arbitrary.err(),
						(errA, errB) => {
							const got = errA.and(errB);
							const want = errA;
							assert.equal(got, want);
						}
					),
				);
			});

			t.test("Ok", () => {
				fc.assert(
					fc.property(
						arbitrary.err(),
						arbitrary.ok(),
						(err, ok) => {
							const got = err.and(ok);
							const want = err;
							assert.equal(got, want);
						}
					),
				);
			});
		});

		t.test("error", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const err = new Err(value);

					const got = err.error();
					const want = value;
					assert.equal(got, want);
				}),
			);
		});

		t.test("isErr", () => {
			fc.assert(
				fc.property(arbitrary.err(), (err) => {
					const got = err.isErr();
					const want = true;
					assert.equal(got, want);
				}),
			);
		});

		t.test("isOk", () => {
			fc.assert(
				fc.property(arbitrary.err(), (err) => {
					const got = err.isOk();
					const want = false;
					assert.equal(got, want);
				}),
			);
		});

		t.test("value", () => {
			fc.assert(
				fc.property(arbitrary.err(), (err) => {
					assert.throws(
						() => err.value(),
						{
							name: "TypeError",
							message: typeof err.error() === "string"
								? err.error()
								: "Err has no value",
						},
					);
				}),
			);
		});
	});

	t.test("Ok", (t) => {
		t.test("and", (t) => {
			t.test("Err", () => {
				fc.assert(
					fc.property(
						arbitrary.ok(),
						arbitrary.err(),
						(ok, err) => {
							const got = ok.and(err);
							const want = err;
							assert.equal(got, want);
						}
					),
				);
			});

			t.test("Ok", () => {
				fc.assert(
					fc.property(
						arbitrary.ok(),
						arbitrary.ok(),
						(okA, okB) => {
							const got = okA.and(okB);
							const want = okB;
							assert.equal(got, want);
						}
					),
				);
			});
		});

		t.test("error", () => {
			fc.assert(
				fc.property(arbitrary.ok(), (ok) => {
					assert.throws(
						() => ok.error(),
						{
							name: "TypeError",
							message: "Ok has no error",
						},
					);
				}),
			);
		});

		t.test("isErr", () => {
			fc.assert(
				fc.property(arbitrary.ok(), (ok) => {
					const got = ok.isErr();
					const want = false;
					assert.equal(got, want);
				}),
			);
		});

		t.test("isOk", () => {
			fc.assert(
				fc.property(arbitrary.ok(), (ok) => {
					const got = ok.isOk();
					const want = true;
					assert.equal(got, want);
				}),
			);
		});

		t.test("value", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const ok = new Ok(value);

					const got = ok.value();
					const want = value;
					assert.equal(got, want);
				}),
			);
		});
	});
});
