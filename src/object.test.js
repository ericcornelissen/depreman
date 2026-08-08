// Copyright (C) 2025-2026  Eric Cornelissen
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

import { Object } from "./object.js";

test("object.js", async (t) => {
	await t.test("entries", async (t) => {
		await t.test("example", () => {
			const object = {
				foo: "bar",
				"hello world": "!",
				digit: 42,
			};

			const got = Object.entries(object);
			const want = [
				["foo", "bar"],
				["hello world", "!"],
				["digit", 42],
			];

			assert.deepEqual(got, want);
		});

		await t.test("value", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.bigInt(),
						fc.boolean(),
						fc.float(),
						fc.integer(),
						fc.object(),
						fc.string(),
					),
					(object) => {
						const got = Object.entries(object);
						assert.ok(Array.isArray(got));
					},
				),
			);
		});

		await t.test("undefined", () => {
			const got = Object.entries(undefined);
			const want = [];
			assert.deepEqual(got, want);
		});

		await t.test("null", () => {
			const got = Object.entries(null);
			const want = [];
			assert.deepEqual(got, want);
		});
	});

	await t.test("hasOwn", async (t) => {
		await t.test("own key", () => {
			fc.assert(
				fc.property(
					fc.record({
						object: fc.object(),
						key: fc.string().filter(key => key !== "__proto__"),
						value: fc.anything(),
					}),
					({ object, key, value }) => {
						object[key] = value;

						const got = Object.hasOwn(object, key);
						assert.equal(got, true);
					},
				),
			);
		});

		await t.test("not own key", () => {
			fc.assert(
				fc.property(
					fc.record({
						object: fc.object(),
						key: fc.string(),
					}),
					({ object, key }) => {
						delete object[key];

						const got = Object.hasOwn(object, key);
						assert.equal(got, false);
					},
				),
			);
		});

		await t.test("undefined", () => {
			fc.assert(
				fc.property(fc.string(), (key) => {
						const got = Object.hasOwn(undefined, key);
						const want = false;
						assert.deepEqual(got, want);
				}),
			);
		});

		await t.test("null", () => {
			fc.assert(
				fc.property(fc.string(), (key) => {
					const got = Object.hasOwn(null, key);
					const want = false;
					assert.deepEqual(got, want);
				}),
			);
		});
	});

	await t.test("keys", async (t) => {
		await t.test("example", () => {
			const object = {
				foo: "bar",
				"hello world": "!",
			};

			const got = Object.keys(object);
			const want = [
				"foo",
				"hello world",
			];

			assert.deepEqual(got, want);
		});

		await t.test("value", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.bigInt(),
						fc.boolean(),
						fc.float(),
						fc.integer(),
						fc.object(),
						fc.string(),
					),
					(object) => {
						const got = Object.entries(object);
						assert.ok(Array.isArray(got));
					},
				),
			);
		});

		await t.test("undefined", () => {
			const got = Object.keys(undefined);
			const want = [];
			assert.deepEqual(got, want);
		});

		await t.test("null", () => {
			const got = Object.keys(null);
			const want = [];
			assert.deepEqual(got, want);
		});
	});

	await t.test("values", async (t) => {
		await t.test("example", () => {
			const object = {
				foo: "bar",
				digit: 42,
			};

			const got = Object.values(object);
			const want = [
				"bar",
				42,
			];

			assert.deepEqual(got, want);
		});

		await t.test("value", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.bigInt(),
						fc.boolean(),
						fc.float(),
						fc.integer(),
						fc.object(),
						fc.string(),
					),
					(object) => {
						const got = Object.values(object);
						assert.ok(Array.isArray(got));
					},
				),
			);
		});

		await t.test("undefined", () => {
			const got = Object.values(undefined);
			const want = [];
			assert.deepEqual(got, want);
		});

		await t.test("null", () => {
			const got = Object.values(null);
			const want = [];
			assert.deepEqual(got, want);
		});
	});
});
