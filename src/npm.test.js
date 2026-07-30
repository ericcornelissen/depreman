// Copyright (C) 2025-2026  Eric Cornelissen
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
		t.test("with dependencies", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: JSON.stringify({
						version: "0.3.9",
						name: "depreman",
						dependencies: {
							chalk: {
								version: "5.4.1",
								dependencies: {},
							},
							eslint: {
								version: "9.29.0",
								dependencies: {
									"@eslint/config-array": {
										version: "0.21.0",
										dependencies: {
											"@eslint/object-schema": {
												version: "2.1.6",
												dependencies: {},
											},
										},
									},
								},
							},
							pi: {
								version: "3.1.4",
								dependencies: {},
							},
							which: {
								version: "5.0.0",
								dependencies: {
									isexe: {
										version: "3.1.1",
										dependencies: {},
									},
								},
							},
						},
					}),
				},
				"npm view --json @eslint/config-array@0.21.0": {
					stdout: JSON.stringify({}),
				},
				"npm view --json @eslint/object-schema@2.1.6": {
					stdout: JSON.stringify({}),
				},
				"npm view --json chalk@5.4.1": {
					stdout: JSON.stringify({}),
				},
				"npm view --json eslint@9.29.0": {
					stdout: JSON.stringify({}),
				},
				"npm view --json pi@3.1.4": {
					stdout: JSON.stringify({
						deprecated: "pi is old school, use tau instead",
					}),
				},
				"npm view --json which@5.0.0": {
					stdout: JSON.stringify({}),
				},
				"npm view --json isexe@3.1.1": {
					stdout: JSON.stringify([
						{
							deprecated: "upgrade to v4",
						},
					]),
				},
			});
			const fs = new FS({
				"./package.json": JSON.stringify({
					dependencies: {
						chalk: "^5.4.1",
					},
					devDependencies: {
						eslint: "^9.29.0",
					},
					peerDependencies: {
						which: "^5.0.0",
					},
					optionalDependencies: {
						pi: "^3.1.4",
					},
				}),
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.deepEqual(value, [
				{
					name: "isexe",
					version: "3.1.1",
					reason: "upgrade to v4",
				},
				{
					name: "pi",
					version: "3.1.4",
					reason: "pi is old school, use tau instead",
				}
			]);
		});

		t.test("without dependencies", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: JSON.stringify({
						version: "0.3.9",
						name: "depreman",
					}),
				},
			});
			const fs = new FS({
				"./package.json": "{}",
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.deepEqual(value, []);
		});

		t.test("with aliased dependency", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: JSON.stringify({
						version: "0.3.9",
						name: "depreman",
						dependencies: {
							foo: {
								version: "1.2.3",
								dependencies: {},
							},
						},
					}),
				},
				"npm view --json bar@1.2.3": {
					stdout: JSON.stringify([
						{
							deprecated: "upgrade to v2",
						}
					]),
				},
			});
			const fs = new FS({
				"./package.json": JSON.stringify({
					dependencies: {
						"foo": "npm:bar@1.2.3",
					},
				}),
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.deprecations();
			assert.ok(got.isOk());

			const value = got.value();
			assert.deepEqual(value, [
				{
					name: "bar",
					version: "1.2.3",
					reason: "upgrade to v2",
				},
			]);
		});

		t.test("error", (t) => {
			const options = {};

			t.test("malformed manifest", async () => {
				const cp = new CP({});
				const fs = new FS({
					"./package.json": "not valid JSON",
				});

				const npm = new NPM({ cp, fs, options });
				const got = await npm.deprecations();
				assert.ok(got.isErr());

				const err = got.error();
				assert.match(err, /^could not get manifest:/u);
			});

			t.test("npm list", async () => {
				const stderr = "Something list-y went wrong";

				const cp = new CP({
					"npm list": {
						error: true,
						stderr,
					},
				});
				const fs = new FS({
					"./package.json": JSON.stringify({
						dependencies: {
							pi: "^3.1.4",
						},
					}),
				});

				const npm = new NPM({ cp, fs, options });
				const got = await npm.deprecations();
				assert.ok(got.isErr());

				const err = got.error();
				assert.equal(err, `npm list failed:\n${stderr}`);
			});

			t.test("npm view", async () => {
				const stderr = "Something view-y went wrong";

				const cp = new CP({
					"npm list": {
						stdout: JSON.stringify({
							version: "0.3.9",
							name: "depreman",
							dependencies: {
								pi: {
									version: "3.1.4",
									dependencies: {},
								},
							},
						}),
					},
					"npm view": {
						error: true,
						stderr,
					},
				});
				const fs = new FS({
					"./package.json": JSON.stringify({
						dependencies: {
							pi: "^3.1.4",
						},
					}),
				});

				const npm = new NPM({ cp, fs, options });
				const got = await npm.deprecations();
				assert.ok(got.isErr());

				const err = got.error();
				assert.equal(err, `npm view failed:\n${stderr}`);
			});
		});
	});

	t.test("hierarchy", (t) => {
		t.test("success", (t) => {
			t.test("with dependencies", async () => {
				const options = {};

				const cp = new CP({
					"npm list": {
						stdout: JSON.stringify({
							version: "0.3.9",
							name: "depreman",
							dependencies: {
								chalk: {
									version: "5.4.1",
									dependencies: {},
								},
								eslint: {
									version: "9.29.0",
									dependencies: {
										"@eslint/config-array": {
											version: "0.21.0",
											dependencies: {
												"@eslint/object-schema": {
													version: "2.1.6",
													dependencies: {},
												},
											},
										},
									},
								},
								pi: {
									version: "3.1.4",
									dependencies: {},
								},
								which: {
									version: "5.0.0",
									dependencies: {
										isexe: {
											version: "3.1.1",
											dependencies: {},
										},
									},
								},
							},
						}),
					},
				});
				const fs = new FS({
					"./package.json": JSON.stringify({
						dependencies: {
							chalk: "^5.4.1",
						},
						devDependencies: {
							eslint: "^9.29.0",
						},
						peerDependencies: {
							which: "^5.0.0",
						},
						optionalDependencies: {
							pi: "^3.1.4",
						},
					}),
				});

				const npm = new NPM({ cp, fs, options });
				const got = await npm.hierarchy();
				assert.ok(got.isOk());

				const value = got.value();
				assert.deepEqual(value, {
					version: "0.3.9",
					name: "depreman",
					dependencies: {
						chalk: {
							version: "5.4.1",
							scope: "prod",
							dependencies: {},
						},
						eslint: {
							version: "9.29.0",
							scope: "dev",
							dependencies: {
								"@eslint/config-array": {
									version: "0.21.0",
									scope: "dev",
									dependencies: {
										"@eslint/object-schema": {
											version: "2.1.6",
											scope: "dev",
											dependencies: {},
										},
									},
								},
							},
						},
						pi: {
							version: "3.1.4",
							scope: "optional",
							dependencies: {},
						},
						which: {
							version: "5.0.0",
							scope: "peer",
							dependencies: {
								isexe: {
									version: "3.1.1",
									scope: "peer",
									dependencies: {},
								},
							},
						},
					},
				});
			});

			t.test("without dependencies", async () => {
				const options = {};

				const cp = new CP({
					"npm list": {
						stdout: JSON.stringify({
							version: "0.3.9",
							name: "depreman",
						}),
					},
				});
				const fs = new FS({
					"./package.json": "{}",
				});

				const npm = new NPM({ cp, fs, options });
				const got = await npm.hierarchy();
				assert.ok(got.isOk());

				const value = got.value();
				assert.deepEqual(value, {
					version: "0.3.9",
					name: "depreman",
					dependencies: {},
				});
			});

			t.test("with optional peer dependencies", async () => {
				const options = {};

				const cp = new CP({
					"npm list": {
						stdout: JSON.stringify({
							version: "0.3.9",
							name: "depreman",
							dependencies: {
								ansi: {
									version: "0.3.1",
									extraneous: true,
									dependencies: {},
								},
								"ansi-regex": {
									version: "6.2.2",
									extraneous: true,
									dependencies: {
										ansi: {
											version: "0.3.1",
										},
									},
								},
								chalk: {
									version: "5.4.1",
									dependencies: {},
								},
								eslint: {
									version: "9.29.0",
									dependencies: {
										jiti: {},
										minimatch: {
											version: "10.2.4"
										},
									},
								},
							},
						}),
					},
				});
				const fs = new FS({
					"./package.json": JSON.stringify({
						dependencies: {
							chalk: "^5.4.0",
						},
						devDependencies: {
							eslint: "^9.20.0",
						},
						peerDependencies: {
							"ansi-regex": "^6.2.0",
						},
						"peerDependenciesMeta": {
							"ansi-regex": {
								optional: true
							}
						},
					}),
				});

				const npm = new NPM({ cp, fs, options });
				const got = await npm.hierarchy();
				assert.ok(got.isOk());

				const value = got.value();
				assert.deepEqual(value, {
					version: "0.3.9",
					name: "depreman",
					dependencies: {
						chalk: {
							version: "5.4.1",
							scope: "prod",
							dependencies: {},
						},
						eslint: {
							version: "9.29.0",
							scope: "dev",
							dependencies: {
								minimatch: {
									version: "10.2.4",
									scope: "dev",
									dependencies: {},
								},
							},
						},
					},
				});
			});
		});

		t.test("options", (t) => {
			function setup() {
				return {
					cp: new CP({
						"npm list": {
							stdout: "{}",
						},
					}),
					fs: new FS({
						"./package.json": "{}",
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

		t.test("cli error", () => {
			t.test("command error", async () => {
				const options = {};
				const stderr = "Something went wrong";

				const cp = new CP({
					"npm list": {
						error: true,
						stderr,
					},
				});
				const fs = new FS({
					"./package.json": "{}",
				});

				const npm = new NPM({ cp, fs, options });
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
				const fs = new FS({
					"./package.json": "{}",
				});

				const npm = new NPM({ cp, fs, options });
				const got = await npm.hierarchy();
				assert.ok(got.isErr());

				const err = got.error();
				assert.match(err, /npm list failed:\n.+/u);
			});
		});

		t.test("cli usage", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: "{}",
				},
			});
			const fs = new FS({
				"./package.json": "{}",
			});

			const npm = new NPM({ cp, fs, options });
			await npm.hierarchy();
			assert.equal(cp.exec.mock.callCount(), 1);

			const call = cp.exec.mock.calls[0];
			assert.equal(call.arguments[0], "npm");
			assert.ok(call.arguments[1].includes("list"));
			assert.ok(call.arguments[1].includes("--all"));
			assert.ok(call.arguments[1].includes("--json"));
		});

		t.test("no manifest", async () => {
			const options = {};

			const cp = new CP({});
			const fs = new FS({});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.hierarchy();
			assert.ok(got.isErr());

			const err = got.error();
			assert.match(err, /^could not \w+ package\.json: .+/u);
		});

		t.test("dependency missing from manifest", async () => {
			const options = {};

			const cp = new CP({
				"npm list": {
					stdout: JSON.stringify({
						version: "0.3.9",
						name: "depreman",
						dependencies: {
							chalk: {
								version: "5.4.1",
							},
						},
					}),
				},
			});
			const fs = new FS({
				"./package.json": "{}",
			});

			const npm = new NPM({ cp, fs, options });
			await assert.rejects(
				async () => await npm.hierarchy(),
			);
		});
	});

	t.test("install", (t) => {
		t.test("success", async () => {
			const options = {};

			const cp = new CP({
				"npm install": {},
			});
			const fs = new FS({
				"./package-lock.json": "{}",
			});

			const npm = new NPM({ cp, fs, options });
			const got = await npm.install();
			assert.ok(got.isOk());
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

		t.test("npm CLI usage", async () => {
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
