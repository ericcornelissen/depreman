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

test("result.js", async (t) => {
	await t.test("Err", async (t) => {
		await t.test("error", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const err = new Err(value);

					const got = err.error();
					const want = value;
					assert.equal(got, want);
				}),
			);
		});

		await t.test("isErr", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const err = new Err(value);

					const got = err.isErr();
					const want = true;
					assert.equal(got, want);
				}),
			);
		});

		await t.test("isOk", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const err = new Err(value);

					const got = err.isOk();
					const want = false;
					assert.equal(got, want);
				}),
			);
		});

		await t.test("value", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const err = new Err(value);

					assert.throws(
						() => err.value(),
						{
							name: "TypeError",
							message: "Err has no value",
						},
					);
				}),
			);
		});
	});

	await t.test("Ok", async (t) => {
		await t.test("error", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const ok = new Ok(value);

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

		await t.test("isErr", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const ok = new Ok(value);

					const got = ok.isErr();
					const want = false;
					assert.equal(got, want);
				}),
			);
		});

		await t.test("isOk", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const ok = new Ok(value);

					const got = ok.isOk();
					const want = true;
					assert.equal(got, want);
				}),
			);
		});

		await t.test("value", () => {
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
