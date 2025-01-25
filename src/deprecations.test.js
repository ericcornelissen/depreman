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

import {
	getDeprecatedPackages,
} from "./deprecations.js";

test("deprecations.js", async (t) => {
	await t.test("getDeprecatedPackages", async (t) => {
		const defaultOptions = {
			omitDev: false,
			omitOptional: false,
			omitPeer: false,
		};

		const testCases = {
			"basic sample": {
				hierarchy: {
					dependencies: {
						foobar: {
							version: "3.1.4",
						},
						deadend: {
							version: "2.7.1",
						},
					},
				},
				installLog: [
					"npm warn deprecated foobar@3.1.4: This package is no longer supported.",
				],
				options: defaultOptions,
				want: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: 'This package is no longer supported.',
						paths: [
							[
								{ name: "foobar", version: "3.1.4" },
							]
						],
					}
				],
			},
			"alias sample": {
				hierarchy: {
					dependencies: {
						foo: {
							version: "3.1.4",
						},
					},
				},
				installLog: [
					"npm warn deprecated bar@3.1.4: This package is no longer supported.",
				],
				manifest: {
					dependencies: {
						"foo": "npm:bar@3.1.4",
					}
				},
				options: defaultOptions,
				want: [
					{
						name: "bar",
						version: "3.1.4",
						reason: 'This package is no longer supported.',
						paths: [
							[
								{ name: "bar", version: "3.1.4" },
							]
						],
					}
				],
			},
		};

		for (const [name, testCase] of Object.entries(testCases)) {
			await t.test(name, async () => {
				const { options, want } = testCase;

				const cp = createCp({
					"npm clean-install": {
						stderr: testCase.installLog.join("\n"),
					},
					"npm list --all --json": {
						stdout: JSON.stringify(testCase.hierarchy),
					},
				});
				const fs = createFs({
					"./package.json": JSON.stringify(testCase.manifest || {}),
				});

				const got = await getDeprecatedPackages({ cp, fs, options });
				assert.deepEqual(got, want);
			});
		}

		await t.test("options", async (t) => {
			function setup() {
				return {
					cp: createCp({
						"npm clean-install": {},
						"npm list --all --json": { stdout: "{}", },
					}),
					fs: createFs({
						"./package.json": "{}",
					}),
				};
			}

			await t.test("omitDev", async () => {
				const { cp, fs } = setup();

				const options = {
					...defaultOptions,
					omitDev: true,
				};

				await getDeprecatedPackages({ cp, fs, options })
				assert.ok(cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit dev"));
				assert.ok(cp.exec.mock.calls[0].arguments[0].includes("--omit dev"));
			});

			await t.test("omitOptional", async () => {
				const { cp, fs } = setup();

				const options = {
					...defaultOptions,
					omitOptional: true,
				};

				await getDeprecatedPackages({ cp, fs, options })
				assert.ok(cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit optional"));
				assert.ok(cp.exec.mock.calls[0].arguments[0].includes("--omit optional"));
			});

			await t.test("omitPeer", async () => {
				const { cp, fs } = setup();

				const options = {
					...defaultOptions,
					omitPeer: true,
				};

				await getDeprecatedPackages({ cp, fs, options })
				assert.ok(cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit peer"));
				assert.ok(cp.exec.mock.calls[0].arguments[0].includes("--omit peer"));
			});
		});

		await t.test("deprecation warnings cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = createCp({
				"npm clean-install": { error: true },
				"npm list --all --json": { stdout: "{}" },
			});
			const fs = createFs({
				"./package.json": "{}",
			});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});

		await t.test("dependency hierarchy cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = createCp({
				"npm clean-install": {},
				"npm list --all --json": {
					error: true,
					stdout: "{}",
				},
			});
			const fs = createFs({
				"./package.json": "{}",
			});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});

		await t.test("aliases cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = createCp({
				"npm clean-install": {},
				"npm list --all --json": { stdout: "{}" },
			});
			const fs = createFs({});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});
	});

	await t.test("createCp", async (t) => {
		await t.test("exec", async (t) => {
			await t.test("command found", async (t) => {
				await t.test("fully specified", () => {
					const cmd = "foobar";
					const error = new Error();
					const stdout = "Hello";
					const stderr = "world!";

					const cp = createCp({
						[cmd]: { error, stdout, stderr },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], error);
						assert.equal(got[1].toString(), stdout);
						assert.equal(got[2].toString(), stderr);
					});
				});

				await t.test("no error specified", () => {
					const cmd = "foobar";
					const stdout = "Hello";
					const stderr = "world!";

					const cp = createCp({
						[cmd]: { stdout, stderr },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], null);
						assert.equal(got[1].toString(), stdout);
						assert.equal(got[2].toString(), stderr);
					});
				});

				await t.test("no stdout specified", () => {
					const cmd = "foo";
					const error = new Error();
					const stderr = "bar";

					const cp = createCp({
						[cmd]: { error, stderr },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], error);
						assert.equal(got[1].toString(), "");
						assert.equal(got[2].toString(), stderr);
					});
				});

				await t.test("no stderr specified", () => {
					const cmd = "foo";
					const error = new Error();
					const stdout = "bar";

					const cp = createCp({
						[cmd]: { error, stdout },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], error);
						assert.equal(got[1].toString(), stdout);
						assert.equal(got[2].toString(), "");
					});
				});

				await t.test("no stdout nor stderr specified", () => {
					const cmd = "foobar";
					const error = new Error();

					const cp = createCp({
						[cmd]: { error },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], error);
						assert.equal(got[1].toString(), "");
						assert.equal(got[2].toString(), "");
					});
				});
			});

			await t.test("command not found", () => {
				const cp = createCp({ foo: {} });
				assert.ok(!cp.exec("bar"));
			});
		});

		await t.test("spawn", async (t) => {
			await t.test("command found", async (t) => {
				await t.test("close handler, without error", (_, done) => {
					const cmd = "foobar";

					const cp = createCp({
						[cmd]: {},
					});

					const process = cp.spawn(cmd, []);
					process.on("close", (exitCode, error) => {
						assert.equal(exitCode, 0);
						assert.equal(error, null);
						done();
					});
				});

				await t.test("close handler, with error", (_, done) => {
					const cmd = "foobar";
					const error = new Error();

					const cp = createCp({
						[cmd]: { error },
					});

					const process = cp.spawn(cmd, []);
					process.on("close", (exitCode, error) => {
						assert.equal(exitCode, 1);
						assert.equal(error, error);
						done();
					});
				});

				await t.test("stdout handler", (_, done) => {
					const cmd = "foobar";
					const stdout = "Hello world!";

					const cp = createCp({
						[cmd]: { stdout },
					});

					const process = cp.spawn(cmd, []);
					process.on("close", done);
					process.stdout.on("data", (data) => {
						assert.equal(data.toString(), stdout);
					});
				});

				await t.test("stderr handler", (_, done) => {
					const cmd = "foobar";
					const stderr = "Hello world!";

					const cp = createCp({
						[cmd]: { stderr },
					});

					const process = cp.spawn(cmd, []);
					process.on("close", done);
					process.stderr.on("data", (data) => {
						assert.equal(data.toString(), stderr);
					});
				});
			});

			await t.test("command not found", () => {
				const cp = createCp({ foo: {} });
				assert.ok(!cp.spawn("bar", ["baz"]));
			});
		});
	});

	await t.test("createFs", async (t) => {
		await t.test("readFile", async (t) => {
			await t.test("file found", async () => {
				const name = "foo";
				const content = "bar";

				const fs = createFs({ [name]: content });
				const got = await fs.readFile(name);
				assert.equal(got.toString(), content);
			});

			await t.test("file not found", async () => {
				const fs = createFs({});
				await assert.rejects(() => fs.readFile("foobar"));
			});
		});
	});
});

/**
 * @param {Object<string, MockCommand>} commands
 * @returns {ChildProcess}
 */
function createCp(commands) {
	return {
		exec: mock.fn((cmd, _, callback) => {
			for (const [command, result] of Object.entries(commands)) {
				if (cmd.includes(command)) {
					const { error, stdout, stderr } = result;
					callback(
						error || null,
						Buffer.from(stdout || ""),
						Buffer.from(stderr || ""),
					);

					break;
				}
			}
		}),
		spawn: mock.fn((cmd, args) => {
			for (const [command, result] of Object.entries(commands)) {
				if (`${cmd} ${args.join(" ")}`.includes(command)) {
					const { error, stdout, stderr } = result;

					const outLines = (stdout || "").split("\n");
					const errLines = (stderr || "").split("\n");

					const handlers = {};
					const process = {
						stdout: { on: (_, callback) => { handlers.stdout = callback; } },
						stderr: { on: (_, callback) => { handlers.stderr = callback; } },
						on: (_, callback) => { handlers.close = callback; },
					};

					const id = setInterval(() => {
						if (outLines.length > 0) {
							const line = outLines.shift();
							const data = Buffer.from(line);
							handlers.stdout?.(data);
						} else if (errLines.length > 0) {
							const line = errLines.shift();
							const data = Buffer.from(line);
							handlers.stderr?.(data);
						} else {
							try {
								handlers.close?.(error ? 1 : 0, error || null);
							} finally {
								clearTimeout(id);
							}
						}
					}, 1);

					return process;
				}
			}
		}),
	};
}

/**
 * @param {Object<string, string>} files
 * @returns {FileSystem}
 */
function createFs(files) {
	return {
		readFile: mock.fn((path) => {
			if (!Object.hasOwn(files, path)) {
				const error = new Error("file not found");
				return Promise.reject(error);
			}

			const content = files[path];
			const bytes = Buffer.from(content);
			return Promise.resolve(bytes);
		}),
	};
}

/** @typedef {import("./deprecations.js").ChildProcess} ChildProcess */
/** @typedef {import("./deprecations.js").FileSystem} FileSystem */

/**
 * @typedef MockCommand
 * @property {any} error
 * @property {string} stdout
 * @property {string} stderr
 */
