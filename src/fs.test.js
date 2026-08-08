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

import { FS } from "./fs.js";
import { FS as MockFS } from "./fs.mock.js";

test("fs.js", async (t) => {
	await t.test("access", async (t) => {
		await t.test("file accessible", async (t) => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						filepath: fc.string(),
					}),
					async ({ filepath }) => {
						const access = t.mock.fn(() => Promise.resolve());

						const fs = new FS({ access });
						const got = await fs.access(filepath);
						assert.equal(got, true);

						assert.equal(access.mock.callCount(), 1);
						const call = access.mock.calls[0];
						assert.equal(call.arguments[0], filepath);
					},
				),
			);
		});

		await t.test("file not accessible", async (t) => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						filepath: fc.string(),
						error: fc.string(),
					}),
					async ({ filepath, error }) => {
						const access = t.mock.fn(() => Promise.reject(new Error(error)));

						const fs = new FS({ access });
						const got = await fs.access(filepath);
						assert.equal(got, false);

						assert.equal(access.mock.callCount(), 1);
						const call = access.mock.calls[0];
						assert.equal(call.arguments[0], filepath);
					},
				),
			);
		});
	});

	await t.test("readFile", async (t) => {
		await t.test("file can be read", async (t) => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						filepath: fc.string(),
						content: fc.string(),
					}),
					async ({ filepath, content }) => {
						const readFile = t.mock.fn(() => Promise.resolve(content));

						const fs = new FS({ readFile });
						const got = await fs.readFile(filepath);
						assert.ok(got.isOk());
						assert.equal(got.value(), content);

						assert.equal(readFile.mock.callCount(), 1);
						const call = readFile.mock.calls[0];
						assert.equal(call.arguments[0], filepath);
						assert.equal(call.arguments[1]?.encoding, "utf8");
					},
				),
			);
		});

		await t.test("file cannot be read", async (t) => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						filepath: fc.string(),
						error: fc.string(),
					}),
					async ({ filepath, error }) => {
						const readFile = t.mock.fn(() => Promise.reject(new Error(error)));

						const fs = new FS({ readFile });
						const got = await fs.readFile(filepath);
						assert.ok(got.isErr());
						assert.equal(got.error(), error);

						assert.equal(readFile.mock.callCount(), 1);
						const call = readFile.mock.calls[0];
						assert.equal(call.arguments[0], filepath);
					},
				),
			);
		});
	});
});

test("fs.mock.js", async (t) => {
	await t.test("FS", async (t) => {
		await t.test("access", async (t) => {
			await t.test("file present", async () => {
				await fc.assert(
					fc.asyncProperty(
						fc.record({
							files: fc.dictionary(fc.string(), fc.string()),
							filepath: fc.string().filter(v => v !== "__proto__"),
							content: fc.string(),
						}),
						async ({ files, filepath, content }) => {
							files[filepath] = content;

							const fs = new MockFS(files);
							const got = await fs.access(filepath);
							assert.equal(got, true);
						},
					),
				);
			});

			await t.test("file not present", async () => {
				await fc.assert(
					fc.asyncProperty(
						fc.record({
							files: fc.dictionary(fc.string(), fc.string()),
							filepath: fc.string(),
						}),
						async ({ files, filepath }) => {
							fc.pre(!Object.hasOwn(files, filepath))

							const fs = new MockFS(files);
							const got = await fs.access(filepath);
							assert.equal(got, false);
						},
					),
				);
			});
		});

		await t.test("readFile", async (t) => {
			await t.test("file present", async () => {
				await fc.assert(
					fc.asyncProperty(
						fc.record({
							files: fc.dictionary(fc.string(), fc.string()),
							filepath: fc.string().filter(v => v !== "__proto__"),
							content: fc.string(),
						}),
						async ({ files, filepath, content }) => {
							files[filepath] = content;

							const fs = new MockFS(files);
							const got = await fs.readFile(filepath);
							assert.ok(got.isOk());
							assert.equal(got.value(), content);
						},
					),
				);
			});

			await t.test("file not present", async () => {
				await fc.assert(
					fc.asyncProperty(
						fc.record({
							files: fc.dictionary(fc.string(), fc.string()),
							filepath: fc.string(),
						}),
						async ({ files, filepath }) => {
							fc.pre(!Object.hasOwn(files, filepath))

							const fs = new MockFS(files);
							const got = await fs.readFile(filepath);
							assert.ok(got.isErr());
							assert.equal(got.error(), "file not found");
						},
					),
				);
			});
		});
	});
});
