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

import * as fs from "node:fs/promises";
import { argv, exit } from "node:process";

import { readConfig } from "./config.js";
import { obtainDeprecations } from "./deprecations.js";
import { obtainDependencyPaths } from "./hierarchy.js";
import { removeIgnored, unusedIgnores } from "./ignores.js";
import { printAndExit } from "./output.js";

const help = argv.includes("--help") || argv.includes("-h");
const everything = !(argv.includes("--errors-only"));
const reportUnused = argv.includes("--report-unused");

if (help) {
	console.log(`depreman [-h|--help] [--errors-only] [--report-unused]

Manage npm deprecation.  Create an '.ndmrc' file with a JSON-based configuration
to ignore npm deprecation warnings for your dependencies.

   -h, --help
      Show this help message.
   --errors-only
      Only output deprecations that are not ignored.
   --report-unused
      Report and fail for unused ignore directives.
`);
		exit(0);
}

try {
	const [config, deprecations] = await Promise.all([
		readConfig(fs),
		obtainDeprecations().then(obtainDependencyPaths),
	]);

	const result = removeIgnored(config, deprecations);
	const unused = reportUnused ? unusedIgnores(config) : [];
	printAndExit(result, unused, { everything });
} catch (error) {
	console.error("error:", error.message);
	exit(2);
}
