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
import { setTimeout } from "node:timers";

import * as fc from "fast-check";

import { CP } from "./cp.js";
import { CP as MockCP } from "./cp.mock.js";

test("cp.js", (t) => {
	t.test("exec", (t) => {
		t.test("command succeeds", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						cmd: fc.string(),
						args: fc.array(fc.string()),
						stdout: fc.array(fc.string()),
						stderr: fc.array(fc.string()),
					}),
					async ({ cmd, args, stdout, stderr }) => {
						const spawn = createSpawn({
							error: false,
							stdout,
							stderr,
						});

						const cp = new CP({ spawn });
						const got = await cp.exec(cmd, args);
						assert.ok(got.isOk());

						const ok = got.value();
						assert.equal(ok.exitCode, 0);
						assert.deepEqual(ok.stdout, stdout.join(""));
						assert.deepEqual(ok.stderr, stderr.join(""));

						assert.equal(spawn.mock.callCount(), 1);
						const call = spawn.mock.calls[0];
						assert.equal(call.arguments[0], cmd);
						assert.deepEqual(call.arguments[1], args);
						assert.deepEqual(call.arguments[2], { shell: false });
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
						stdout: fc.array(fc.string()),
						stderr: fc.array(fc.string()),
					}),
					async ({ cmd, args, stdout, stderr }) => {
						const spawn = createSpawn({
							error: true,
							stdout,
							stderr,
						});

						const cp = new CP({ spawn });
						const got = await cp.exec(cmd, args);
						assert.ok(got.isErr());

						const err = got.error();
						assert.equal(err.exitCode, 1);
						assert.deepEqual(err.stdout, stdout.join(""));
						assert.deepEqual(err.stderr, stderr.join(""));

						assert.equal(spawn.mock.callCount(), 1);
						const call = spawn.mock.calls[0];
						assert.equal(call.arguments[0], cmd);
						assert.deepEqual(call.arguments[1], args);
						assert.deepEqual(call.arguments[2], { shell: false });
					},
				),
			);
		});
	});

	function createSpawn(result) {
		return mock.fn(() => {
			const { error, stdout, stderr } = result;

			const outLines = stdout ? [...stdout] : [];
			const errLines = stderr ? [...stderr] : [];

			const handlers = {};
			const process = {
				stdout: {
					on: (name, callback) => {
						switch (name) {
							case "data":
								handlers.stdout = callback;
								break;
							default:
								throw new Error(`Unsupported event '${name}'`);
						}
					},
				},
				stderr: {
					on: (name, callback) => {
						switch (name) {
							case "data":
								handlers.stderr = callback;
								break;
							default:
								throw new Error(`Unsupported event '${name}'`);
						}
					},
				},
				on: (name, callback) => {
					switch (name) {
						case "close":
							handlers.close = callback;
							break;
						default:
							throw new Error(`Unsupported event '${name}'`);
					}
				},
			};

			setTimeout(() => {
				for (const line of outLines) {
					const data = Buffer.from(line);
					handlers.stdout?.(data);
				}

				for (const line of errLines) {
					const data = Buffer.from(line);
					handlers.stderr?.(data);
				}

				handlers.close?.(error ? 1 : 0);
			}, 0);

			return process;
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
								assert.equal(ok.exitCode, 0);
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
								assert.equal(err.exitCode, 1);
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
