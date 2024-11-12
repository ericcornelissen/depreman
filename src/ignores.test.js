// Copyright (C) 2024  Eric Cornelissen
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
} from "./ignores.js";

test("ignore.js", async (t) => {
	await t.test("removeIgnored", async (t) => {
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
						"#expire": (() => {
							const date = new Date();
							const year = date.getFullYear();
							const month = date.getMonth() + 1;
							const day = date.getDate();
							return `${year - 1}-${month}-${day}`;
						})(),
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
						"#expire": (() => {
							const date = new Date();
							const year = date.getFullYear();
							const month = date.getMonth() + 1;
							const day = date.getDate();
							return `${year + 1}-${month}-${day}`;
						})(),
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
		};

		for (const [name, testCase] of Object.entries(goodTestCases)) {
			const { config, deprecations, want } = testCase;
			await t.test(name, () => {
				const got = removeIgnored(config, deprecations);
				assert.deepEqual(got, want);
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
				want: /^Error: invalid rule name 'package'$/,
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
				want: /^Error: invalid rule name '3.1.4'$/,
			},
			"invalid '#ignore' value, empty string": {
				config: {
					"package@1.0.0": {
						"#ignore": "",
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
				want: /^Error: cannot use empty string for '#ignore', use 'true' instead$/,
			},
			"invalid '#ignore' value, array": {
				config: {
					"package@3.1.4": {
						"#ignore": [],
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
				want: /^Error: invalid '#ignore' value/,
			},
			"invalid '#ignore' value, object": {
				config: {
					"package@3.1.4": {
						"#ignore": {},
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
				want: /^Error: invalid '#ignore' value/,
			},
		};

		for (const [name, testCase] of Object.entries(badTestCases)) {
			const { config, deprecations, want } = testCase;
			await t.test(name, () => {
				assert.throws(
					() => {
						removeIgnored(config, deprecations);
					},
					want,
				);
			});
		}
	});
});
