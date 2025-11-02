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
import { test } from "node:test";

import { FS } from "./fs.mock.js";

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
			"config with scope, one": {
				config: {
					"package@1.0.0": {
						"#ignore": "if production",
						"#scope": ["prod"],
					},
				},
			},
			"config with scope, multiple": {
				config: {
					"package@1.0.0": {
						"#ignore": "if not production",
						"#scope": ["dev", "optional", "peer"],
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
				const fs = new FS({
					"./.ndmrc": JSON.stringify(testCase.config),
				});

				const got = await getConfiguration(fs);
				assert.ok(got.isOk());

				const want = testCase.config;
				assert.deepEqual(got.value(), want);
			});
		}

		const errCases = {
			"rule without a version": {
				config: {
					"package-without-version": {
						"#ignore": true
					},
				},
				message: "invalid rule name 'package-without-version'",
			},
			"rule without a version, scoped package": {
				config: {
					"@scoped/dependency-without-version": {
						"#ignore": true
					},
				},
				message: "invalid rule name '@scoped/dependency-without-version'",
			},
			"rule with empty version": {
				config: {
					"package-with-missing-version@": {
						"#ignore": true
					},
				},
				message: "missing version for 'package-with-missing-version'",
			},
			"rule with empty version, scoped package": {
				config: {
					"@scoped/package-with-missing-version@": {
						"#ignore": true
					},
				},
				message: "missing version for '@scoped/package-with-missing-version'",
			},
			"nested rule without a version": {
				config: {
					"package-with-version@1.0.0": {
						"package-without-version": {
							"#ignore": true
						},
					},
				},
				message: "package-with-version@1.0.0: invalid rule name 'package-without-version'",
			},
			"directive in the root": {
				config: {
					"#ignore": true,
				},
				message: "unexpected directive '#ignore' in the root",
			},
			"unknown directives": {
				config: {
					"package@1.0.0": {
						"#ignore": true,
						"#foo": true,
						"#bar": false,
					},
				},
				message: "package@1.0.0: unknown directive '#foo'\n"
					+ "package@1.0.0: unknown directive '#bar'",
			},
			"incorrect type for '#ignore', number": {
				config: {
					"foo@3.0.0": {
						"bar@1.4.0": {
							"#ignore": 42,
						},
					},
				},
				message: "foo@3.0.0: bar@1.4.0: unexpected type for '#ignore': number",
			},
			"incorrect type for '#ignore', array": {
				config: {
					"foo@3.0.0": {
						"bar@1.4.0": {
							"#ignore": [3, 14],
						},
					},
				},
				message: "foo@3.0.0: bar@1.4.0: unexpected type for '#ignore': array",
			},
			"incorrect type for '#ignore', object": {
				config: {
					"foo@3.0.0": {
						"bar@1.4.0": {
							"#ignore": {},
						},
					},
				},
				message: "foo@3.0.0: bar@1.4.0: unexpected type for '#ignore': object",
			},
			"incorrect value for '#ignore', empty string": {
				config: {
					"foobar@3.1.4": {
						"#ignore": "",
					},
				},
				message: "foobar@3.1.4: cannot use empty string for '#ignore'",
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
			"incorrect type for '#scope'": {
				config: {
					"foobar@3.1.4": {
						"#ignore": true,
						"#scope": "not an array",
					},
				},
				message: "foobar@3.1.4: unexpected type for '#scope': string",
			},
			"empty '#scope' list": {
				config: {
					"foobar@3.1.4": {
						"#ignore": true,
						"#scope": [],
					},
				},
				message: "foobar@3.1.4: the '#scope' directive may not be empty",
			},
			"invalid '#scope' entry": {
				config: {
					"foobar@3.1.4": {
						"#ignore": true,
						"#scope": ["prod", "not a scope"],
					},
				},
				message: "foobar@3.1.4: unexpected '#scope' entry: not a scope",
			},
			"incorrect '#scope' entry type": {
				config: {
					"foobar@3.1.4": {
						"#ignore": true,
						"#scope": ["dev", false],
					},
				},
				message: "foobar@3.1.4: unexpected '#scope' entry: false",
			},
			"a leaf without '#ignore'": {
				config: {
					"foo@0.4.2": {
						"bar@3.1.4": {},
					},
				},
				message: "foo@0.4.2: bar@3.1.4: ineffective leaf (no '#ignore' found)",
			},
			"an '#expire' directive without '#ignore'": {
				config: {
					"foo@0.4.2": {
						"bar@3.1.4": {
							"#ignore": true,
						},
						"#expire": "2025-04-19",
					},
				},
				message: "foo@0.4.2: has '#expire' without '#ignore'",
			},
			"a leaf with only '#expire'": {
				config: {
					"answer@0.4.2": {
						"#expire": "2025-04-19",
					},
				},
				message: "answer@0.4.2: ineffective leaf (no '#ignore' found)\n"
					+ "answer@0.4.2: has '#expire' without '#ignore'",
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
				const fs = new FS({
					"./.ndmrc": JSON.stringify(testCase.config),
				});

				const got = await getConfiguration(fs);
				assert.ok(got.isErr());
				assert.equal(got.error(), testCase.message);
			});
		}

		t.test("usage of fs.readFile", async () => {
			const fs = new FS({
				"./.ndmrc": JSON.stringify({}),
			});

			await getConfiguration(fs);
			assert.equal(fs.readFile.mock.callCount(), 1);

			const got = fs.readFile.mock.calls[0];
			assert.ok(got.arguments.length > 0);
			assert.match(got.arguments[0], /.ndmrc$/u);
		});

		t.test("config not in JSON format", async () => {
			const fs = new FS({
				"./.ndmrc": "I'm not valid JSON",
			});

			const got = await getConfiguration(fs);
			assert.ok(got.isErr());
			assert.match(
				got.error(),
				/^Configuration file invalid \(.+?\)$/u,
			);
		});

		t.test("file not found", async () => {
			const fs = new FS({});

			const got = await getConfiguration(fs);
			assert.ok(got.isErr());
			assert.equal(
				got.error(),
				"could not get .ndmrc: file not found",
			);
		});
	});
});
