// MIT No Attribution
//
// Copyright 2024 Eric Cornelissen
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

import cp from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const manifestPath = path.resolve(".", "package.json");
const rawManifest = fs.readFileSync(manifestPath).toString();
const manifest = JSON.parse(rawManifest);
const runtimeDeps = manifest.dependencies;

const violations = Object.entries(runtimeDeps)
	.map(([dependency, supported]) => ({
		dependency,
		installed: getInstalledVersion(dependency),
		supported,
	}))
	.filter(({ installed, supported }) => !supported.endsWith(installed));

if (violations.length > 0) {
	violations.forEach(({ dependency, installed, supported }) => {
		console.log("Dependency:", dependency);
		console.log("  supported:", supported);
		console.log("  installed:", installed);
	});

	console.log("");
	console.log(
		violations.length,
		"violation(s) found.",
		"Update either the version range or installed version of each violation.",
	);

	process.exit(1);
} else {
	console.log("No problems detected");
}

// -----------------------------------------------------------------------------

function getInstalledVersion(dependency) {
	const stdout = cp.execSync(`npm ls --json  --depth 0  ${dependency}`);
	const dependenciesInfo = JSON.parse(stdout);
	const installed = dependenciesInfo.dependencies[dependency].version;
	return installed;
}
