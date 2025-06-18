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
	t.test("install", (t) => {
		t.test("success", async () => {
			const options = {};
			const want = "npm warn deprecated foobar@3.1.4: This package is no longer supported.";

			const cp = new CP({
				"npm clean-install": {
					stderr: want,
				},
			});
			const fs = new FS({
				"./package-lock.json": "{}",
			});

			const npm = new NPM({ cp, fs });
			const got = await npm.install(options);
			assert.ok(got.isOk());

			const value = got.value();
			assert.deepEqual(value, want);
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

					const npm = new NPM({ cp, fs });
					await npm.install(options);
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit dev"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitDev: false,
					};

					const npm = new NPM({ cp, fs });
					await npm.install(options);
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

					const npm = new NPM({ cp, fs });
					await npm.install(options);
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit optional"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitOptional: false,
					};

					const npm = new NPM({ cp, fs });
					await npm.install(options);
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

					const npm = new NPM({ cp, fs });
					await npm.install(options);
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit peer"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitPeer: false,
					};

					const npm = new NPM({ cp, fs });
					await npm.install(options);
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

			const npm = new NPM({ cp, fs });
			const got = await npm.install(options);
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, `npm install failed with code 1:\n${stderr}`);
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

				const npm = new NPM({ cp, fs });
				await npm.install(options);
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

				const npm = new NPM({ cp, fs });
				await npm.install(options);
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

	t.test("list", (t) => {
		t.test("success", async () => {
			const options = {};
			const want = {};

			const cp = new CP({
				"npm list": {
					stdout: JSON.stringify(want),
				},
			});

			const npm = new NPM({ cp });
			const got = await npm.list(options);
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

					const npm = new NPM({ cp, fs });
					await npm.list(options);
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit dev"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitDev: false,
					};

					const npm = new NPM({ cp, fs });
					await npm.list(options);
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

					const npm = new NPM({ cp, fs });
					await npm.list(options);
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit optional"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitOptional: false,
					};

					const npm = new NPM({ cp, fs });
					await npm.list(options);
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

					const npm = new NPM({ cp, fs });
					await npm.list(options);
					assert.equal(cp.exec.mock.callCount(), 1);

					const call = cp.exec.mock.calls[0];
					assert.ok(call.arguments[1].join(" ").includes("--omit peer"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();
					const options = {
						omitPeer: false,
					};

					const npm = new NPM({ cp, fs });
					await npm.list(options);
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

			const npm = new NPM({ cp });
			const got = await npm.list(options);
			assert.ok(got.isErr());

			const err = got.error();
			assert.equal(err, `npm list failed with code 1:\n${stderr}`);
		});

		t.test("npm CLI usage", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: "{}",
				},
			});

			const npm = new NPM({ cp });
			await npm.list(options);
			assert.equal(cp.exec.mock.callCount(), 1);

			const call = cp.exec.mock.calls[0];
			assert.equal(call.arguments[0], "npm");
			assert.ok(call.arguments[1].includes("list"));
			assert.ok(call.arguments[1].includes("--all"));
			assert.ok(call.arguments[1].includes("--json"));
		});
	});
});
