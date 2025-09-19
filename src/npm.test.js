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
import { FS } from "./fs.mock.js";

import { NPM } from "./npm.js";

test("npm.js", (t) => {
	t.test("aliases", (t) => {
		const cp = new CP({});
		const options = {};

		t.test("no dependencies", async () => {
			const fs = new FS({
				"./package.json": "{}",
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.size, 0);
		});

		t.test("no aliases", async () => {
			const fs = new FS({
				"./package.json": JSON.stringify({
					dependencies: {
						depreman: "0.3.9",
					},
					devDependencies: {
						eslint: "9.29.0",
					},
					optionalDependencies: {
						pi: "3.1.4",
					},
					peerDependencies: {
						react: "19.1.1",
					},
				}),
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.size, 0);
		});

		t.test("alias in (production) dependencies", async () => {
			const alias = "foo";
			const name = "bar";
			const version = "3.1.4";

			const fs = new FS({
				"./package.json": JSON.stringify({
					dependencies: {
						[alias]: `npm:${name}@${version}`,
					},
				}),
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.size, 1);
			assert.deepEqual(value.get(alias), { name, version });
		});

		t.test("alias in development dependencies", async () => {
			const alias = "hello";
			const name = "world";
			const version = "2.7.1";

			const fs = new FS({
				"./package.json": JSON.stringify({
					devDependencies: {
						[alias]: `npm:${name}@${version}`,
					},
				}),
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.size, 1);
			assert.deepEqual(value.get(alias), { name, version });
		});

		t.test("alias in optional dependencies", async () => {
			const alias = "hello";
			const name = "world";
			const version = "2.7.1";

			const fs = new FS({
				"./package.json": JSON.stringify({
					optionalDependencies: {
						[alias]: `npm:${name}@${version}`,
					},
				}),
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.size, 1);
			assert.deepEqual(value.get(alias), { name, version });
		});

		t.test("alias in peer dependencies", async () => {
			const alias = "hello";
			const name = "world";
			const version = "2.7.1";

			const fs = new FS({
				"./package.json": JSON.stringify({
					peerDependencies: {
						[alias]: `npm:${name}@${version}`,
					},
				}),
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.size, 1);
			assert.deepEqual(value.get(alias), { name, version });
		});

		t.test("missing manifest", async () => {
			const fs = new FS({});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isErr());

			const err = got.error();
			assert.match(
				err,
				/^could not get manifest: could not read package\.json: .+/u,
			);
		});

		t.test("corrupt manifest", async () => {
			const fs = new FS({
				"./package.json": "not JSON",
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.aliases();
			assert.ok(got.isErr());

			const err = got.error();
			assert.match(
				err,
				/^could not get manifest: could not parse package\.json: .+/u,
			);
		});
	});

	t.test("deprecations", (t) => {
		const fs = new FS({});
		const options = {};

		t.test("no log", async () => {
			const cp = new CP({
				"npm install": {
					stderr: "",
				},
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.length, 0);
		});

		t.test("no deprecation warnings", async () => {
			const cp = new CP({
				"npm install": {
					stderr: "This is not a deprecation warning",
				},
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.length, 0);
		});

		t.test("a deprecation warning", async () => {
			const name = "foobar";
			const version = "3.1.4";
			const reason = "This package is no longer supported.";

			const cp = new CP({
				"npm install": {
					stderr: `npm warn deprecated ${name}@${version}: ${reason}`,
				},
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.length, 1);
			assert.deepEqual(value[0], { name, version, reason });
		});

		t.test("full install log", async () => {
			const name = "foobar";
			const version = "3.1.4";
			const reason = "This package is no longer supported.";

			const cp = new CP({
				"npm install": {
					stderr: `npm warn deprecated ${name}@${version}: ${reason}\n\nadded 2 packages in 1s`,
				},
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.equal(value.length, 1);
			assert.deepEqual(value[0], { name, version, reason });
		});

		t.test("npm error", async () => {
			const stderr = "Something went wrong";

			const cp = new CP({
				"npm install": {
					error: true,
					stderr,
				},
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, `npm install failed:\n${stderr}`);
		});
	});

	t.test("hierarchy", (t) => {
		t.test("success", async () => {
			const options = {};
			const want = {
				version: "0.3.9",
				name: "depreman",
				dependencies: {
					eslint: {
						version: "9.29.0",
						dependencies: {},
					},
				},
			};

			const cp = new CP({
				"npm list": {
					stdout: JSON.stringify(want),
				},
			});

			const npm = new NPM({ cp, options });
			const got = await npm.hierarchy();
			assert.ok(got.isOk());

			const value = got.value();
			assert.deepEqual(value, want);
		});

		t.test("options", (t) => {
			function setup() {
				return {
					cp: new CP({
						"npm list": {
							stdout: "{}",
						},
					}),
				};
			}

			t.test("omitDev", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();
					const options = {
						omitDev: true,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.hierarchy();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit dev"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitDev: false,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.hierarchy();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(!call.arguments[1].join(" ").includes("--omit dev"));
				});
			});

			t.test("omitOptional", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();
					const options = {
						omitOptional: true,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.hierarchy();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit optional"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitOptional: false,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.hierarchy();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(!call.arguments[1].join(" ").includes("--omit optional"));
				});
			});

			t.test("omitPeer", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();
					const options = {
						omitPeer: true,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.hierarchy();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit peer"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitPeer: false,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.hierarchy();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(!call.arguments[1].join(" ").includes("--omit peer"));
				});
			});
		});

		t.test("npm error", async () => {
			const options = {};
			const stderr = "Something went wrong";

			const cp = new CP({
				"npm list": {
					error: true,
					stderr,
				},
			});

			const npm = new NPM({ cp, options });
			const got = await npm.hierarchy();
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, `npm list failed:\n${stderr}`);
		});

		t.test("corrupt output", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: "not JSON",
				},
			});

			const npm = new NPM({ cp, options });
			const got = await npm.hierarchy();
			assert.ok(got.isErr());

			const err = got.error();
			assert.match(err, /npm list failed:\n.+/u);
		});

		t.test("npm CLI usage", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: "{}",
				},
			});

			const npm = new NPM({ cp, options });
			await npm.hierarchy();
			assert.equal(cp.exec.mock.callCount(), 1);

			const call = cp.exec.mock.calls[0];
			assert.equal(call.arguments[0], "npm");
			assert.ok(call.arguments[1].includes("list"));
			assert.ok(call.arguments[1].includes("--all"));
			assert.ok(call.arguments[1].includes("--json"));
		});
	});

	t.test("install", (t) => {
		t.test("success", async () => {
			const options = {};
			const want = "npm warn deprecated foobar@3.1.4: This package is no longer supported.";

			const cp = new CP({
				"npm": {
					stderr: want,
				},
			});
			const fs = new FS({
				"./package-lock.json": "{}",
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.install();
			assert.ok(got.isOk());

			const value = got.value();
			assert.deepEqual(value, { stdout: "", stderr: want });
		});

		t.test("options", (t) => {
			function setup() {
				return {
					cp: new CP({
						"npm": {},
					}),
					fs: new FS({
						"./package-lock.json": "{}",
					}),
				};
			}

			t.test("omitDev", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();
					const options = {
						omitDev: true,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.install();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit dev"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitDev: false,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.install();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(!call.arguments[1].join(" ").includes("--omit dev"));
				});
			});

			t.test("omitOptional", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();
					const options = {
						omitOptional: true,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.install();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit optional"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitOptional: false,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.install();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(!call.arguments[1].join(" ").includes("--omit optional"));
				});
			});

			t.test("omitPeer", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();
					const options = {
						omitPeer: true,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.install();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit peer"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitPeer: false,
					};

					const npm = new NPM({ cp, fs, options });
					await npm.install();
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(!call.arguments[1].join(" ").includes("--omit peer"));
				});
			});
		});

		t.test("npm error", async () => {
			const options = {};
			const stderr = "Something went wrong";

			const cp = new CP({
				"npm": {
					error: true,
					stderr,
				},
			});
			const fs = new FS({});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.install();
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, `npm install failed:\n${stderr}`);
		});

		t.test("npm CLI usage", (t) => {
			t.test("with lockfile", async () => {
				const options = {};

				const cp = new CP({
					"npm": {},
				});
				const fs = new FS({
					"./package-lock.json": "{}",
				});

				const npm = new NPM({ cp, fs, options });
				await npm.install();
				assert.equal(cp.exec.mock.callCount(), 1);

				const call = cp.exec.mock.calls[0];
				assert.equal(call.arguments[0], "npm");
				assert.ok(call.arguments[1].includes("clean-install"));
				assert.ok(call.arguments[1].includes("--no-audit"));
				assert.ok(call.arguments[1].includes("--no-fund"));
				assert.ok(call.arguments[1].includes("--no-update-notifier"));
			});

			t.test("without lockfile", async () => {
				const options = {};

				const cp = new CP({
					"npm": {},
				});
				const fs = new FS({});

				const npm = new NPM({ cp, fs, options });
				await npm.install();
				assert.equal(cp.exec.mock.callCount(), 1);

				const call = cp.exec.mock.calls[0];
				assert.equal(call.arguments[0], "npm");
				assert.ok(call.arguments[1].includes("install"));
				assert.ok(call.arguments[1].includes("--no-audit"));
				assert.ok(call.arguments[1].includes("--no-fund"));
				assert.ok(call.arguments[1].includes("--no-update-notifier"));
			});
		});
	});
});
