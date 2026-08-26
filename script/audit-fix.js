// MIT No Attribution
//
// Copyright 2026 Eric Cornelissen
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

import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Bump dependencies with known vulnerabilities.
try {
	execSync("npm audit fix");
} catch {
	// Ignore failures, which may occur when only some but not all vulnerabilities
	// could be fixed. In this case we still want to perform the rest of these
	// steps.
}

// Restore direct runtime dependencies.
const packageJson = resolve(import.meta.dirname, "..", "package.json");
const manifest = JSON.parse(await readFile(packageJson));
for (const [dependency, version] of Object.entries(manifest.dependencies)) {
	execSync(`npm install --save-exact ${dependency}@${version.slice(1)}`);
}
await writeFile(packageJson, `${JSON.stringify(manifest, null, 2)}\n`);

// Sync manifest and lockfile.
execSync("npm install");
