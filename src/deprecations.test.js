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
import { test } from "node:test";

import { Err, Ok } from "./result.js";

import {
	getDeprecatedPackages,
} from "./deprecations.js";

test("deprecations.js", (t) => {
	t.test("getDeprecatedPackages", (t) => {
		const testCases = {
			"no dependencies": {
				deprecations: [],
				hierarchy: {},
				want: [],
			},
			"one deprecated package": {
				deprecations: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "This package is no longer supported.",
					},
				],
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
			"multiple deprecated packages": {
				deprecations: [
					{
						name: "bar",
						version: "2.7.1",
						reason: "This package is no longer supported.",
					},
					{
						name: "baz",
						version: "1.0.0",
						reason: "This package is not supported anymore.",
					},
				],
				hierarchy: {
					dependencies: {
						foo: {
							version: "1.0.0",
							dependencies: {
								bar: {
									version: "2.7.1",
								},
								baz: {
									version: "1.0.0",
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
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "bar", version: "2.7.1" },
							],
						],
					},
					{
						name: "baz",
						version: "1.0.0",
						reason: "This package is not supported anymore.",
						paths: [
							[
								{ name: "foo", version: "1.0.0" },
								{ name: "baz", version: "1.0.0" },
							],
						],
					},
				],
			},
			"deprecated aliased package": {
				aliases: new Map([
					["foo", {
						name: "bar",
						version: "3.1.4",
					}],
					["hello", {
						name: "world",
						version: "2.7.1",
					}],
				]),
				deprecations: [
					{
						name: "bar",
						version: "3.1.4",
						reason: "This package is no longer supported.",
					},
					{
						name: "world",
						version: "2.7.1",
						reason: "This package is not supported anymore.",
					},
				],
				hierarchy: {
					dependencies: {
						foo: {
							version: "3.1.4",
						},
						hello: {
							version: "2.7.1",
						},
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
					{
						name: "world",
						version: "2.7.1",
						reason: "This package is not supported anymore.",
						paths: [
							[
								{ name: "world", version: "2.7.1" },
							],
						],
					},
				],
			},
			"dependency on self": {
				deprecations: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "This package is no longer supported.",
					},
				],
				hierarchy: {
					name: "self",
					version: "1.0.0",
					dependencies: {
						self: {
							version: "1.0.0",
							dependencies: {
								foobar: {
									version: "3.1.4",
								},
							},
						},
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
		};

		for (const [name, testCase] of Object.entries(testCases)) {
			t.test(name, async () => {
				const { want } = testCase;

				const pm = new PM({
					aliases: new Ok(testCase.aliases || new Map()),
					deprecations: new Ok(testCase.deprecations),
					hierarchy: new Ok(testCase.hierarchy),
				})
				const got = await getDeprecatedPackages(pm);
				assert.deepEqual(got, want);
			});
		}

		t.test("deprecation warnings cannot be obtained", async () => {
			const err = "deprecations error";

			const pm = new PM({
				aliases: new Ok(),
				deprecations: new Err(err),
				hierarchy: new Ok(),
			});

			await assert.rejects(
				() => getDeprecatedPackages(pm),
				(error) => {
					assert.ok(error instanceof Error);
					assert.equal(error.message, err);

					return true;
				},
			);
		});

		t.test("dependency hierarchy cannot be obtained", async () => {
			const err = "hierarchy error";

			const pm = new PM({
				aliases: new Ok(),
				deprecations: new Ok(),
				hierarchy: new Err(err),
			});

			await assert.rejects(
				() => getDeprecatedPackages(pm),
				(error) => {
					assert.ok(error instanceof Error);
					assert.equal(error.message, err);

					return true;
				},
			);
		});

		t.test("aliases cannot be obtained", async () => {
			const err = "alias error";

			const pm = new PM({
				aliases: new Err(err),
				deprecations: new Ok(),
				hierarchy: new Ok(),
			});

			await assert.rejects(
				() => getDeprecatedPackages(pm),
				(error) => {
					assert.ok(error instanceof Error);
					assert.equal(error.message, err);

					return true;
				},
			);
		});
	});
});

class PM {
	/**
	 * @param {Object} p
	 * @param {import("./npm.js").Aliases} p.aliases
	 * @param {import("./npm.js").DeprecatedPackage} p.deprecations
	 * @param {import("./npm.js").PackageHierarchy} p.hierarchy
	 */
	constructor({ aliases, deprecations, hierarchy }) {
		this.aliases = () => aliases;
		this.deprecations = () => deprecations;
		this.hierarchy = () => hierarchy;
	}
}
