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
import * as path from "node:path";
import { test } from "node:test";

import { CP } from "./cp.mock.js";
import { FS } from "./fs.mock.js";

import { getVersions } from "./version.js";

test("version.js", (t) => {
	t.test("getVersions", (t) => {
		const cmdNodeVersion = "node --version";
		const cmdNpmVersion = "npm --version";
		const cmdYarnVersion = "yarn --version";
		const fileManifest = path.join(import.meta.dirname, "..", "package.json");

		t.test("success", () => {
			const depreman = "0.3.11";
			const node = "24.4.1";
			const npm = "11.4.2";
			const yarn = "4.1.0";

			t.test("with npm and yarn", async () => {
				const cp = new CP({
					[cmdNodeVersion]: { stdout: `v${node}\n` },
					[cmdNpmVersion]: { stdout: `${npm}\n` },
					[cmdYarnVersion]: { stdout: `${yarn}\n` },
				});
				const fs = new FS({
					[fileManifest]: JSON.stringify({ version: depreman }),
				});

				const got = await getVersions({ cp, fs });
				assert.ok(got.isOk());

				const result = got.value();
				assert.deepEqual(result, {
					depreman,
					node,
					npm,
					yarn,
				});
			});

			t.test("with only npm", async () => {
				const cp = new CP({
					[cmdNodeVersion]: { stdout: `v${node}\n` },
					[cmdNpmVersion]: { stdout: `${npm}\n` },
					[cmdYarnVersion]: { error: true },
				});
				const fs = new FS({
					[fileManifest]: JSON.stringify({ version: depreman }),
				});

				const got = await getVersions({ cp, fs });
				assert.ok(got.isOk());

				const result = got.value();
				assert.deepEqual(result, {
					depreman,
					node,
					npm,
				});
			});

			t.test("with only yarn", async () => {
				const cp = new CP({
					[cmdNodeVersion]: { stdout: `v${node}\n` },
					[cmdNpmVersion]: { error: true },
					[cmdYarnVersion]: { stdout: `${yarn}\n` },
				});
				const fs = new FS({
					[fileManifest]: JSON.stringify({ version: depreman }),
				});

				const got = await getVersions({ cp, fs });
				assert.ok(got.isOk());

				const result = got.value();
				assert.deepEqual(result, {
					depreman,
					node,
					yarn,
				});
			});
		});

		t.test("node version error", async () => {
			const stderr = "could not get Node.js version";

			const cp = new CP({
				[cmdNodeVersion]: { error: true, stderr },
				[cmdNpmVersion]: { stdout: "11.4.2\n" },
				[cmdYarnVersion]: { stdout: "4.1.0\n" },
			});
			const fs = new FS({
				[fileManifest]: JSON.stringify({ version: "0.3.11" }),
			});

			const got = await getVersions({ cp, fs });
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, stderr);
		});

		t.test("all package manager version error", async () => {
			const cp = new CP({
				[cmdNodeVersion]: { stdout: "v24.4.1\n" },
				[cmdNpmVersion]: { error: true },
				[cmdYarnVersion]: { error: true },
			});
			const fs = new FS({
				[fileManifest]: JSON.stringify({ version: "0.3.11" }),
			});

			const got = await getVersions({ cp, fs });
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, "no package manager found");
		});

		t.test("self version error", (t) => {
			t.test("corrupted", async () => {
				const cp = new CP({
					[cmdNodeVersion]: { stdout: "v24.4.1\n" },
					[cmdNpmVersion]: { stdout: "11.4.2\n" },
					[cmdYarnVersion]: { stdout: "4.1.0\n" },
				});
				const fs = new FS({
					[fileManifest]: "garbage",
				});

				const got = await getVersions({ cp, fs });
				assert.ok(got.isErr());

				const err = got.error();
				assert.match(err, /^Unexpected .+ JSON$/u);
			});

			t.test("not found", async () => {
				const cp = new CP({
					[cmdNodeVersion]: { stdout: "v24.4.1" },
					[cmdNpmVersion]: { stdout: "11.4.2" },
					[cmdYarnVersion]: { stdout: "4.1.0\n" },
				});
				const fs = new FS({});

				const got = await getVersions({ cp, fs });
				assert.ok(got.isErr());

				const err = got.error();
				assert.equal(err, "file not found");
			});
		});
	});
});
