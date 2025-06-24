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

import { mock } from "node:test";

import { Err, Ok } from "./result.js";

export class FS {
	/**
	 * @param {{[key: string]: string}} files
	 */
	constructor(files) {
		this.access = mock.fn((path) => {
			const access = Object.hasOwn(files, path);
			return Promise.resolve(access);
		});
		this.readFile = mock.fn((filepath) => {
			if (!Object.hasOwn(files, filepath)) {
				const error = new Err("file not found");
				return Promise.resolve(error);
			}

			const content = files[filepath];
			const result = new Ok(content);
			return Promise.resolve(result);
		});
	}
}

/** @typedef {import("./fs.js").ReadFS} ReadFS */
