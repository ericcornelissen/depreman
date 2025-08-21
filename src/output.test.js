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
	printAndExit,
} from "./output.js";

test("output.js", (t) => {
	t.test("printAndExit", (t) => {
		const styler = MockStyler;

		const testCases = {
			"no deprecations": {
				options: {
					everything: false,
				},
				results: [],
				unused: [],
				want: {
					ok: true,
					report: ``,
				}
			},
			"one deprecation which is ignored": {
				options: {
					everything: false,
				},
				results: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [],
						ignored: [
							{
								path: [{ name: "foobar", version: "3.1.4" }],
								reason: "okay for now",
							}
						],
					}
				],
				unused: [],
				want: {
					ok: true,
					report: ``,
				}
			},
			"one deprecation which is ignored without a reason": {
				options: {
					everything: false,
				},
				results: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [],
						ignored: [
							{
								path: [{ name: "foobar", version: "3.1.4" }],
								reason: true,
							}
						],
					}
				],
				unused: [],
				want: {
					ok: true,
					report: ``,
				}
			},
			"one deprecation which is ignored, everything": {
				options: {
					everything: true,
				},
				results: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [],
						ignored: [
							{
								path: [{ name: "foobar", version: "3.1.4" }],
								reason: "okay for now",
							}
						],
					},
				],
				unused: [],
				want: {
					ok: true,
					report: `${styler.dim(`foobar@3.1.4 *("no longer maintained")*:`)}
	${styler.dim(`. > foobar@3.1.4`)}
		${styler.dim(`(allowed "okay for now")`)}`,
				}
			},
			"one deprecation which is ignored without a reason, everything": {
				options: {
					everything: true,
				},
				results: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [],
						ignored: [
							{
								path: [{ name: "foobar", version: "3.1.4" }],
								reason: true,
							},
						],
					},
				],
				unused: [],
				want: {
					ok: true,
					report: `${styler.dim(`foobar@3.1.4 *("no longer maintained")*:`)}
	${styler.dim(`. > foobar@3.1.4`)}
		${styler.dim(`(allowed "no reason given")`)}`,
				}
			},
			"one transitive deprecation which is ignored, everything": {
				options: {
					everything: true,
				},
				results: [
					{
						name: "bar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [],
						ignored: [
							{
								path: [
									{ name: "foo", version: "2.7.1" },
									{ name: "bar", version: "3.1.4" },
								],
								reason: true,
							}
						],
					},
				],
				unused: [],
				want: {
					ok: true,
					report: `${styler.dim(`bar@3.1.4 *("no longer maintained")*:`)}
	${styler.dim(`. > foo@2.7.1 > bar@3.1.4`)}
		${styler.dim(`(allowed "no reason given")`)}`,
				}
			},
			"one deprecation which is not ignored": {
				options: {
					everything: false,
				},
				results: [
					{
						name: "foobar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [
							{ path: [{ name: "foobar", version: "3.1.4" }] },
						],
						ignored: [],
					}
				],
				unused: [],
				want: {
					ok: false,
					report: `foobar@3.1.4 ${styler.italic(`("no longer maintained")`)}:
	. > foobar@3.1.4`,
				}
			},
			"one transitive deprecation which is not ignored": {
				options: {
					everything: false,
				},
				results: [
					{
						name: "bar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [
							{
								path: [
									{ name: "foo", version: "2.7.1" },
									{ name: "bar", version: "3.1.4" },
								],
							},
						],
						ignored: [],
					}
				],
				unused: [],
				want: {
					ok: false,
					report: `bar@3.1.4 ${styler.italic(`("no longer maintained")`)}:
	. > foo@2.7.1 > bar@3.1.4`,
				}
			},
			"two deprecation which are not ignored (in order)": {
				options: {
					everything: false,
				},
				results: [
					{
						name: "bar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [
							{ path: [{ name: "bar", version: "3.1.4" }] }
						],
						ignored: [],
					},
					{
						name: "foo",
						version: "2.7.1",
						reason: "not maintained anymore",
						kept: [
							{ path: [{ name: "foo", version: "2.7.1" }] }
						],
						ignored: [],
					},
				],
				unused: [],
				want: {
					ok: false,
					report: `bar@3.1.4 ${styler.italic(`("no longer maintained")`)}:
	. > bar@3.1.4
foo@2.7.1 ${styler.italic(`("not maintained anymore")`)}:
	. > foo@2.7.1`,
				}
			},
			"two deprecation which are not ignored (out of order)": {
				options: {
					everything: false,
				},
				results: [
					{
						name: "foo",
						version: "2.7.1",
						reason: "not maintained anymore",
						kept: [
							{ path: [{ name: "foo", version: "2.7.1" }] }
						],
						ignored: [],
					},
					{
						name: "bar",
						version: "3.1.4",
						reason: "no longer maintained",
						kept: [
							{ path: [{ name: "bar", version: "3.1.4" }] }
						],
						ignored: [],
					},
				],
				unused: [],
				want: {
					ok: false,
					report: `bar@3.1.4 ${styler.italic(`("no longer maintained")`)}:
	. > bar@3.1.4
foo@2.7.1 ${styler.italic(`("not maintained anymore")`)}:
	. > foo@2.7.1`,
				}
			},
			"one unused ignore": {
				options: {
					everything: false,
				},
				results: [],
				unused: [
					["foo@3.1.4", "bar@2.7.1"],
				],
				want: {
					ok: false,
					report: `Unused ignore directives(s):
	. > foo@3.1.4 > bar@2.7.1`,
				}
			},
		};

		for (const [name, testCase] of Object.entries(testCases)) {
			const { options, results, unused, want } = testCase;
			t.test(name, () => {
				const got = printAndExit(results, unused, options, styler);
				assert.equal(got.ok, want.ok);
				assert.equal(got.report, want.report);
			});
		}
	});
});

const MockStyler = {
	dim(value) {
		return `/${value}\\`;
	},
	italic(value) {
		return `*${value}*`;
	}
}
