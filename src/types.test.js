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

import { typeOf, types } from "./types.js";

test("types.js", (t) => {
	t.test("typeOf", (t) => {
		t.test("array", () => {
			fc.assert(
				fc.property(fc.array(fc.anything()), (array) => {
					const got = typeOf(array);
					const want = types.array;
					assert.equal(got, want);
				}),
			);
		});

		t.test("boolean", () => {
			const want = types.boolean;
			assert.equal(typeOf(true), want);
			assert.equal(typeOf(false), want);
		});

		t.test("null", () => {
			const got = typeOf(null);
			const want = types.null;
			assert.equal(got, want);
		});

		t.test("number", () => {
			fc.assert(
				fc.property(
					fc.oneof(fc.integer(), fc.float(), fc.double()),
					(number) => {
						const got = typeOf(number);
						const want = types.number;
						assert.equal(got, want);
					},
				),
			);
		});

		t.test("object", () => {
			fc.assert(
				fc.property(
					fc.object(),
					(object) => {
						const got = typeOf(object);
						const want = types.object;
						assert.equal(got, want);
					},
				),
			);
		});

		t.test("string", () => {
			fc.assert(
				fc.property(
					fc.string(),
					(string) => {
						const got = typeOf(string);
						const want = types.string;
						assert.equal(got, want);
					},
				),
			);
		});

		t.test("undefined", () => {
			const got = typeOf(undefined);
			const want = types.undefined;
			assert.equal(got, want);
		});
	});
});
