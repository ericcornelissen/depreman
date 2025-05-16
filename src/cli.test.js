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
		"--offline",
		"--omit=dev",
		"--omit=optional",
		"--omit=peer",
		"--report-unused",
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
			const n = options.include.length + 1;
			const m = options.include.filter(v => flags.includes(v)).length;

			return fc.array(
				fc.nat({ max: flags.length - m }),
				{ minLength: n, maxLength: n },
			).map((numbers) => {
				numbers.sort();
				numbers.reverse();
				return numbers;
			}).chain(([length, ...indices]) =>
				fc.uniqueArray(
					arbitrary.flag({ exclude: options.include }),
					{ minLength: length, maxLength: length },
				).map(args => {
					for (const i in indices) {
						const index = indices[i];
						const flag = options.include[i];
						args.splice(index, 0, flag);
					}

					return args;
				})
			).filter((args) =>
				(options.include.includes("-h") && options.include.includes("--help"))
				||
				!(args.includes("-h") && args.includes("--help"))
			);
		},
	};

	t.test("parseArgv", (t) => {
		const base = ["node", "depreman"];

		t.test("no flags", () => {
			const argv = [...base];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(!got.value().help);
			assert.ok(got.value().everything);
			assert.ok(!got.value().offline);
			assert.ok(!got.value().omitDev);
			assert.ok(!got.value().omitOptional);
			assert.ok(!got.value().omitPeer);
			assert.ok(!got.value().reportUnused);
		});

		t.test("--help", () => {
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

		t.test("-h", () => {
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

		t.test("--offline", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: ["--offline"] }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().offline);
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

		t.test("both -h and --help", () => {
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
