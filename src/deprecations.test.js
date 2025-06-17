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

import {
	getDeprecatedPackages,
} from "./deprecations.js";

test("deprecations.js", (t) => {
	t.test("getDeprecatedPackages", (t) => {
		const defaultOptions = {
			omitDev: false,
			omitOptional: false,
			omitPeer: false,
		};

		const testCases = {
			"basic sample": {
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
				installLog: [
					"npm warn deprecated foobar@3.1.4: This package is no longer supported.",
					"",
					"added 2 packages in 1s",
					"",
					"2 packages are looking for funding",
					"  run `npm fund` for details",
				],
				manifest: {
					dependencies: {
						foo: "3.1.4",
						deadend: "2.7.1",
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
			"multiple packages with the same names or versions": {
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
				installLog: [
					"npm warn deprecated bar@2.7.1: This package is no longer supported.",
					"npm warn deprecated baz@1.0.0: This package is not supported anymore.",
					"",
					"added 3 packages in 1s",
					"",
					"2 packages are looking for funding",
					"  run `npm fund` for details",
				],
				manifest: {
					dependencies: {
						bar: "3.1.4",
						baz: "1.0.0",
						foo: "1.0.0",
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
			"alias sample": {
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
				installLog: [
					"npm warn deprecated bar@3.1.4: This package is no longer supported.",
					"npm warn deprecated world@2.7.1: This package is not supported anymore.",
				],
				manifest: {
					dependencies: {
						foo: "npm:bar@3.1.4",
					},
					devDependencies: {
						hello: "npm:world@2.7.1",
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
			"repeated deprecation warning": {
				hierarchy: {
					dependencies: {
						foo: {
							version: "2.0.0",
						},
						bar: {
							version: "3.1.4",
							dependencies: {
								foo: {
									version: "1.0.0",
								},
							},
						},
						baz: {
							version: "1.0.0",
							dependencies: {
								foo: {
									version: "1.0.0",
								},
							},
						},
					},
				},
				installLog: [
					"npm warn deprecated foo@2.0.0: This package is no longer supported.",
					"npm warn deprecated foo@1.0.0: This package is no longer supported.",
					"npm warn deprecated baz@1.0.0: This package is not supported anymore.",
					"npm warn deprecated foo@1.0.0: This package is no longer supported.",
				],
				manifest: {
					dependencies: {
						bar: "3.1.4",
						baz: "1.0.0",
						foo: "2.0.0",
					},
				},
				want: [
					{
						name: "foo",
						version: "2.0.0",
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "foo", version: "2.0.0" },
							],
						],
					},
					{
						name: "foo",
						version: "1.0.0",
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "bar", version: "3.1.4" },
								{ name: "foo", version: "1.0.0" },
							],
							[
								{ name: "baz", version: "1.0.0" },
								{ name: "foo", version: "1.0.0" },
							],
						],
					},
					{
						name: "baz",
						version: "1.0.0",
						reason: "This package is not supported anymore.",
						paths: [
							[
								{ name: "baz", version: "1.0.0" },
							],
						],
					},
				],
			},
			"ignore self as a dependencies": {
				hierarchy: {
					name: "foo",
					dependencies: {
						foo: {
							dependencies: {
								bar: {
									version: "0.4.2",
								},
							},
						},
						bar: {
							version: "0.4.2",
						},
					},
				},
				installLog: [
					"npm warn deprecated bar@0.4.2: This package is no longer supported.",
				],
				manifest: {
					dependencies: {
						foo: "file:./",
						bar: "0.4.2",
					},
				},
				want: [
					{
						name: "bar",
						version: "0.4.2",
						reason: "This package is no longer supported.",
						paths: [
							[
								{ name: "bar", version: "0.4.2" },
							],
						],
					},
				],
			},
		};

		for (const [name, testCase] of Object.entries(testCases)) {
			t.test(name, async () => {
				const { want } = testCase;

				const cp = new CP({
					"npm clean-install": {
						stderr: testCase.installLog.join("\n"),
					},
					"npm list --all --json": {
						stdout: JSON.stringify(testCase.hierarchy),
					},
				});
				const fs = new FS({
					"./package.json": JSON.stringify(testCase.manifest || {}),
					"./package-lock.json": "{}",
				});
				const options = {
					...defaultOptions,
					...testCase.options,
				};

				const got = await getDeprecatedPackages({ cp, fs, options });
				assert.deepEqual(got, want);
			});
		}

		t.test("dependency installation", (t) => {
			const options = defaultOptions;

			function setup() {
				return {
					cp: new CP({
						"npm install": {},
						"npm clean-install": {},
						"npm list --all --json": {
							stdout: "{}",
						},
					}),
					fs: new FS({
						"./package.json": "{}",
						"./package-lock.json": "{}",
					}),
				};
			}

			t.test("with lockfile", async () => {
				const { cp } = setup();

				const fs = new FS({
					"./package.json": "{}",
					"./package-lock.json": "{}",
				});

				await getDeprecatedPackages({ cp, fs, options });
				assert.equal(cp.exec.mock.calls[0].arguments[1][0], "clean-install");
			});

			t.test("without lockfile", async () => {
				const { cp } = setup();

				const fs = new FS({
					"./package.json": "{}",
				});

				await getDeprecatedPackages({ cp, fs, options });
				assert.equal(cp.exec.mock.calls[0].arguments[1][0], "install");
			});

			t.test("suppress auditing", async () => {
				const { cp, fs } = setup();

				await getDeprecatedPackages({ cp, fs, options });
				assert.ok(cp.exec.mock.calls[0].arguments[1].includes("--no-audit"));
			});

			t.test("suppress funding", async () => {
				const { cp, fs } = setup();

				await getDeprecatedPackages({ cp, fs, options });
				assert.ok(cp.exec.mock.calls[0].arguments[1].includes("--no-fund"));
			});

			t.test("suppress update notifier", async () => {
				const { cp, fs } = setup();

				await getDeprecatedPackages({ cp, fs, options });
				assert.ok(cp.exec.mock.calls[0].arguments[1].includes("--no-update-notifier"));
			});
		});

		t.test("options", (t) => {
			function setup() {
				return {
					cp: new CP({
						"npm clean-install": {},
						"npm list --all --json": {
							stdout: "{}",
						},
					}),
					fs: new FS({
						"./package.json": "{}",
						"./package-lock.json": "{}",
					}),
				};
			}

			t.test("omitDev", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitDev: true,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(cp.exec.mock.calls[0].arguments[1].join(" ").includes("--omit dev"));
					assert.ok(cp.exec.mock.calls[1].arguments[1].join(" ").includes("--omit dev"));
				});

				t.test("false", async () => {
						const { cp, fs } = setup();

						const options = {
							...defaultOptions,
							omitDev: false,
						};

						await getDeprecatedPackages({ cp, fs, options });
						assert.ok(!cp.exec.mock.calls[0].arguments[1].join(" ").includes("--omit dev"));
						assert.ok(!cp.exec.mock.calls[1].arguments[1].join(" ").includes("--omit dev"));
					});
			});

			t.test("omitOptional", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitOptional: true,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(cp.exec.mock.calls[0].arguments[1].join(" ").includes("--omit optional"));
					assert.ok(cp.exec.mock.calls[1].arguments[1].join(" ").includes("--omit optional"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitOptional: false,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(!cp.exec.mock.calls[0].arguments[1].join(" ").includes("--omit optional"));
					assert.ok(!cp.exec.mock.calls[1].arguments[1].join(" ").includes("--omit optional"));
				});
			});

			t.test("omitPeer", (t) => {
				t.test("true", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitPeer: true,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(cp.exec.mock.calls[0].arguments[1].join(" ").includes("--omit peer"));
					assert.ok(cp.exec.mock.calls[1].arguments[1].join(" ").includes("--omit peer"));
				});

				t.test("false", async () => {
					const { cp, fs } = setup();

					const options = {
						...defaultOptions,
						omitPeer: false,
					};

					await getDeprecatedPackages({ cp, fs, options });
					assert.ok(!cp.exec.mock.calls[0].arguments[1].join(" ").includes("--omit peer"));
					assert.ok(!cp.exec.mock.calls[1].arguments[1].join(" ").includes("--omit peer"));
				});
			});
		});

		t.test("no manifest", async () => {
			const options = defaultOptions;

			const cp = new CP({
				"npm install": {},
				"npm list --all --json": {
					stdout: "{}",
				},
			});
			const fs = new FS({});

			await assert.rejects(
				async () => await getDeprecatedPackages({ cp, fs, options }),
				(error) => {
					assert.ok(error instanceof Error);
					assert.equal(
						error.message,
						"could not get package.json: file not found",
					);

					return true;
				},
			);
		});

		t.test("no lockfile", async () => {
			const options = defaultOptions;

			const cp = new CP({
				"npm install": {
					stderr: "npm warn deprecated foobar@3.1.4: This package is no longer supported.",
				},
				"npm list --all --json": {
					stdout: JSON.stringify({
						dependencies: {
							foobar: {
								version: "3.1.4",
							},
						},
					}),
				},
			});
			const fs = new FS({
				"./package.json": "{}",
			});

			const want = [
				{
					name: "foobar",
					version: "3.1.4",
					reason: 'This package is no longer supported.',
					paths: [
						[
							{ name: "foobar", version: "3.1.4" },
						]
					],
				},
			];

			const got = await getDeprecatedPackages({ cp, fs, options });
			assert.deepEqual(got, want);
		});

		t.test("deprecation warnings cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = new CP({
				"npm clean-install": {
					error: true,
				},
				"npm list --all --json": {
					stdout: "{}",
				},
			});
			const fs = new FS({
				"./package.json": "{}",
				"./package-lock.json": "{}",
			});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
				(error) => {
					assert.ok(error instanceof Error);
					assert.match(
						error.message,
						/^npm install failed:\n.*$/u,
					);

					return true;
				},
			);
		});

		t.test("dependency hierarchy cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = new CP({
				"npm clean-install": {},
				"npm list --all --json": {
					error: true,
					stdout: "{}",
				},
			});
			const fs = new FS({
				"./package.json": "{}",
				"./package-lock.json": "{}",
			});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
				(error) => {
					assert.ok(error instanceof Error);
					assert.match(
						error.message,
						/^npm list failed:\n.*$/u,
					);

					return true;
				},
			);
		});

		t.test("aliases cannot be obtained", async () => {
			const options = defaultOptions;

			const cp = new CP({
				"npm clean-install": {},
				"npm list --all --json": {
					stdout: "{}",
				},
			});
			const fs = new FS({});

			await assert.rejects(
				() => getDeprecatedPackages({ cp, fs, options }),
			);
		});
	});
});
