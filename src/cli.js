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

import { argv, exit } from "node:process";

import { readConfig } from "./config.js";
import { obtainDeprecations } from "./deprecations.js";
import { obtainDependencyPaths } from "./hierarchy.js";
import { removeIgnored } from "./ignores.js";
import { printAndExit } from "./output.js";

const complete = argv.includes("--complete");

try {
	const [config, deprecations] = await Promise.all([
		readConfig(),
		obtainDeprecations().then(obtainDependencyPaths),
	]);

	const result = removeIgnored(config, deprecations);
	printAndExit(result, { complete });
} catch (error) {
	console.error("error:", error.message);
	exit(2);
}
