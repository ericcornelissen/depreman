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

import {
	removeIgnored,
	unusedIgnores,
} from "./ignores.js";

test("ignore.js", (t) => {
	t.test("removeIgnored", (t) => {
		const goodTestCases = {
			"ignore a direct dependency": {
				config: {
					"package@1.0.0": {
						"#ignore": "Hello world!",
					},
				},
				deprecations: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "package", version: "1.0.0" },
								],
								reason: "Hello world!",
							},
						],
						kept: [],
					},
				],
			},
			"ignore a transitive dependency": {
				config: {
					"foo@1.0.0": {
						"bar@2.0.0": {
							"#ignore": "Hello world!",
						}
					},
				},
				deprecations: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
							],
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
								],
							},
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "Hello world!",
							},
						],
						kept: [],
					},
				],
			},
			"ignore a direct but not a transitive dependency": {
				config: {
					"foo@1.0.0": {
						"#ignore": "Hello world!",
						"bar@2.0.0": {}
					},
				},
				deprecations: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
							],
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
								],
								reason: "Hello world!",
							},
						],
						kept: [],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
							},
						],
					},
				],
			},
			"ignore one out of two deprecation warnings": {
				config: {
					"foo@^1.0.0": {
						"#ignore": "bar",
					},
				},
				deprecations: [
					{
						name: "foo",
						version: "1.0.1",
						reason: "foobaz",
						paths: [
							[
								{ name: "foo", version: "1.0.1" },
							],
						],
					},
					{
						name: "hello",
						version: "1.2.3",
						reason: "world",
						paths: [
							[
								{ name: "foo", version: "1.0.1" },
								{ name: "hello", version: "1.2.3" },
							],
						],
					},
				],
				want: [
					{
						name: "foo",
						version: "1.0.1",
						reason: "foobaz",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.1" },
								],
								reason: "bar",
							},
						],
						kept: [],
					},
					{
						name: "hello",
						version: "1.2.3",
						reason: "world",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "foo", version: "1.0.1" },
									{ name: "hello", version: "1.2.3" },
								],
							},
						],
					},
				],
			},
			"ignore a transitive dependency using `*` (matching 1)": {
				config: {
					"foo@1.0.0": {
						"*": {
							"bar@2.0.0": {
								"#ignore": "ignored with `*` wildcard",
							},
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "some-package", version: "3.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "some-package", version: "3.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored with `*` wildcard",
							},
						],
						kept: [],
					},
				],
			},
			"ignore a transitive dependency using `*` (matching 0)": {
				config: {
					"foo@1.0.0": {
						"*": {
							"bar@2.0.0": {
								"#ignore": "ignored with `*` wildcard",
							},
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored with `*` wildcard",
							},
						],
						kept: [],
					},
				],
			},
			"ignore a transitive dependency using `+` (matching 1)": {
				config: {
					"foo@1.0.0": {
						"+": {
							"bar@2.0.0": {
								"#ignore": "ignored with `+` wildcard",
							},
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "some-package", version: "3.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "some-package", version: "3.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored with `+` wildcard",
							},
						],
						kept: [],
					},
				],
			},
			"ignore a transitive dependency using `+` (not matching 0)": {
				config: {
					"foo@1.0.0": {
						"+": {
							"bar@2.0.0": {
								"#ignore": "ignored with `+` wildcard",
							},
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
							},
						],
					},
				],
			},
			"ignore with the `*` wildcard under a direct dependency": {
				config: {
					"foo@1.0.0": {
						"*": {
							"#ignore": "ignored with `+` wildcard",
						},
					},
				},
				deprecations: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
							],
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
								],
								reason: "ignored with `+` wildcard",
							},
						],
						kept: [],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored with `+` wildcard",
							},
						],
						kept: [],
					},
				],
			},
			"ignore with the `+` wildcard under a direct dependency": {
				config: {
					"foo@1.0.0": {
						"+": {
							"#ignore": "ignored with `+` wildcard",
						},
					},
				},
				deprecations: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
							],
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
								],
							},
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored with `+` wildcard",
							},
						],
						kept: [],
					},
				],
			},
			"ignore with `#expire` that did expired": {
				config: {
					"package@1.0.0": {
						"#ignore": "expired",
						"#expire": lastYear(),
					},
				},
				deprecations: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "package", version: "1.0.0" },
								],
							},
						],
					},
				],
			},
			"ignore with `#expire` that has not expired": {
				config: {
					"package@1.0.0": {
						"#ignore": "not expired",
						"#expire": nextYear(),
					},
				},
				deprecations: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "package", version: "1.0.0" },
								],
								reason: "not expired",
							},
						],
						kept: [],
					},
				],
			},
			"ignore with `#expire` under `*` wildcard": {
				config: {
					"package@1.0.0": {
						"*": {
							"#ignore": "expired",
							"#expire": lastYear(),
						},
					},
				},
				deprecations: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "package", version: "1.0.0" },
								],
							},
						],
					},
				],
			},
			"ignore directive after `*` wildcard matches": {
				config: {
					"foo@1.0.0": {
						"*": {
							"baz@3.0.0": {
								"#ignore": "ignored with `*` wildcard",
							}
						},
						"bar@2.0.0": {
							"#ignore": "ignored without wildcard",
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored without wildcard",
							},
						],
						kept: [],
					},
				],
			},
			"ignore directive after `+` wildcard matches": {
				config: {
					"foo@1.0.0": {
						"+": {
							"baz@3.0.0": {
								"#ignore": "ignored with `+` wildcard",
							}
						},
						"bar@2.0.0": {
							"#ignore": "ignored without wildcard",
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored without wildcard",
							},
						],
						kept: [],
					},
				],
			},
			"ignore all transitive dependencies": {
				config: {
					"+": {
						"+": {
							"#ignore": "ignored transitive dependencies",
						},
					},
				},
				deprecations: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
							],
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
								],
							},
						],
					},
					{
						name: "bar",
						version: "2.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
									{ name: "bar", version: "2.0.0" },
								],
								reason: "ignored transitive dependencies",
							},
						],
						kept: [],
					},
				],
			},
			"ignore with boolean true": {
				config: {
					"package@1.0.0": {
						"#ignore": true,
					},
				},
				deprecations: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						ignored: [
							{
								path: [
									{ name: "package", version: "1.0.0" },
								],
								reason: null,
							},
						],
						kept: [],
					},
				],
			},
			"ignore with boolean false": {
				config: {
					"package@1.0.0": {
						"#ignore": false,
					},
				},
				deprecations: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "package", version: "1.0.0" },
								],
							},
						],
					},
				],
			},
			"ignore with scope, deprecation in scope": {
				config: {
					"*": {
						"bar@2.0.0": {
							"#ignore": "Goodbye world?",
							"#scope": ["dev"]
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "Hello world!",
						paths: [
							[
								{
									name: "foo",
									version: "1.0.0",
									scope: "dev",
								},
								{
									name: "bar",
									version: "2.0.0",
									scope: "dev",
								},
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "Hello world!",
						ignored: [
							{
								path: [
									{
										name: "foo",
										version: "1.0.0",
										scope: "dev",
									},
									{
										name: "bar",
										version: "2.0.0",
										scope: "dev",
									},
								],
								reason: "Goodbye world?",
							},
						],
						kept: [],
					},
				],
			},
			"ignore with scope, deprecation out of scope": {
				config: {
					"*": {
						"bar@2.0.0": {
							"#ignore": "Goodbye world?",
							"#scope": ["dev"]
						},
					},
				},
				deprecations: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "Hello world!",
						paths: [
							[
								{
									name: "foo",
									version: "1.0.0",
									scope: "prod",
								},
								{
									name: "bar",
									version: "2.0.0",
									scope: "prod",
								},
							],
						],
					},
				],
				want: [
					{
						name: "bar",
						version: "2.0.0",
						reason: "Hello world!",
						ignored: [],
						kept: [
							{
								path: [
									{
										name: "foo",
										version: "1.0.0",
										scope: "prod",
									},
									{
										name: "bar",
										version: "2.0.0",
										scope: "prod",
									},
								],
							},
						],
					},
				],
			},
			"ignore with scope under `*` wildcard": {
				config: {
					"foobar@^3.0.0": {
						"*": {
							"#ignore": "Goodbye world?",
							"#scope": ["peer"]
						},
					},
				},
				deprecations: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "Hello world!",
						paths: [
							[
								{
									name: "foobar",
									version: "3.1.4",
									scope: "prod",
								},
							],
						],
					},
				],
				want: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "Hello world!",
						ignored: [],
						kept: [
							{
								path: [
									{
										name: "foobar",
										version: "3.1.4",
										scope: "prod",
									},
								],
							},
						],
					},
				],
			},
			"name mismatch": {
				config: {
					"foobaz@1.0.0": {
						"#ignore": true,
					},
				},
				deprecations: [
					{
						name: "foobar",
						version: "1.0.0",
						reason: "Hello world!",
						paths: [
							[
								{ name: "foobar", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "foobar",
						version: "1.0.0",
						reason: "Hello world!",
						ignored: [],
						kept: [
							{
								path: [
									{ name: "foobar", version: "1.0.0" },
								],
							},
						],
					},
				],
			},
			"contradicting ignore directives": {
				config: {
					"bar@3.0.0": {
						"foo@1.0.0": {
							"#ignore": false,
						},
					},
					"*": {
						"foo@1.0.0": {
							"#ignore": true,
						},
					},
				},
				deprecations: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "Hello world!",
						paths: [
							[
								{ name: "bar", version: "3.0.0" },
								{ name: "foo", version: "1.0.0" },
							],
							[
								{ name: "baz", version: "4.0.0" },
								{ name: "foo", version: "1.0.0" },
							],
						],
					},
				],
				want: [
					{
						name: "foo",
						version: "1.0.0",
						reason: "Hello world!",
						ignored: [
							{
								path: [
									{ name: "bar", version: "3.0.0" },
									{ name: "foo", version: "1.0.0" },
								],
								reason: null,
							},
							{
								path: [
									{ name: "baz", version: "4.0.0" },
									{ name: "foo", version: "1.0.0" },
								],
								reason: null,
							},
						],
						kept: [],
					},
				],
			},
		};

		for (const [name, testCase] of Object.entries(goodTestCases)) {
			const { config, deprecations, want } = testCase;
			t.test(name, () => {
				const got = removeIgnored(config, deprecations);
				assert.deepEqual(got, want);
			});

			t.test(`${name} - mark used directives`, () => {
				const kUsed = Symbol.for("#used");

				removeIgnored(config, deprecations);

				const values = Object.values(config);
				while (values.length > 0) {
					const value = values.pop();
					assert.ok(value[kUsed] === true || !Object.hasOwn(value, kUsed));

					values.push(
						...Object.entries(value)
							.filter(e => !e[0].startsWith("#"))
							.map(e => e[1]),
					);
				}
			});
		}

		const badTestCases = {
			"invalid rule identifier, no version": {
				config: {
					"package": {
						"#ignore": "Hello world!",
					},
				},
				deprecations: [
					{
						name: "package",
						version: "1.0.0",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "1.0.0" },
							],
						],
					},
				],
				want: /^Error: invalid rule name 'package'$/u,
			},
			"invalid rule identifier, no package name": {
				config: {
					"3.1.4": {
						"#ignore": "Hello world!",
					},
				},
				deprecations: [
					{
						name: "package",
						version: "3.1.4",
						reason: "foobar",
						paths: [
							[
								{ name: "package", version: "3.1.4" },
							],
						],
					},
				],
				want: /^Error: invalid rule name '3.1.4'$/u,
			},
		};

		for (const [name, testCase] of Object.entries(badTestCases)) {
			const { config, deprecations, want } = testCase;
			t.test(name, () => {
				assert.throws(
					() => {
						removeIgnored(config, deprecations);
					},
					want,
				);
			});
		}
	});

	t.test("unusedIgnores", (t) => {
		const kUsed = Symbol.for("#used");

		const testCases = {
			"used ignore directive in a direct dependency": {
				config: {
					"package@1.0.0": {
						"#ignore": "Hello world!",
						[kUsed]: true,
					},
				},
				want: [],
			},
			"used ignore directive in a transitive dependency": {
				config: {
					"foo@1.0.0": {
						"bar@2.0.0": {
							"#ignore": "Hello world!",
							[kUsed]: true,
						},
					},
				},
				want: [],
			},
			"unused ignore directive in a direct dependency": {
				config: {
					"package@1.0.0": {
						"#ignore": "Hello world!",
					},
				},
				want: [
					["package@1.0.0"],
				],
			},
			"unused ignore directive in a transitive dependency": {
				config: {
					"foo@1.0.0": {
						"bar@2.0.0": {
							"#ignore": "Hello world!",
						},
					},
				},
				want: [
					["foo@1.0.0", "bar@2.0.0"],
				],
			},
			"1 used and 1 unused ignore directive": {
				config: {
					"foo@1.0.0": {
						"#ignore": "Hello world!",
						[kUsed]: true,
					},
					"bar@2.0.0": {
						"#ignore": "Hola mundo!",
					},
				},
				want: [
					["bar@2.0.0"],
				],
			},
		};

		for (const [name, testCase] of Object.entries(testCases)) {
			const { config, want } = testCase;
			t.test(name, () => {
				const got = unusedIgnores(config);
				assert.deepEqual(got, want);
			});
		}
	});
});

/**
 * @returns {string}
 */
function lastYear() {
	const date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${year - 1}-${month}-${day}`;
}

/**
 * @returns {string}
 */
function nextYear() {
	const date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${year + 1}-${month}-${day}`;
}
