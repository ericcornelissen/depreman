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
import { Buffer } from "node:buffer";
import { mock, test } from "node:test";

import * as fc from "fast-check";

import { CP } from "./cp.js";
import { CP as MockCP } from "./cp.mock.js";

test("cp.js", (t) => {
	t.test("exec", (t) => {
		t.test("child_process usage", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						cmd: fc.string(),
						args: fc.array(fc.string()),
						error: fc.oneof(
							fc.constant(null),
							fc.string().map(msg => new Error(msg)),
						),
						stdout: fc.string(),
						stderr: fc.string(),
					}),
					async ({ cmd, args, error, stdout, stderr }) => {
						const exec = createExec({
							error,
							stdout,
							stderr,
						});

						const cp = new CP({ exec });
						await cp.exec(cmd, args);
						assert.equal(exec.mock.callCount(), 1);

						const call = exec.mock.calls[0];
						assert.ok(call.arguments[0].startsWith(cmd));
						for (const arg of args) {
							assert.ok(call.arguments[0].includes(` ${arg}`));
						}
						assert.equal(typeof call.arguments[1], "function");
					},
				),
			);
		});

		t.test("command succeeds", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						cmd: fc.string(),
						args: fc.array(fc.string()),
						stdout: fc.string(),
						stderr: fc.string(),
					}),
					async ({ cmd, args, stdout, stderr }) => {
						const exec = createExec({
							error: null,
							stdout,
							stderr,
						});

						const cp = new CP({ exec });
						const got = await cp.exec(cmd, args);
						assert.ok(got.isOk());

						const ok = got.value();
						assert.deepEqual(ok.stdout, stdout);
						assert.deepEqual(ok.stderr, stderr);
					},
				),
			);
		});

		t.test("command fails", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						cmd: fc.string(),
						args: fc.array(fc.string()),
						error: fc.string().map(msg => new Error(msg)),
						stdout: fc.string(),
						stderr: fc.string(),
					}),
					async ({ cmd, args, error, stdout, stderr }) => {
						const exec = createExec({
							error,
							stdout,
							stderr,
						});

						const cp = new CP({ exec });
						const got = await cp.exec(cmd, args);
						assert.ok(got.isErr());

						const err = got.error();
						assert.deepEqual(err.stdout, stdout);
						assert.deepEqual(err.stderr, stderr);
					},
				),
			);
		});
	});

	function createExec(result) {
		return mock.fn((_, callback) => {
			const { error, stdout, stderr } = result;
			callback(
				error,
				Buffer.from(stdout),
				Buffer.from(stderr),
			);
		});
	}
});

test("cp.mock.js", (t) => {
	t.test("CP", (t) => {
		t.test("exec", (t) => {
			t.test("command found", (t) => {
				t.test("command succeeds", async () => {
					await fc.assert(
						fc.asyncProperty(
							fc.record({
								cmd: fc.string(),
								args: fc.array(fc.string()),
								stdout: fc.string(),
								stderr: fc.string(),
							}),
							async ({ cmd, args, stdout, stderr }) => {
								const cp = new MockCP({
									[`${cmd} ${args.join(" ")}`]: {
										error: false,
										stdout,
										stderr,
									},
								});

								const got = await cp.exec(cmd, args);
								assert.ok(got.isOk());

								const ok = got.value();
								assert.equal(ok.stdout, stdout);
								assert.equal(ok.stderr, stderr);
							},
						),
					);
				});

				t.test("command errors", async () => {
					await fc.assert(
						fc.asyncProperty(
							fc.record({
								cmd: fc.string(),
								args: fc.array(fc.string()),
								stdout: fc.string(),
								stderr: fc.string(),
							}),
							async ({ cmd, args, stdout, stderr }) => {
								const cp = new MockCP({
									[`${cmd} ${args.join(" ")}`]: {
										error: true,
										stdout,
										stderr,
									},
								});

								const got = await cp.exec(cmd, args);
								assert.ok(got.isErr());

								const err = got.error();
								assert.equal(err.stdout, stdout);
								assert.equal(err.stderr, stderr);
							},
						),
					);
				});
			});

			t.test("command not found", () => {
				fc.assert(
					fc.property(
						fc.record({
							cmd: fc.string(),
							args: fc.array(fc.string(),),
							stdout: fc.string(),
							stderr: fc.string(),
						}),
						({ cmd, args }) => {
							const cp = new MockCP({
								[`not ${cmd} ${args.join(" ")}`]: {},
							});

							assert.throws(
								() => {
									cp.exec(cmd, args);
								},
								{
									name: "Error",
									message: /command not found '.+?'/u,
								},
							);
						},
					),
				);
			});
		});
	});
});
