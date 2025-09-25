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

import * as fc from "fast-check";

import {
	parseArgv,
} from "./cli.js";

test("cli.js", (t) => {
	const flags = [
		"--help", "-h",
		"--errors-only",
		"--omit=dev",
		"--omit=optional",
		"--omit=peer",
		"--package-manager=npm",
		"--package-manager=yarn",
		"--report-unused",
		"--version",
	];

	const arbitrary = {
		/**
		 * @param {object} [options]
		 * @param {string[]} [options.exclude]
		 */
		flag: (options) => {
			const values = options?.exclude
				? flags.filter(v => !options.exclude.includes(v))
				: flags;

			return fc.constantFrom(...values);
		},

		/**
		 * @param {object} options
		 * @param {string[]} options.include
		 */
		flags: (options) => {
			if (!options.exclude) {
				options.exclude = [];
			};
			if (!options.include) {
				options.include = [];
			};

			const max = flags.length - options.include.filter(v => flags.includes(v)).length;
			return fc.record({
				args: fc.uniqueArray(
					arbitrary.flag({ exclude: [...options.exclude, ...options.include] }),
					{ minLength: 0, maxLength: max },
				),
				indices: fc.tuple(
					...options.include.map(() => fc.nat({ max })),
				),
			}).map(({ args, indices }) => {
				indices.sort();
				indices.reverse();

				for (const i in indices) {
					const index = indices[i] % (args.length + 1);
					const flag = options.include[i];
					args = args.toSpliced(index, 0, flag);
				}

				return args;
			}).filter((args) =>
				(options.include.includes("-h") && options.include.includes("--help"))
				||
				!(args.includes("-h") && args.includes("--help"))
			).filter((args) =>
				(options.include.includes("--package-manager=npm") && options.include.includes("--package-manager=yarn"))
				||
				!(args.includes("--package-manager=npm") && args.includes("--package-manager=yarn"))
			);
		},
	};

	t.test("parseArgv", (t) => {
		const base = ["node", "depreman"];

		t.test("no flags", () => {
			const argv = [...base];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.equal(got.value().help, false);
			assert.equal(got.value().everything, true);
			assert.equal(got.value().omitDev, false);
			assert.equal(got.value().omitOptional, false);
			assert.equal(got.value().omitPeer, false);
			assert.equal(got.value().packageManager, "npm");
			assert.equal(got.value().reportUnused, false);
		});

		t.test("--help", (t) => {
			t.test("full flag", () => {
				fc.assert(
					fc.property(
						arbitrary.flags({ include: ["--help"] }),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isOk());
							assert.ok(got.value().help);
						},
					),
				);
			});

			t.test("shorthand", () => {
				fc.assert(
					fc.property(
						arbitrary.flags({ include: ["-h"] }),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isOk());
							assert.ok(got.value().help);
						},
					),
				);
			});

			t.test("both full and shorthand", () => {
				fc.assert(
					fc.property(
						arbitrary.flags({ include: ["--help", "-h"] }),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isErr());
							assert.equal(got.error(), "spurious flag(s): -h");
						},
					),
				);
			});
		});

		t.test("--errors-only", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: ["--errors-only"] }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(!got.value().everything);
					},
				),
			);
		});

		t.test("--omit=dev", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: ["--omit=dev"] }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().omitDev);
					},
				),
			);
		});

		t.test("--omit=optional", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: ["--omit=optional"] }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().omitOptional);
					},
				),
			);
		});

		t.test("--omit=peer", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: ["--omit=peer"] }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().omitPeer);
					},
				),
			);
		});

		t.test("--package-manager", (t) => {
			t.test("npm", () => {
				fc.assert(
					fc.property(
						arbitrary.flags({ include: ["--package-manager=npm"] }),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isOk());
							assert.equal(got.value().packageManager, "npm");
						},
					),
				);
			});

			t.test("yarn", () => {
				fc.assert(
					fc.property(
						arbitrary.flags({ include: ["--package-manager=yarn"] }),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isOk());
							assert.equal(got.value().packageManager, "yarn");
						},
					),
				);
			});

			t.test("not present", () => {
				fc.assert(
					fc.property(
						arbitrary.flags({ exclude: ["--package-manager=npm", "--package-manager=yarn"] }),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isOk());
							assert.equal(got.value().packageManager, "npm");
						},
					),
				);
			});

			t.test("unsupported", () => {
				fc.assert(
					fc.property(
						fc.string()
							.filter(name => name !== "npm" && name !== "yarn")
							.chain(name => arbitrary.flags({ include: [`--package-manager=${name}`] })),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isErr());
							assert.match(got.error(), /^spurious flag\(s\): --package-manager=.*$/u);
						},
					),
				);
			});

			t.test("multiple", () => {
				fc.assert(
					fc.property(
						arbitrary.flags({ include: ["--package-manager=npm", "--package-manager=yarn"] }),
						(args) => {
							const argv = [...base, ...args];
							const got = parseArgv(argv);
							assert.ok(got.isErr());
							assert.equal(got.error(), "spurious flag(s): --package-manager=npm");
						},
					),
				);
			});
		});

		t.test("--report-unused", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: ["--report-unused"] }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().reportUnused);
					},
				),
			);
		});

		t.test("--version", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: ["--version"] }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().version);
					},
				),
			);
		});

		t.test("a repeated flag that the CLI does know", () => {
			fc.assert(
				fc.property(
					arbitrary.flag()
						.chain((flag) => fc.tuple(
							fc.constant(flag),
							arbitrary.flags({ include: [flag, flag] }),
						)),
					([flag, args]) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isErr());
						assert.equal(got.error(), `spurious flag(s): ${flag}`);
					},
				),
			);
		});

		t.test("flags that the CLI does not know", () => {
			fc.assert(
				fc.property(
					fc.array(fc.string(), { minLength: 1 })
						.map(arr => arr.map(str => `--${str}`))
						.filter(arr => arr.every(str => !flags.includes(str)))
						.chain(args => arbitrary.flags({ include: args })),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isErr());

						const spurious = args.filter(arg => !flags.includes(arg));
						assert.equal(got.error(), `spurious flag(s): ${spurious.join(", ")}`);
					},
				),
			);
		});

		t.test("arguments that the CLI does not expect", () => {
			fc.assert(
				fc.property(
					fc.array(fc.string(), { minLength: 1 })
						.filter(arr => arr.every(str => !str.startsWith("-")))
						.chain(args => arbitrary.flags({ include: args })),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isErr());

						const spurious = args.filter(arg => !flags.includes(arg));
						assert.equal(got.error(), `spurious argument(s): ${spurious.join(", ")}`);
					},
				),
			);
		});
	});
});
