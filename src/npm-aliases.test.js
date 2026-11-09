// Copyright (C) 2026  David Castro
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
import { getDeprecatedPackages } from "./deprecations.js";
import { FS } from "./fs.mock.js";
import { NPM } from "./npm.js";

test("npm aliases", async (t) => {
	const testCases = {
		"transitive alias": {
			manifest: { parent: "1.0.0" },
			dependencies: {
				parent: {
					name: "parent", version: "1.0.0",
					dependencies: {
						"string-width-cjs": { name: "string-width", version: "4.2.3" },
					},
				},
			},
			deprecated: "string-width@4.2.3",
			paths: [["parent@1.0.0", "string-width@4.2.3"]],
		},
		"scoped transitive alias": {
			manifest: { parent: "1.0.0" },
			dependencies: {
				parent: {
					name: "parent", version: "1.0.0",
					dependencies: {
						legacy: { name: "@example/old", version: "2.0.0" },
					},
				},
			},
			deprecated: "@example/old@2.0.0",
			paths: [["parent@1.0.0", "@example/old@2.0.0"]],
		},
		"same alias at different depths": {
			manifest: { legacy: "npm:parent@^1.0.0" },
			dependencies: {
				legacy: {
					name: "parent", version: "1.0.0",
					dependencies: {
						legacy: { name: "child", version: "2.0.0" },
					},
				},
			},
			deprecated: "child@2.0.0",
			paths: [["parent@1.0.0", "child@2.0.0"]],
		},
		"installed version of a direct alias": {
			manifest: { legacy: "npm:old@^1.0.0" },
			dependencies: { legacy: { name: "old", version: "1.2.3" } },
			deprecated: "old@1.2.3",
			paths: [["old@1.2.3"]],
		},
		"canonical name also used as a root alias": {
			manifest: { legacy: "npm:old@1.0.0", old: "npm:other@1.0.0" },
			dependencies: {
				legacy: { name: "old", version: "1.0.0" },
				old: { name: "other", version: "1.0.0" },
			},
			deprecated: "old@1.0.0",
			paths: [["old@1.0.0"]],
		},
		"child uses its parent's canonical name": {
			manifest: { parent: "2.0.0" },
			dependencies: {
				parent: {
					name: "parent", version: "2.0.0",
					dependencies: { parent: { name: "parent", version: "1.0.0" } },
				},
			},
			deprecated: "parent@1.0.0",
			paths: [["parent@2.0.0", "parent@1.0.0"]],
		},
		"multiple aliases of the same installed package": {
			manifest: { first: "npm:old@1.0.0", second: "npm:old@1.0.0" },
			dependencies: {
				first: { name: "old", version: "1.0.0" },
				second: { name: "old", version: "1.0.0" },
			},
			deprecated: "old@1.0.0",
			paths: [["old@1.0.0"], ["old@1.0.0"]],
		},
		"root package is not treated as a dependency": {
			manifest: { old: "1.0.0" },
			dependencies: {
				old: { name: "old", version: "1.0.0" },
				fixture: {
					name: "fixture", version: "1.0.0",
					dependencies: { old: { name: "old", version: "1.0.0" } },
				},
			},
			deprecated: "old@1.0.0",
			paths: [["old@1.0.0"]],
		},
	};

	for (const [name, scenario] of Object.entries(testCases)) {
		await t.test(name, async () => {
			const cp = new CP({
				"npm install": {},
				"npm list": {
					stdout: JSON.stringify({ name: "fixture", dependencies: scenario.dependencies }),
				},
				[`npm view --json ${scenario.deprecated}`]: {
					stdout: JSON.stringify({ deprecated: "Use a supported version" }),
				},
				"npm view": { stdout: "{}" },
			});
			const fs = new FS({
				"./package.json": JSON.stringify({ dependencies: scenario.manifest }),
			});
			const npm = new NPM({ cp, fs, options: {} });
			const result = await getDeprecatedPackages(npm);
			assert.ok(result.isOk());
			const packages = result.value();
			assert.equal(packages.length, 1);
			const [pkg] = packages;
			assert.equal(`${pkg.name}@${pkg.version}`, scenario.deprecated);
			assert.equal(pkg.reason, "Use a supported version");
			assert.deepEqual(
				pkg.paths.map(p => p.map(d => `${d.name}@${d.version}`)),
				scenario.paths,
			);
			assert.ok(pkg.paths.every(p => p.every(d => d.scope === "prod")));
			const calls = cp.exec.mock.calls.map(c => c.arguments[1]);
			assert.ok(calls.filter(args => args[0] === "list").every(args => args.includes("--long")));
			assert.equal(calls.filter(args => args[0] === "view" && args[2] === scenario.deprecated).length, 1);
		});
	}
});
