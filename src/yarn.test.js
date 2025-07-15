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

import { CP } from "./cp.mock.js";

import { Yarn } from "./yarn.js";

test("yarn.js", (t) => {
	t.test("aliases", (t) => {
		t.test("not implemented", async () => {
			const cp = new CP({});

			const yarn = new Yarn({ cp });
			const got = await yarn.aliases();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.size, 0);
		});
	});

	t.test("deprecations", (t) => {
		t.test("no audit warnings", async () => {
			const cp = new CP({
				"yarn npm audit": {
					error: false,
				},
			});

			const yarn = new Yarn({ cp });
			const got = await yarn.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.length, 0);
		});

		t.test("no deprecation warnings", async () => {
			const cp = new CP({
				"yarn npm audit": {
					error: true,
					stdout: JSON.stringify({
						children: {
							ID: "not a deprecation warning",
						}
					}),
				},
			});

			const yarn = new Yarn({ cp });
			const got = await yarn.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.length, 0);
		});

		t.test("a deprecation warning", async () => {
			const name = "foobar";
			const version = "3.1.4";
			const reason = "This package is no longer supported.";

			const cp = new CP({
				"yarn npm audit": {
					error: true,
					stdout: `${JSON.stringify({
						value: name,
						children: {
							ID: `${name} (deprecation)`,
							Issue: reason,
							"Tree Versions": [version],
						}
					})}\n`,
				},
			});

			const yarn = new Yarn({ cp });
			const got = await yarn.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.length, 1);
			assert.deepEqual(value[0], { name, version, reason });
		});

		t.test("corrupt output", async () => {
			const cp = new CP({
				"yarn npm audit": {
					error: true,
					stderr: "not JSON",
				},
			});

			const yarn = new Yarn({ cp });
			const got = await yarn.deprecations();
			assert.ok(got.isErr());

			const err = got.error();
			assert.match(err, /^yarn npm audit output not JSON: .+$/u);
		});

		t.test("yarn CLI usage", async () => {
			const cp = new CP({
				"yarn npm audit": {},
			});

			const yarn = new Yarn({ cp });
			await yarn.deprecations();
			assert.equal(cp.exec.mock.callCount(), 1);

			const call = cp.exec.mock.calls[0];
			assert.equal(call.arguments[0], "yarn");
			assert.ok(call.arguments[1].includes("npm"));
			assert.ok(call.arguments[1].includes("audit"));
			assert.ok(call.arguments[1].includes("--recursive"));
			assert.ok(call.arguments[1].includes("--json"));
		});
	});

	t.test("hierarchy", (t) => {
		t.test("success", async () => {
			const indirect = {
				value: "indirect@npm:3.1.4",
				children: {},
			};
			const direct = {
				value: "direct@npm:2.7.1",
				children: {
					Dependencies: [
						{ locator: "indirect@npm:3.1.4" },
					],
				},
			};
			const root = {
				value: "root@npm:0.4.2",
				children: {
					Dependencies: [
						{ locator: "direct@npm:2.7.1" },
					],
				},
			};

			const cp = new CP({
				"yarn info": {
					stdout: `${JSON.stringify(indirect)}
${JSON.stringify(direct)}
${JSON.stringify(root)}
`
				},
			});

			const yarn = new Yarn({ cp });
			const got = await yarn.hierarchy();
			assert.ok(got.isOk());

			const value = got.value();
			assert.deepEqual(value, {
				dependencies: {
					direct: {
						version: "2.7.1",
						dependencies: {
							indirect: {
								version: "3.1.4",
								dependencies: {},
							},
						},
					},
				},
			});
		});

		t.test("yarn error", async () => {
			const stderr = "Something went wrong";

			const cp = new CP({
				"yarn info": {
					error: true,
					stderr,
				},
			});

			const yarn = new Yarn({ cp });
			const got = await yarn.hierarchy();
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, `yarn info failed:\n${stderr}`);
		});

		t.test("corrupt output", async () => {
			const cp = new CP({
				"yarn info": {
					stdout: "not JSON",
				},
			});

			const yarn = new Yarn({ cp });
			const got = await yarn.hierarchy();
			assert.ok(got.isErr());

			const err = got.error();
			assert.match(err, /^yarn info output not JSON: .+$/u);
		});

		t.test("yarn CLI usage", async () => {
			const stderr = "Something went wrong";

			const cp = new CP({
				"yarn info": {
					error: true,
					stderr,
				},
			});

			const yarn = new Yarn({ cp });
			await yarn.hierarchy();
			assert.equal(cp.exec.mock.callCount(), 1);

			const call = cp.exec.mock.calls[0];
			assert.equal(call.arguments[0], "yarn");
			assert.ok(call.arguments[1].includes("info"));
			assert.ok(call.arguments[1].includes("--recursive"));
			assert.ok(call.arguments[1].includes("--json"));
		});
	});
});
