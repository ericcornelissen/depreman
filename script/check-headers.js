// MIT No Attribution
//
// Copyright 2024-2025 Eric Cornelissen
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this
// software and associated documentation files (the "Software"), to deal in the Software
// without restriction, including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as console from "node:console";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";

const ignore = [
	"bin/cli.js",
	"node_modules",
	"script",
	"test/fixtures",
	".eslintrc.js",
	".stryker.js",
];

const header = `
// Copyright (C) <YEAR>  <AUTHORS>
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
`.trimStart();

let hasViolation = false;
for await (const entry of jsFiles(".", ignore)) {
	const result = await hasLicenseHeader(entry);
	if (!result) {
		console.log("Missing/incorrect license header in:", entry);
		hasViolation = true;
	}
}

if (hasViolation) {
	process.exit(1);
} else {
	console.log("No problems detected");
}

// -----------------------------------------------------------------------------

async function hasLicenseHeader(entry) {
	const content = await fs.readFile(entry, { encoding: "utf-8" });
	return content
		.replace(/^\/\/ Copyright \(C\) \d+(?:-\d+)? {2}.+$/mu, "// Copyright (C) <YEAR>  <AUTHORS>")
		.startsWith(`${header}\n`);
}

async function* jsFiles(dir, exclude) {
	for (let entry of await fs.readdir(dir)) {
		entry = path.join(dir, entry);
		if (exclude.includes(entry)) {
			continue;
		}

		if ((await fs.stat(entry)).isFile()) {
			if (path.extname(entry) === ".js") {
				yield entry;
			}
		} else {
			yield * await jsFiles(entry, exclude);
		}
	}
}
