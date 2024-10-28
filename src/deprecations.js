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

import { run } from "./command.js";

export async function obtainDeprecations() {
	return new Promise((resolve, reject) => {
		const process = run("npm clean-install --no-audit --no-fund --no-update-notifier");

		const deprecations = [];

		process.stderr.on("data", (line) => {
			if (isDeprecationWarning(line)) {
				const deprecated = extractDeprecation(line);
				const details = parseDeprecation(deprecated);
				deprecations.push(details);
			}
		});

		process.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve(deprecations.filter(unique));
			} else {
				reject("execution failed");
			}
		});
	});
}

const prefix = Buffer.from("npm warn deprecated ");

function isDeprecationWarning(line) {
	return line.slice(0, prefix.length).equals(prefix);
}

function extractDeprecation(line) {
	return line.slice(prefix.length, line.length).toString();
}

function parseDeprecation(str) {
	let pkg, reason, name, version;

	{
		const i = str.indexOf(":");
		pkg = str.substring(0, i);
		reason = str.substring(i+1, /* end */).trim();
	}

	{
		const i = pkg.lastIndexOf("@");
		name = pkg.substring(0, i);
		version = pkg.substring(i+1, /* end */);
	}

	return { name, version, reason };
}

function unique(a, index, array) {
	return index === array.findIndex(b => a.name === b.name && a.version === b.version);
}
