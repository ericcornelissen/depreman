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

test("cli.js", async (t) => {
	const flags = [
		"--help", "-h",
		"--errors-only",
		"--omit=dev",
		"--omit=optional",
		"--omit=peer",
		"--report-unused",
	];

	const arbitrary = {
		flag: (options) => {
			const values = options?.exclude
				? flags.filter(v => options.exclude !== v)
				: flags;

			return fc.constantFrom(...values);
		},
		flags: (options) => {
			let arb = fc.uniqueArray(arbitrary.flag());
			if (options.include) {
				const max = flags.length -2 ;
				const range = fc.tuple(fc.nat(max), fc.nat(max)).map(([a, b]) => a < b ? [a, b] : [b, a]);
				arb = range.chain(([index, length]) =>
					fc.uniqueArray(
						arbitrary.flag({ exclude: options.include }),
						{ minLength: length, maxLength: length },
					)
					.map(a => a.toSpliced(index, 0, options.include))
				);
			}

			return arb.filter(a => !(a.includes("-h") && a.includes("--help")));
		},
	};

	await t.test("parseArgv", async (t) => {
		const base = ["node", "depreman"];

		await t.test("no flags", () => {
			const argv = [...base];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(!got.value().help);
			assert.ok(got.value().everything);
			assert.ok(!got.value().omitDev);
			assert.ok(!got.value().omitOptional);
			assert.ok(!got.value().omitPeer);
			assert.ok(!got.value().reportUnused);
		});

		await t.test("--help", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: "--help" }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().help);
					},
				),
			);
		});

		await t.test("-h", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: "-h" }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().help);
					},
				),
			);
		});

		await t.test("--errors-only", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: "--errors-only" }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(!got.value().everything);
					},
				),
			);
		});

		await t.test("--omit=dev", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: "--omit=dev" }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().omitDev);
					},
				),
			);
		});

		await t.test("--omit=optional", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: "--omit=optional" }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().omitOptional);
					},
				),
			);
		});

		await t.test("--omit=peer", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: "--omit=peer" }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().omitPeer);
					},
				),
			);
		});

		await t.test("--report-unused", () => {
			fc.assert(
				fc.property(
					arbitrary.flags({ include: "--report-unused" }),
					(args) => {
						const argv = [...base, ...args];
						const got = parseArgv(argv);
						assert.ok(got.isOk());
						assert.ok(got.value().reportUnused);
					},
				),
			);
		});

		await t.test("a repeated flag that the CLI does know", () => {
			const arg = "--report-unused";
			const argv = [...base, arg, arg];
			const got = parseArgv(argv);
			assert.ok(got.isErr());
			assert.equal(got.error(), `spurious flag(s): ${arg}`);
		});

		await t.test("flags that the CLI does not know", async (t) => {
			await t.test("one flag", () => {
				const arg = "--hello-world";
				const argv = [...base, arg];
				const got = parseArgv(argv);
				assert.ok(got.isErr());
				assert.equal(got.error(), `spurious flag(s): ${arg}`);
			});

			await t.test("multiple flags", () => {
				const arg1 = "--hello";
				const arg2 = "--world";
				const argv = [...base, arg1, arg2];
				const got = parseArgv(argv);
				assert.ok(got.isErr());
				assert.equal(got.error(), `spurious flag(s): ${arg1}, ${arg2}`);
			});
		});

		await t.test("both -h and --help", async (t) => {
			await t.test("--help first", () => {
				const argv = [...base, "--help", "-h"];
				const got = parseArgv(argv);
				assert.ok(got.isErr());
				assert.equal(got.error(), "spurious flag(s): -h");
			});

			await t.test("-h first", () => {
				const argv = [...base, "-h", "--help"];
				const got = parseArgv(argv);
				assert.ok(got.isErr());
				assert.equal(got.error(), "spurious flag(s): -h");
			});
		});

		await t.test("argument the CLI does not expect", async (t) => {
			await t.test("one argument", () => {
				const arg = "foobar";
				const argv = [...base, arg];
				const got = parseArgv(argv);
				assert.ok(got.isErr());
				assert.equal(got.error(), `spurious argument(s): ${arg}`);
			});

			await t.test("two argument", () => {
				const arg1 = "foo";
				const arg2 = "bar";
				const argv = [...base, arg1, arg2];
				const got = parseArgv(argv);
				assert.ok(got.isErr());
				assert.equal(got.error(), `spurious argument(s): ${arg1}, ${arg2}`);
			});
		});
	});
});
