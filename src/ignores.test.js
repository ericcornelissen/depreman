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
		const goodTestCases = [
			{
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
			{
				config: {
					"foo@1.0.0": {
						"bar@2.0.0": {
							"#ignore": true
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
								reason: null,
							},
						],
						kept: [],
					},
				],
			},
			{
				config: {
					"foo@1.0.0": {
						"#ignore": true,
						"bar@2.0.0": {
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
						ignored: [
							{
								path: [
									{ name: "foo", version: "1.0.0" },
								],
								reason: null,
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
			{
				config: {
					"foo@1.0.0": {
						"*": {
							"bar@2.0.0": {
								"#ignore": "ignored with wildcard",
							}
						}
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
								reason: "ignored with wildcard",
							},
						],
						kept: [],
					},
				],
			},
			{
				config: {
					"package@1.0.0": {
						"#ignore": "expired",
						"#expire": "2024-01-01",
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
			{
				config: {
					"package@1.0.0": {
						"#ignore": "not expired",
						"#expire": (() => {
							const date = new Date();
							const year = date.getFullYear();
							const month = date.getMonth() + 1;
							const day = date.getDate();
							return `${year}-${month}-${day + 1}`;
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
			{
				config: {
					"foo@1.0.0": {
						"*": {
							"baz@3.0.0": {
								"#ignore": "ignored with wildcard",
							}
						},
						"bar@2.0.0": {
							"#ignore": "ignored with wildcard",
						}
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
								reason: "ignored with wildcard",
							},
						],
						kept: [],
					},
				],
			},
		];

		for (const i in goodTestCases) {
			const { config, deprecations, want } = goodTestCases[i]
			await t.test(`${i}`, () => {
				const got = removeIgnored(config, deprecations);
				assert.deepEqual(got, want);
			});
		}

		const badTestCases = [
			{
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
		];

		for (const i in badTestCases) {
			const { config, deprecations, want } = badTestCases[i]
			await t.test(`${i}`, () => {
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
