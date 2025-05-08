// Copyright (C) 2024-2025  Eric Cornelissen
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
	getConfiguration,
} from "./config.js";

test("config.js", (t) => {
	t.test("getConfiguration", (t) => {
		const okCases = {
			"empty config": {
				config: {},
			},
			"config with ignore (boolean)": {
				config: {
					"package@1.0.0": {
						"#ignore": true,
					},
				},
			},
			"config with ignore (string)": {
				config: {
					"package@1.0.0": {
						"#ignore": "we are working on upgrading package@1.0.0",
					},
				},
			},
			"config with expire": {
				config: {
					"package@1.0.0": {
						"#ignore": "until 2025-01-01",
						"#expire": "2025-01-01",
					},
				},
			},
			"config with '*' wildcard": {
				config: {
					"package@1.0.0": {
						"*": {
							"#ignore": "we are working on upgrading package@1.0.0",
						}
					},
				},
			},
			"config with '+' wildcard": {
				config: {
					"package@1.0.0": {
						"+": {
							"#ignore": "we are working on upgrading package@1.0.0",
						}
					},
				},
			},
		};

		for (const [name, testCase] of Object.entries(okCases)) {
			t.test(name, async () => {
				const fs = createFs({ "./.ndmrc": JSON.stringify(testCase.config) });

				const got = await getConfiguration(fs);
				const want = testCase.config;
				assert.deepEqual(got, want);
			});
		}

		const errCases = {
			"directive in the root": {
				config: {
					"#ignore": true,
				},
				message: "unexpected directive '#ignore' in the root",
			},
			"unknown directives": {
				config: {
					"package@1.0.0": {
						"#foo": true,
						"#bar": false,
					},
				},
				message: "package@1.0.0: unknown directive '#foo'\n"
					+ "package@1.0.0: unknown directive '#bar'",
			},
			"incorrect type for '#ignore'": {
				config: {
					"foo@3.0.0": {
						"bar@1.4.0": {
							"#ignore": [3, 14],
						},
					},
				},
				message: "foo@3.0.0: bar@1.4.0: unexpected type for '#ignore': array",
			},
			"incorrect type for '#expire'": {
				config: {
					"foobar@3.1.4": {
						"#ignore": true,
						"#expire": false,
					},
				},
				message: "foobar@3.1.4: unexpected type for '#expire': boolean",
			},
			"an '#expire' directive without '#ignore'": {
				config: {
					"answer@0.4.2": {
						"#expire": '2025-04-19',
					},
				},
				message: "answer@0.4.2: has '#expire' without '#ignore'",
			},
			"correct followed by incorrect config": {
				config: {
					"foo@3.1.4": {
						"#ignore": true,
					},
					"bar@0.4.2": {
						"#ignore": null,
					},
				},
				message: "bar@0.4.2: unexpected type for '#ignore': null",
			},
			"incorrect config type (primitive)": {
				config: 42,
				message: "config must be an object",
			},
			"incorrect config type (array)": {
				config: [],
				message: "config must be an object",
			},
			"incorrect config type (null)": {
				config: null,
				message: "config must be an object",
			},
			"incorrect nested config type": {
				config: {
					"wrong@1.0.0": null,
				},
				message: "wrong@1.0.0: config must be an object",
			},
		};

		for (const [name, testCase] of Object.entries(errCases)) {
			t.test(name, async () => {
				const fs = createFs({ "./.ndmrc": JSON.stringify(testCase.config) });

				await assert.rejects(
					async () => await getConfiguration(fs),
					(error) => {
						assert.ok(error instanceof Error);
						assert.equal(error.message, testCase.message);

						return true;
					},
				)
			});
		}

		t.test("usage of fs.readFile", async () => {
			const fs = createFs({ "./.ndmrc": JSON.stringify({}) });

			await getConfiguration(fs);
			assert.equal(fs.readFile.mock.callCount(), 1);

			const got = fs.readFile.mock.calls[0];
			assert.ok(got.arguments.length > 0);
			assert.match(got.arguments[0], /.ndmrc$/u);
		});

		t.test("config not in JSON format", async () => {
			const fs = createFs({ "./.ndmrc": "I'm not valid JSON" });

			await assert.rejects(
				() => getConfiguration(fs),
				(error) => {
					assert.ok(error instanceof Error);
					assert.match(
						error.message,
						/^Configuration file invalid \(.+?\)$/u,
					);

					return true;
				},
			);
		});

		t.test("file not found", async () => {
			const fs = createFs({});

			await assert.rejects(
				() => getConfiguration(fs),
				(error) => {
					assert.ok(error instanceof Error);
					assert.equal(
						error.message,
						"Configuration file .ndmrc not found",
					);

					return true;
				},
			);
		});
	});

	t.test("createFs", (t) => {
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

/** @typedef {import("./config.js").FileSystem} FileSystem */
