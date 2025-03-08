// Copyright (C) 2024-2025  Eric Cornelissen
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
import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { test } from "node:test";
import { fileURLToPath, URL } from "node:url";

test("end-to-end", async (t) => {
	await t.test("--help", () => {
		const result = cli({
			args: ["--help"],
			project: fixture("example"),
		});

		assert.equal(result.exitCode, 0);
		assert.notEqual(result.stdout, "");
		assert.equal(result.stderr, "");
	});

	await t.test("--omit=dev", () => {
		const result = cli({
			args: ["--omit=dev"],
			project: fixture("dev-deps-only"),
		});

		assert.equal(result.exitCode, 0);
		assert.equal(result.stdout, "");
		assert.equal(result.stderr, "");
	});

	await t.test("basic example without unexpected error", () => {
		const result = cli({
			project: fixture("example"),
		});

		assert.notEqual(result.exitCode, 2);
	});

	await t.test("ignoring all deprecation warnings with --errors-only", () => {
		const result = cli({
			args: ["--errors-only"],
			project: fixture("ignore-all"),
		});

		assert.equal(result.exitCode, 0);
		assert.equal(result.stdout, "");
		assert.equal(result.stderr, "");
	});

	await t.test("without a lockfile", () => {
		const lockfile = path.join(root, "test", "fixtures", "no-lockfile", "package-lock.json");
		fs.rmSync(lockfile, { force: true });

		const result = cli({
			args: [],
			project: fixture("no-lockfile"),
		});

		assert.equal(result.exitCode, 0);
	});
});

const root = path.resolve(
	path.dirname(fileURLToPath(new URL(import.meta.url))),
	"..",
);

function fixture(name) {
	return path.join(root, "test", "fixtures", name);
}

function cli({ args, project }) {
	// Ensure the project to test exists.
	assert.doesNotThrow(() => fs.accessSync(project), `${project} not found`);

	// Run the command.
	const result = cp.spawnSync(
		process.argv[0],
		[
			path.join(root, "bin", "cli.js"),

			// Provide test-specified CLI arguments, if any.
			...(args || []),
		],
		{
			// Run depreman in the test-specified directory.
			cwd: project,

			// Get output as text instead of a buffer.
			encoding: "utf-8",
		},
	);

	// Ensure running the command did not fail.
	assert.ok(!result.error, "Starting depreman failed");

	return {
		exitCode: result.status,
		stdout: result.stdout,
		stderr: result.stderr,
	};
}
