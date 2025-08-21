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
	create,
} from "./style.js";

test("style.js", (t) => {
	t.test("create", (t) => {
		t.test("dim", () => {
			fc.assert(
				fc.property(
					fc.string(),
					(msg) => {
						const styler = create();
						const got = styler.dim(msg);
						assert.ok(got.includes(msg));
					},
				),
			);
		});

		t.test("italic", () => {
			fc.assert(
				fc.property(
					fc.string(),
					(msg) => {
						const styler = create();
						const got = styler.italic(msg);
						assert.ok(got.includes(msg));
					},
				),
			);
		});
	});
});
