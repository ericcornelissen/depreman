// Copyright (C) 2024-2025  Eric Cornelissen
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

import * as cp from "node:child_process";
import * as fs from "node:fs/promises";
import { argv, exit, stdout, stderr } from "node:process";

import chalk from "chalk";

import { getConfiguration } from "./config.js";
import { getDeprecatedPackages } from "./deprecations.js";
import { removeIgnored, unusedIgnores } from "./ignores.js";
import { printAndExit } from "./output.js";
import { parseArgv } from "./cli.js";

const EXIT_CODE_SUCCESS = 0;
const EXIT_CODE_FAILURE = 1;
const EXIT_CODE_UNEXPECTED = 2;

const cliConfig = parseArgv(argv);
if (cliConfig.isErr()) {
	stderr.write(`${cliConfig.error()}\n`);
	exit(EXIT_CODE_UNEXPECTED);
}

const {
	help,
	everything,
	omitDev,
	omitOptional,
	omitPeer,
	reportUnused,
} = cliConfig.value();

if (help) {
	stdout.write(`depreman [-h|--help] [--errors-only] [--report-unused]
         [--omit=<dev|optional|peer> ...]

Manage npm deprecation.  Create an '.ndmrc' file with a JSON-based configuration
to ignore npm deprecation warnings for your dependencies.

   -h, --help
      Show this help message.
   --errors-only
      Only output deprecation warnings that are not ignored.
   --omit=<dev|optional|peer>
      Omit deprecation warnings for development, optional, or peer dependencies.
   --report-unused
      Report and fail for unused ignore directives.
`);
	exit(EXIT_CODE_SUCCESS);
}

let exitCode = EXIT_CODE_SUCCESS;
try {
	const options = { omitDev, omitOptional, omitPeer };
	const [config, deprecations] = await Promise.all([
		getConfiguration(fs),
		getDeprecatedPackages({ cp, fs, options }),
	]);

	const result = removeIgnored(config, deprecations);
	const unused = reportUnused ? unusedIgnores(config) : [];
	const { ok, report } = printAndExit(result, unused, { everything }, chalk);
	if (!ok) {
		exitCode = EXIT_CODE_FAILURE;
	}
	if (report) {
		stdout.write(`${report}\n`);
	}
} catch (error) {
	stderr.write(`error: ${error.message}\n`);
	exitCode = EXIT_CODE_UNEXPECTED;
}

exit(exitCode);
