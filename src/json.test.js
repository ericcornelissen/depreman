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

import { parseJSON } from "./json.js";

test("json.js", (t) => {
	t.test("parseJSON", (t) => {
		t.test("json", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.array(fc.anything()),
						fc.object(),
					),
					(value) => {
						const json = JSON.stringify(value);
						const got = parseJSON(json);
						assert.ok(got.isOk());
					},
				),
			);
		});

		t.test("non-json", () => {
			fc.assert(
				fc.property(fc.string(), (value) => {
					let parsed = false;
					try {
						JSON.parse(value);
						parsed = true;
					} catch {
						// Nothing to do
					}

					if (parsed) {
						fc.pre(false);
					}

					const got = parseJSON(value);
					assert.ok(got.isErr());
				}),
			);
		});
	});
});
