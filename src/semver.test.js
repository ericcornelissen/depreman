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

import {
	satisfies,
} from "./semver.js";

test("semver.js", async (t) => {
	await t.test("satisfies", async (t) => {
		const goodCases = {
			...{
				"no range: exact match": {
					version: "3.1.4",
					range: "3.1.4",
					want: true,
				},
				"no range: before, patch": {
					version: "3.1.4",
					range: "3.1.5",
					want: false,
				},
				"no range: before, minor": {
					version: "3.0.5",
					range: "3.1.4",
					want: false,
				},
				"no range: before, major": {
					version: "2.7.1",
					range: "3.1.4",
					want: false,
				},
				"no range: after, patch": {
					version: "3.1.5",
					range: "3.1.4",
					want: false,
				},
				"no range: after, minor": {
					version: "3.2.1",
					range: "3.1.4",
					want: false,
				},
				"no range: after, major": {
					version: "4.0.0",
					range: "3.1.4",
					want: false,
				},
			},
			...{
				"= range: exact match": {
					version: "3.1.4",
					range: "=3.1.4",
					want: true,
				},
				"= range: before, patch": {
					version: "3.1.4",
					range: "=3.1.5",
					want: false,
				},
				"= range: before, minor": {
					version: "3.0.5",
					range: "=3.1.4",
					want: false,
				},
				"= range: before, major": {
					version: "2.7.1",
					range: "=3.1.4",
					want: false,
				},
				"= range: after, patch": {
					version: "3.1.5",
					range: "=3.1.4",
					want: false,
				},
				"= range: after, minor": {
					version: "3.2.1",
					range: "=3.1.4",
					want: false,
				},
				"= range: after, major": {
					version: "4.0.0",
					range: "=3.1.4",
					want: false,
				},
			},
			...{
				"> range: earliest match": {
					version: "3.1.4",
					range: ">3.1.4",
					want: false,
				},
				"> range: before, patch": {
					version: "3.1.4",
					range: ">3.1.5",
					want: false,
				},
				"> range: before, minor": {
					version: "3.0.5",
					range: ">3.1.4",
					want: false,
				},
				"> range: before, major": {
					version: "2.7.1",
					range: ">3.1.4",
					want: false,
				},
				"> range: after, patch": {
					version: "3.1.5",
					range: ">3.1.4",
					want: true,
				},
				"> range: after, minor": {
					version: "3.2.1",
					range: ">3.1.4",
					want: true,
				},
				"> range: after, major": {
					version: "4.0.0",
					range: ">3.1.4",
					want: true,
				},
			},
			... {
				">= range: earliest match": {
					version: "3.1.4",
					range: ">=3.1.4",
					want: true,
				},
				">= range: before, patch": {
					version: "3.1.4",
					range: ">=3.1.5",
					want: false,
				},
				">= range: before, minor": {
					version: "3.0.5",
					range: ">=3.1.4",
					want: false,
				},
				">= range: before, major": {
					version: "2.7.1",
					range: ">=3.1.4",
					want: false,
				},
				">= range: after, patch": {
					version: "3.1.5",
					range: ">=3.1.4",
					want: true,
				},
				">= range: after, minor": {
					version: "3.2.1",
					range: ">=3.1.4",
					want: true,
				},
				">= range: after, major": {
					version: "4.0.0",
					range: ">=3.1.4",
					want: true,
				},
			},
			...{
				...{
					"^ range: earliest match": {
						version: "3.1.4",
						range: "^3.1.4",
						want: true,
					},
					"^ range: before, patch": {
						version: "3.1.4",
						range: "^3.1.5",
						want: false,
					},
					"^ range: before, minor": {
						version: "3.0.5",
						range: "^3.1.4",
						want: false,
					},
					"^ range: before, major": {
						version: "2.7.1",
						range: "^3.1.4",
						want: false,
					},
					"^ range: after, patch": {
						version: "3.1.5",
						range: "^3.1.4",
						want: true,
					},
					"^ range: after, minor": {
						version: "3.2.1",
						range: "^3.1.4",
						want: true,
					},
					"^ range: after, major": {
						version: "4.0.0",
						range: "^3.1.4",
						want: false,
					},
				},
				...{
					"^ range: pre-v1, earliest match": {
						version: "0.4.2",
						range: "^0.4.2",
						want: true,
					},
					"^ range: pre-v1, before, patch": {
						version: "0.4.1",
						range: "^0.4.2",
						want: false,
					},
					"^ range: pre-v1, before, minor": {
						version: "0.3.6",
						range: "^0.4.2",
						want: false,
					},
					"^ range: pre-v1, after, patch": {
						version: "0.4.3",
						range: "^0.4.2",
						want: true,
					},
					"^ range: pre-v1, after, minor": {
						version: "0.5.1",
						range: "^0.4.2",
						want: false,
					},
					"^ range: pre-v1, after, major": {
						version: "1.0.0",
						range: "^0.4.2",
						want: false,
					},
				},
			},
			...{
				...{
					"~ range: full version, earliest match": {
						version: "3.1.4",
						range: "~3.1.4",
						want: true,
					},
					"~ range: full version, before, patch": {
						version: "3.1.4",
						range: "~3.1.5",
						want: false,
					},
					"~ range: full version, before, minor": {
						version: "3.0.5",
						range: "~3.1.4",
						want: false,
					},
					"~ range: full version, before, major": {
						version: "2.7.1",
						range: "~3.1.4",
						want: false,
					},
					"~ range: full version, after, patch": {
						version: "3.1.5",
						range: "~3.1.4",
						want: true,
					},
					"~ range: full version, after, minor": {
						version: "3.2.1",
						range: "~3.1.4",
						want: false,
					},
					"~ range: full version, after, major": {
						version: "4.0.0",
						range: "~3.1.4",
						want: false,
					},
				},
				...{
					"~ range: major-minor version, earliest match": {
						version: "3.1.0",
						range: "~3.1",
						want: true,
					},
					"~ range: major-minor version, before, minor": {
						version: "3.0.5",
						range: "~3.1",
						want: false,
					},
					"~ range: major-minor version, before, major": {
						version: "2.7.1",
						range: "~3.1",
						want: false,
					},
					"~ range: major-minor version, after, patch": {
						version: "3.1.5",
						range: "~3.1",
						want: true,
					},
					"~ range: major-minor version, after, minor": {
						version: "3.2.1",
						range: "~3.1",
						want: false,
					},
					"~ range: major-minor version, after, major": {
						version: "4.0.0",
						range: "~3.1",
						want: false,
					},
				},
				...{
					"~ range: major only, earliest match": {
						version: "3.0.0",
						range: "~3",
						want: true,
					},
					"~ range: major only, before, major": {
						version: "2.7.1",
						range: "~3",
						want: false,
					},
					"~ range: major only, after, patch": {
						version: "3.1.5",
						range: "~3",
						want: true,
					},
					"~ range: major only, after, minor": {
						version: "3.2.1",
						range: "~3",
						want: true,
					},
					"~ range: major only, after, major": {
						version: "4.0.0",
						range: "~3",
						want: false,
					},
				},
			},
			...{
				...{
					"x range: major-minor version, earliest match": {
						version: "3.1.0",
						range: "3.1.x",
						want: true,
					},
					"x range: major-minor version, before, minor": {
						version: "3.0.5",
						range: "3.1.x",
						want: false,
					},
					"x range: major-minor version, before, major": {
						version: "2.7.1",
						range: "3.1.x",
						want: false,
					},
					"x range: major-minor version, after, patch": {
						version: "3.1.5",
						range: "3.1.x",
						want: true,
					},
					"x range: major-minor version, after, minor": {
						version: "3.2.1",
						range: "3.1.x",
						want: false,
					},
					"x range: major-minor version, after, major": {
						version: "4.0.0",
						range: "3.1.x",
						want: false,
					},
				},
				...{
					"x range: major version, earliest match": {
						version: "3.0.0",
						range: "3.x.x",
						want: true,
					},
					"x range: major version, before, major": {
						version: "2.7.1",
						range: "3.x.x",
						want: false,
					},
					"x range: major version, after, patch": {
						version: "3.1.5",
						range: "3.x.x",
						want: true,
					},
					"x range: major version, after, minor": {
						version: "3.2.1",
						range: "3.x.x",
						want: true,
					},
					"x range: major version, after, major": {
						version: "4.0.0",
						range: "3.x.x",
						want: false,
					},
				},
				...{
					"x range: anything, earliest match": {
						version: "0.0.0",
						range: "x",
						want: true,
					},
					"x range: anything, pre-v1, patch": {
						version: "0.0.7",
						range: "x",
						want: true,
					},
					"x range: anything, pre-v1, minor": {
						version: "0.4.2",
						range: "x",
						want: true,
					},
					"x range: anything, post-v1": {
						version: "1.2.3",
						range: "x",
						want: true,
					},
				},
			},
		};

		for (const [name, testCase] of Object.entries(goodCases)) {
			await t.test(name, () => {
				const { version, range, want } = testCase;

				const got = satisfies(version, range);
				assert.equal(got.value(), want);
			});
		}

		const badCases = {
			"version is invalid": {
				version: "not a version",
				range: "3.1.4",
				want: "'not a version' is not a valid semver version",
			},
			"range is invalid": {
				version: "3.1.4",
				range: "not a range",
				want: "'not a range' is not a valid semver range",
			},
		};

		for (const [name, testCase] of Object.entries(badCases)) {
			await t.test(name, () => {
				const { version, range, want } = testCase;

				const got = satisfies(version, range);
				assert.ok(got.isErr());
				assert.equal(got.error(), want)
			});
		}
	});
});
