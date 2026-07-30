// Copyright (C) 2026  Eric Cornelissen
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

/* eslint-disable unicorn/prefer-await */

import * as assert from "node:assert/strict";
import { test } from "node:test";

import * as fc from "fast-check";

import { Promise as $Promise } from "./promise.js";

test("promise.js", (t) => {
	t.test("all", (t) => {
		t.test("no promises", async () => {
			const got = await $Promise.all([]);
			assert.deepEqual(got, []);
		});

		t.test("1 or more resolving promise", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(fc.integer(), { minLength: 1 }),
					async (values) => {
						const promises = [];
						for (const value of values) {
							const promise = Promise.resolve(value);
							promises.push(promise);
						}

						const got = await $Promise.all(promises);
						assert.equal(got.length, values.length);
						for (const value of values) {
							const found = got.includes(value);
							assert.ok(found);
						}
					},
				),
			);
		});

		t.test("1 or more rejecting promise", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(
						fc.tuple(
							fc.constantFrom("resolve", "reject"),
							fc.integer(),
						),
						{ minLength: 1 }
					),
					async (entries) => {
						fc.pre(entries.some(([kind]) => kind === "reject"));

						const promises = [];
						for (const [kind, value] of entries) {
							const promise = kind === "resolve"
								? Promise.resolve(value)
								: Promise.reject(value);
							promises.push(promise);
						}

						await assert.rejects(
							async () => await $Promise.all(promises),
						);
					},
				),
			);
		});
	});

	t.test("pool", (t) => {
		t.test("await empty pool", async () => {
			const pool = $Promise.pool(42);

			const got = await pool.await();
			assert.deepEqual(got, []);
		});

		t.test("queue within pool size", async () => {
			const pool = $Promise.pool(2);
			pool.add(() => Promise.resolve("foobar"));

			const got = await pool.await();
			assert.ok(got.includes("foobar"));
		});

		t.test("queue at pool size", async () => {
			const pool = $Promise.pool(2);
			pool.add(() => Promise.resolve("foo"));
			pool.add(() => Promise.resolve("bar"));

			const got = await pool.await();
			assert.ok(got.includes("foo"));
			assert.ok(got.includes("bar"));
		});

		t.test("queue beyond pool size", async () => {
			const pool = $Promise.pool(2);
			pool.add(() => Promise.resolve("foo"));
			pool.add(() => Promise.resolve("bar"));
			pool.add(() => Promise.resolve("baz"));

			const got = await pool.await();
			assert.ok(got.includes("foo"));
			assert.ok(got.includes("bar"));
			assert.ok(got.includes("baz"));
		});

		t.test("await pool before jobs have resolved", async () => {
			const pool = $Promise.pool(4);

			const p1 = Promise.withResolvers();
			const p2 = Promise.withResolvers();

			pool.add(() => p1.promise);
			pool.add(() => p2.promise);
			const promise = pool.await();

			let got = null;
			promise.then((result) => { got = result; });

			p1.resolve("foo");
			await p1.promise;
			assert.equal(got, null);

			p2.resolve("bar");
			await p2.promise;
			assert.equal(got, null);

			await promise;
			assert.ok(got.includes("foo"));
			assert.ok(got.includes("bar"));
		});

		t.test("pool size, job is queued", async () => {
			const pool = $Promise.pool(1);

			const p1 = Promise.withResolvers();
			const p2 = Promise.withResolvers();

			let wasCalled = false;
			pool.add(() => p1.promise);
			pool.add(() => {
				wasCalled = true;
				return p2.promise;
			});

			assert.equal(wasCalled, false);
			p1.resolve("foo");
			await p1.promise;
			assert.equal(wasCalled, true);
			p2.resolve("bar");

			const got = await pool.await();
			assert.ok(got.includes("foo"));
			assert.ok(got.includes("bar"));
		});

		t.test("pool size, job queued later", async () => {
			const pool = $Promise.pool(1);

			const p1 = Promise.withResolvers();
			const p2 = Promise.withResolvers();

			pool.add(() => p1.promise);
			p1.resolve("foo");
			await p1.promise;

			pool.add(() => p2.promise);
			p2.resolve("bar");
			await p2.promise;

			const got = await pool.await();
			assert.ok(got.includes("foo"));
			assert.ok(got.includes("bar"));
		});

		t.test("cannot add after awaiting", () => {
			const pool = $Promise.pool(8);

			pool.add(() => Promise.resolve());
			pool.await();

			assert.throws(
				() => {
					pool.add(() => {});
				},
				{
					name: "Error",
					message: /^cannot add to an awaited pool$/u,
				},
			);
		});

		t.test("cannot await after awaiting", async () => {
			const pool = $Promise.pool(8);

			pool.add(() => Promise.resolve());
			await pool.await();

			await assert.rejects(
				async () => {
					await pool.await();
				},
				{
					name: "Error",
					message: /^cannot await a pool multiple times/u,
				},
			);
		});
	});

	t.test("withResolvers", (t) => {
		t.test("resolve", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.anything(),
					async (value) => {
						const { promise, resolve } = $Promise.withResolvers();
						resolve(value);

						const got = await promise;
						assert.equal(got, value);
					},
				),
			);
		});

		t.test("reject", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.anything(),
					async (value) => {
						const { promise, reject } = $Promise.withResolvers();
						reject(value);

						await assert.rejects(
							async () => {
								await promise;
							},
							(error) => {
						    assert.equal(error, value);
						    return true;
						  },
						);
					},
				),
			);
		});
	});
});
