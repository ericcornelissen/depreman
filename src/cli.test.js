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

import {
	parseArgv,
} from "./cli.js";

test("cli.js", async (t) => {
	await t.test("parseArgv", async (t) => {
		const base = ["depreman"];

		await t.test("no flags", () => {
			const argv = base;
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
			const argv = [...base, "--help"];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(got.value().help);
		});

		await t.test("-h", () => {
			const argv = [...base, "-h"];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(got.value().help);
		});

		await t.test("--errors-only", () => {
			const argv = [...base, "--errors-only"];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(!got.value().everything);
		});

		await t.test("--omit=dev", () => {
			const argv = [...base, "--omit=dev"];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(got.value().omitDev);
		});

		await t.test("--omit=optional", () => {
			const argv = [...base, "--omit=optional"];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(got.value().omitOptional);
		});

		await t.test("--omit=peer", () => {
			const argv = [...base, "--omit=peer"];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(got.value().omitPeer);
		});

		await t.test("--report-unused", () => {
			const argv = [...base, "--report-unused"];
			const got = parseArgv(argv);
			assert.ok(got.isOk());
			assert.ok(got.value().reportUnused);
		});
	});
});
