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
				manifest: {},
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

				const fs = createFs({
					"./package.json": JSON.stringify(testCase.manifest),
				});
				const cp = createCp({
					"npm clean-install": {
						error: null,
						stdout: "",
						stderr: testCase.installLog.join("\n"),
					},
					"npm list --all --json": {
						error: null,
						stdout: JSON.stringify(testCase.hierarchy),
						stderr: "",
					},
				});

				const got = await getDeprecatedPackages({ cp, fs, options });
				assert.deepEqual(got, want);
			});
		}

		await t.test("deprecation warnings cannot be obtained", async () => {
			const cp = createCp({
				"npm clean-install": {
					error: true,
					stdout: "",
					stderr: "",
				},
				"npm list --all --json": {
					error: null,
					stdout: "{}",
					stderr: "",
				},
			});
			const fs = createFs({
				"./package.json": "{}",
			});
			const options = defaultOptions;

			await assert.rejects(async () => {
				await getDeprecatedPackages({ cp, fs, options })
			});
		});

		await t.test("dependency hierarchy cannot be obtained", async () => {
			const cp = createCp({
				"npm clean-install": {
					error: null,
					stdout: "",
					stderr: "",
				},
				"npm list --all --json": {
					error: true,
					stdout: "{}",
					stderr: "",
				},
			});
			const fs = createFs({
				"./package.json": "{}",
			});
			const options = defaultOptions;

			await assert.rejects(async () => {
				await getDeprecatedPackages({ cp, fs, options })
			});
		});

		await t.test("aliases cannot be obtained", async () => {
			const cp = createCp({
				"npm clean-install": {
					error: null,
					stdout: "",
					stderr: "",
				},
				"npm list --all --json": {
					error: null,
					stdout: "{}",
					stderr: "",
				},
			});
			const fs = createFs({});
			const options = defaultOptions;

			await assert.rejects(async () => {
				await getDeprecatedPackages({ cp, fs, options })
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
						error,
						Buffer.from(stdout),
						Buffer.from(stderr),
					);

					break;
				}
			}
		}),
		spawn: mock.fn((cmd, args) => {
			for (const [command, result] of Object.entries(commands)) {
				if (`${cmd} ${args.join(" ")}`.includes(command)) {
					const { error, stdout, stderr } = result;

					const outLines = stdout.split("\n");
					const errLines = stderr.split("\n");

					const handlers = {};
					const process = {
						stdout: { on: (_, callback) => { handlers.stdout = callback; } },
						stderr: { on: (_, callback) => { handlers.stderr = callback; } },
						on: (_, callback) => { handlers.close = callback; },
					};

					const id = setInterval(() => {
						if (outLines.length > 0) {
							const line = Buffer.from(outLines.shift());
							handlers.stdout?.(line);
						} else if (errLines.length > 0) {
							const line = Buffer.from(errLines.shift());
							handlers.stderr?.(line);
						} else {
							handlers.close?.(error ? 1 : 0);
							clearTimeout(id);
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
