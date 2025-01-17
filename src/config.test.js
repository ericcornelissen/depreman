// Copyright (C) 2024  Eric Cornelissen
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
import { mock, test } from "node:test";

import {
	readConfig,
} from "./config.js";

test("config.js", async (t) => {
	await t.test("readConfig", async (t) => {
		const testCases = {
			"empty config": {
				config: {},
			},
			"sample config": {
				config: {
					"package@1.0.0": {
						"#ignore": true,
					},
				},
			},
			"unexpected config": {
				config: [
					"even though it shouldn't be an array",
					"in this part of the code that is not",
					"considered a problem",
				],
			},
		};

		for (const [name, testCase] of Object.entries(testCases)) {
			await t.test(name, async () => {
				const fs = createFs({ "./.ndmrc": JSON.stringify(testCase.config) });

				const got = await readConfig(fs);
				const want = testCase.config;
				assert.deepEqual(got, want);
			});
		}

		await t.test("usage of fs.readFile", async () => {
			const fs = createFs({ "./.ndmrc": JSON.stringify("{}") });

			try {
				await readConfig(fs);
			} catch (_) { }

			assert.equal(fs.readFile.mock.callCount(), 1);

			const got = fs.readFile.mock.calls[0];
			assert.ok(got.arguments.length >= 1);
			assert.match(got.arguments[0], /.ndmrc$/);
		});

		await t.test("config not in JSON format", async () => {
			const fs = createFs({ "./.ndmrc": "I'm not valid JSON" });

			await assert.rejects(
				async () => {
					await readConfig(fs);
				},
				(error) => {
					assert.ok(error instanceof Error);
					assert.match(
						error.message,
						/^Configuration file invalid \(.+?\)$/,
					);

					return true;
				},
			);
		});

		await t.test("file not found", async () => {
			const fs = createFs({});

			await assert.rejects(
				async () => {
					await readConfig(fs);
				},
				(error) => {
					assert.ok(error instanceof Error);
					assert.equal(
						error.message,
						"Configuration file .ndmrc not found",
					);

					return true;
				},
			);
		});
	});
});

function createFs(files) {
	return {
		readFile: mock.fn((path, _options) => {
			if (Object.hasOwn(files, path)) {
				const content = files[path];
				return Buffer.from(content);
			} else {
				throw new Error();
			}
		}),
	};
}
