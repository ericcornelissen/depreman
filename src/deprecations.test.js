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
import { clearTimeout, setInterval } from "node:timers";

import {
	getDeprecatedPackages,
} from "./deprecations.js";

test("deprecations.js", (t) => {
	t.test("getDeprecatedPackages", (t) => {
		const defaultOptions = {
			offline: false,
			omitDev: false,
			omitOptional: false,
			omitPeer: false,
		};

		const onlineTestCases = {
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
				want: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "foobar", version: "3.1.4" },
							],
						],
					},
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
					},
				},
				want: [
					{
						name: "bar",
						version: "3.1.4",
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "bar", version: "3.1.4" },
							],
						],
					},
				],
			},
			"deprecation warning split into fragments": {
				hierarchy: {
					dependencies: {
						foobar: {
							version: "3.1.4",
						},
					},
				},
				installLog: [
					"npm warn ",
					"deprecated foobar@3.1.4: This package is no longer supported.",
				],
				want: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "foobar", version: "3.1.4" },
							],
						],
					},
				],
			},
		};

		for (const [name, testCase] of Object.entries(onlineTestCases)) {
			t.test(name, async () => {
				const cp = createCp({
					"npm clean-install": {
						stderr: testCase.installLog,
					},
					"npm list --all --json": {
						stdout: [JSON.stringify(testCase.hierarchy)],
					},
				});
				const fs = createFs({
					"./package.json": JSON.stringify(testCase.manifest || {}),
					"./package-lock.json": "{}",
				});
				const options = {
					...defaultOptions,
					...testCase.options,
					offline: false,
				};

				const got = await getDeprecatedPackages({ cp, fs, options });
				assert.deepEqual(got, testCase.want);
			});
		}

		const offlineTestCases = {
			"basic sample": {
				lockfile: {
					lockfileVersion: 3,
					packages: {
						"node_modules/foobar": {
							deprecated: "This package is no longer supported.",
							version: "3.1.4",
						},
						"node_modules/deadend": {
							version: "2.7.1",
						},
					},
				},
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
				want: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "foobar", version: "3.1.4" },
							],
						],
					},
				],
			},
			"nested sample": {
				lockfile: {
					lockfileVersion: 3,
					packages: {
						"node_modules/foo": {
							version: "1.0.0",
						},
						"node_modules/foo/node_modules/bar": {
							deprecated: "bar@2 is outdated, upgrade to bar@3",
							version: "2.7.1",
						},
						"node_modules/bar": {
							version: "3.1.4",
						},
					},
				},
				hierarchy: {
					dependencies: {
						foo: {
							version: "1.0.0",
							dependencies: {
								bar: {
									version: "2.7.1",
								},
							},
						},
						bar: {
							version: "3.1.4",
						},
					},
				},
				want: [
					{
						name: "bar",
						version: "2.7.1",
						reason: "bar@2 is outdated, upgrade to bar@3",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.7.1" },
							],
						],
					},
				],
			},
			"omit development dependencies": {
				options: {
					omitDev: true,
				},
				lockfile: {
					lockfileVersion: 3,
					packages: {
						"node_modules/foo": {
							deprecated: "package foo is no longer supported.",
							dev: true,
							version: "3.1.4",
						},
						"node_modules/bar": {
							deprecated: "package bar is no longer supported.",
							version: "2.7.1",
						},
					},
				},
				hierarchy: {
					dependencies: {
						foo: {
							version: "3.1.4",
						},
						bar: {
							version: "2.7.1",
						},
					},
				},
				want: [
					{
						name: "bar",
						version: "2.7.1",
						reason: "package bar is no longer supported.",
						paths: [
							[
								{ name: "bar", version: "2.7.1" },
							],
						],
					},
				],
			},
			"omit optional dependencies": {
				options: {
					omitOptional: true,
				},
				lockfile: {
					lockfileVersion: 3,
					packages: {
						"node_modules/foo": {
							deprecated: "package foo is no longer supported.",
							optional: true,
							version: "3.1.4",
						},
						"node_modules/bar": {
							deprecated: "package bar is no longer supported.",
							version: "2.7.1",
						},
					},
				},
				hierarchy: {
					dependencies: {
						foo: {
							version: "3.1.4",
						},
						bar: {
							version: "2.7.1",
						},
					},
				},
				want: [
					{
						name: "bar",
						version: "2.7.1",
						reason: "package bar is no longer supported.",
						paths: [
							[
								{ name: "bar", version: "2.7.1" },
							],
						],
					},
				],
			},
			"omit peer dependencies": {
				options: {
					omitPeer: true,
				},
				lockfile: {
					lockfileVersion: 3,
					packages: {
						"node_modules/foo": {
							deprecated: "package foo is no longer supported.",
							peer: true,
							version: "3.1.4",
						},
						"node_modules/bar": {
							deprecated: "package bar is no longer supported.",
							version: "2.7.1",
						},
					},
				},
				hierarchy: {
					dependencies: {
						foo: {
							version: "3.1.4",
						},
						bar: {
							version: "2.7.1",
						},
					},
				},
				want: [
					{
						name: "bar",
						version: "2.7.1",
						reason: "package bar is no longer supported.",
						paths: [
							[
								{ name: "bar", version: "2.7.1" },
							],
						],
					},
				],
			},
		};

		for (const [name, testCase] of Object.entries(offlineTestCases)) {
			t.test(name, async () => {
				const cp = createCp({
					"npm list --all --json": {
						stdout: [JSON.stringify(testCase.hierarchy)],
					},
				});
				const fs = createFs({
					"./package.json": JSON.stringify(testCase.manifest || {}),
					"./package-lock.json": JSON.stringify(testCase.lockfile || {}),
				});
				const options = {
					...defaultOptions,
					...testCase.options,
					offline: true,
				};

				const got = await getDeprecatedPackages({ cp, fs, options });
				assert.deepEqual(got, testCase.want);
			});
		}

		t.test("dependency installation", (t) => {
			const options = defaultOptions;

			function setup() {
				return {
					cp: createCp({
						"npm install": {},
						"npm clean-install": {},
						"npm list --all --json": {
							stdout: ["{}"],
						},
					}),
					fs: createFs({
						"./package.json": "{}",
						"./package-lock.json": "{}",
					}),
				};
			}

			t.test("with lockfile", async () => {
				const { cp } = setup();

				const fs = createFs({
					"./package.json": "{}",
					"./package-lock.json": "{}",
				});

				await getDeprecatedPackages({ cp, fs, options });
				assert.equal(cp.spawn.mock.calls[0].arguments[1][0], "clean-install");
			});

			t.test("without lockfile", async () => {
				const { cp } = setup();

				const fs = createFs({
					"./package.json": "{}",
				});

				await getDeprecatedPackages({ cp, fs, options });
				assert.equal(cp.spawn.mock.calls[0].arguments[1][0], "install");
			});

			t.test("suppress auditing", async () => {
				const { cp, fs } = setup();

				await getDeprecatedPackages({ cp, fs, options });
				assert.ok(cp.spawn.mock.calls[0].arguments[1].includes("--no-audit"));
			});

			t.test("suppress funding", async () => {
				const { cp, fs } = setup();

				await getDeprecatedPackages({ cp, fs, options });
				assert.ok(cp.spawn.mock.calls[0].arguments[1].includes("--no-fund"));
			});

			t.test("suppress update notifier", async () => {
				const { cp, fs } = setup();

				await getDeprecatedPackages({ cp, fs, options });
				assert.ok(cp.spawn.mock.calls[0].arguments[1].includes("--no-update-notifier"));
			});
		});

		t.test("dependency hierarchy", (t) => {
			const options = defaultOptions;

			function setup() {
				return {
					cp: createCp({
						"npm install": {},
						"npm clean-install": {},
						"npm list --all --json": {
							stdout: ["{}"],
						},
					}),
					fs: createFs({
						"./package.json": "{}",
						"./package-lock.json": "{}",
					}),
				};
			}

			t.test("with lockfile", async () => {
				const { cp, fs } = setup();

				await getDeprecatedPackages({ cp, fs, options });
				assert.equal(cp.exec.mock.calls[0].arguments[0].trim(), "npm list --all --json");
			});
		});

		t.test("options", (t) => {
			function setup() {
				return {
					cp: createCp({
						"npm clean-install": {},
						"npm list --all --json": {
							stdout: ["{}"],
						},
					}),
					fs: createFs({
						"./package.json": "{}",
						"./package-lock.json": "{}",
					}),
				};
			}

			t.test("omitDev", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitDev: true,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit dev"));
					assert.ok(cp.exec.mock.calls[0].arguments[0].includes("--omit dev"));
				});

				t.test("false", async () => {
						const { cp, fs } = setup();

						const options = {
							...defaultOptions,
							omitDev: false,
						};

						await getDeprecatedPackages({ cp, fs, options });
						assert.ok(!cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit dev"));
						assert.ok(!cp.exec.mock.calls[0].arguments[0].includes("--omit dev"));
					});
			});

			t.test("omitOptional", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitOptional: true,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit optional"));
					assert.ok(cp.exec.mock.calls[0].arguments[0].includes("--omit optional"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitOptional: false,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(!cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit optional"));
					assert.ok(!cp.exec.mock.calls[0].arguments[0].includes("--omit optional"));
				});
			});

			t.test("omitPeer", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitPeer: true,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit peer"));
					assert.ok(cp.exec.mock.calls[0].arguments[0].includes("--omit peer"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitPeer: false,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(!cp.spawn.mock.calls[0].arguments[1].join(" ").includes("--omit peer"));
					assert.ok(!cp.exec.mock.calls[0].arguments[0].includes("--omit peer"));
				});
			});
		});

		t.test("online no lockfile", async () => {
			const options = defaultOptions;

			const cp = createCp({
				"npm install": {
					stderr: [
						"npm warn deprecated foobar@3.1.4: This package is no longer supported."
					],
				},
				"npm list --all --json": {
					stdout: [
						JSON.stringify({
							dependencies: {
								foobar: {
									version: "3.1.4",
								},
							},
						}),
					],
				},
			});
			const fs = createFs({
				"./package.json": "{}",
			});

			const want = [
				{
					name: "foobar",
					version: "3.1.4",
					reason: 'This package is no longer supported.',
					paths: [
						[
							{ name: "foobar", version: "3.1.4" },
						]
					],
				},
			];

			const got = await getDeprecatedPackages({ cp, fs, options });
			assert.deepEqual(got, want);
		});

		t.test("offline old lockfile", async () => {
			const cp = createCp({
				"npm list --all --json": {
					stdout: [JSON.stringify({})],
				},
			});
			const fs = createFs({
				"./package-lock.json": JSON.stringify({
					lockfileVersion: 2,
				}),
			});
			const options = {
				...defaultOptions,
				offline: true,
			};

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});

		t.test("deprecation warnings cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = createCp({
				"npm clean-install": {
					error: true,
				},
				"npm list --all --json": {
					stdout: ["{}"],
				},
			});
			const fs = createFs({
				"./package.json": "{}",
				"./package-lock.json": "{}",
			});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});

		t.test("dependency hierarchy cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = createCp({
				"npm clean-install": {},
				"npm list --all --json": {
					error: true,
					stdout: ["{}"],
				},
			});
			const fs = createFs({
				"./package.json": "{}",
				"./package-lock.json": "{}",
			});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});

		t.test("aliases cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = createCp({
				"npm clean-install": {},
				"npm list --all --json": {
					stdout: ["{}"],
				},
			});
			const fs = createFs({});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});
	});

	t.test("createCp", (t) => {
		t.test("exec", (t) => {
			t.test("command found", (t) => {
				t.test("fully specified", () => {
					const cmd = "foobar";
					const error = true;
					const stdout = ["Hello", "world!"];
					const stderr = ["foo", "bar"];

					const cp = createCp({
						[cmd]: { error, stdout, stderr },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], error);
						assert.equal(got[1].toString(), stdout.join(""));
						assert.equal(got[2].toString(), stderr.join(""));
					});
				});

				t.test("no error specified", () => {
					const cmd = "foobar";
					const stdout = ["foo", "bar"];
					const stderr = ["Hello", "world!"];

					const cp = createCp({
						[cmd]: { stdout, stderr },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], null);
						assert.equal(got[1].toString(), stdout.join(""));
						assert.equal(got[2].toString(), stderr.join(""));
					});
				});

				t.test("no stdout specified", () => {
					const cmd = "foo";
					const error = true;
					const stderr = ["bar", "baz"];

					const cp = createCp({
						[cmd]: { error, stderr },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], error);
						assert.equal(got[1].toString(), "");
						assert.equal(got[2].toString(), stderr.join(""));
					});
				});

				t.test("no stderr specified", () => {
					const cmd = "foo";
					const error = true;
					const stdout = ["baz", "bar"];

					const cp = createCp({
						[cmd]: { error, stdout },
					});

					cp.exec(cmd, {}, (...got) => {
						assert.equal(got[0], error);
						assert.equal(got[1].toString(), stdout.join(""));
						assert.equal(got[2].toString(), "");
					});
				});

				t.test("no stdout nor stderr specified", () => {
					const cmd = "foobar";
					const error = true;

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

			t.test("command not found", () => {
				const cp = createCp({ foo: {} });
				assert.ok(!cp.exec("bar"));
			});
		});

		t.test("spawn", (t) => {
			t.test("command found", (t) => {
				t.test("close handler, without error", (_, done) => {
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

				t.test("close handler, with error", (_, done) => {
					const cmd = "foobar";
					const error = true;

					const cp = createCp({
						[cmd]: { error },
					});

					const process = cp.spawn(cmd, []);
					process.on("close", (exitCode, actual) => {
						assert.equal(exitCode, 1);
						assert.equal(actual, error);
						done();
					});
				});

				t.test("stdout handler", (_, done) => {
					const cmd = "foobar";
					const stdout = ["Hello", "world!"];

					const cp = createCp({
						[cmd]: { stdout },
					});

					const process = cp.spawn(cmd, []);
					process.on("close", done);

					let i = 0;
					process.stdout.on("data", (data) => {
						assert.equal(data.toString(), stdout[i]);
						i += 1;
					});
				});

				t.test("stderr handler", (_, done) => {
					const cmd = "foobar";
					const stderr = ["Hello", "world!"];

					const cp = createCp({
						[cmd]: { stderr },
					});

					const process = cp.spawn(cmd, []);
					process.on("close", done);

					let i = 0;
					process.stderr.on("data", (data) => {
						assert.equal(data.toString(), stderr[i]);
						i += 1;
					});
				});

				t.test("register unknown process event handler", () => {
					const cmd = "foobar";

					const cp = createCp({ [cmd]: {} });

					const process = cp.spawn(cmd, []);
					assert.throws(() => process.on("foobar"));
				});

				t.test("register unknown stdout event handler", () => {
					const cmd = "foobar";

					const cp = createCp({ [cmd]: {} });

					const process = cp.spawn(cmd, []);
					assert.throws(() => process.stdout.on("foobar"));
				});

				t.test("register unknown stderr event handler", () => {
					const cmd = "foobar";

					const cp = createCp({ [cmd]: {} });

					const process = cp.spawn(cmd, []);
					assert.throws(() => process.stderr.on("foobar"));
				});
			});

			t.test("command not found", () => {
				const cp = createCp({ foo: {} });
				assert.ok(!cp.spawn("bar", ["baz"]));
			});
		});
	});

	t.test("createFs", (t) => {
		t.test("access", (t) => {
			t.test("file found", async () => {
				const name = "foobar";

				const fs = createFs({ [name]: "Hello world!" });
				await assert.doesNotReject(() => fs.access(name));
			});

			t.test("file not found", async () => {
				const fs = createFs({});
				await assert.rejects(() => fs.access("foobar"));
			});
		});

		t.test("readFile", (t) => {
			t.test("file found", async () => {
				const name = "foo";
				const content = "bar";

				const fs = createFs({ [name]: content });
				const got = await fs.readFile(name);
				assert.equal(got.toString(), content);
			});

			t.test("file not found", async () => {
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
						Buffer.from((stdout || []).join("")),
						Buffer.from((stderr || []).join("")),
					);

					break;
				}
			}
		}),
		spawn: mock.fn((cmd, args) => {
			for (const [command, result] of Object.entries(commands)) {
				if (`${cmd} ${args.join(" ")}`.includes(command)) {
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
									throw new Error(`Unknown event '${name}'`);
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
									throw new Error(`Unknown event '${name}'`);
								}
							},
						},
						on: (name, callback) => {
							switch (name) {
							case "close":
								handlers.close = callback;
								break;
							default:
								throw new Error(`Unknown event '${name}'`);
							}
						},
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
		access: mock.fn((path) => {
			if (!Object.hasOwn(files, path)) {
				const error = new Error("file not found");
				return Promise.reject(error);
			}

			return Promise.resolve();
		}),
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
 * @property {any} [error]
 * @property {string[]} [stdout]
 * @property {string[]} [stderr]
 */
