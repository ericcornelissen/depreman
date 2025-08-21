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

import * as nodeCp from "node:child_process";
import * as nodeFs from "node:fs/promises";
import { stdout, stderr } from "node:process";

import { parseArgv } from "./cli.js";
import { getConfiguration } from "./config.js";
import { CP } from "./cp.js";
import { getDeprecatedPackages } from "./deprecations.js";
import { FS } from "./fs.js";
import { removeIgnored, unusedIgnores } from "./ignores.js";
import { NPM } from "./npm.js";
import { printAndExit } from "./output.js";
import * as style from "./style.js";
import { Yarn } from "./yarn.js";

const EXIT_CODE_SUCCESS = 0;
const EXIT_CODE_FAILURE = 1;
const EXIT_CODE_UNEXPECTED = 2;

/**
 * @returns {void}
 */
function help() {
	stdout.write(`depreman [-h|--help] [--errors-only] [--report-unused]
         [--omit=<dev|optional|peer> ...] [--package-manager=<npm|yarn>]

Manage deprecation warnings. Create an '.ndmrc' file with a JSON-based config
to ignore deprecation warnings for your dependencies.

   -h, --help
      Show this help message.
   --errors-only
      Only output deprecation warnings that are not ignored.
   --omit=<dev|optional|peer>
      Omit deprecation warnings for development, optional, or peer dependencies.
   --package-manager=<npm|yarn>
      Which package manager to use, 'npm' (default) or 'yarn'.
   --report-unused
      Report and fail for unused ignore directives.

Need more help? Found a bug? Missing something? See:
https://github.com/ericcornelissen/depreman/issues/new/choose
`);
}

/**
 * @param {Options} options
 * @returns {Promise<ExitCode>}
 */
async function depreman(options) {
	try {
		const cp = new CP(nodeCp);
		const fs = new FS(nodeFs);
		const pm = options.packageManager === "yarn"
			? new Yarn({ cp, options })
			: new NPM({ cp, fs, options });

		const [config, deprecations] = await Promise.all([
			getConfiguration(fs),
			getDeprecatedPackages(pm),
		]);

		if (deprecations.and(config).isErr()) {
			throw new Error(deprecations.and(config).error());
		}

		const result = removeIgnored(config.value(), deprecations.value());
		const unused = options.reportUnused ? unusedIgnores(config.value()) : [];
		const { ok, report } = printAndExit(result, unused, options, style.create());
		if (report) {
			stdout.write(`${report}\n`);
		}

		return ok ? EXIT_CODE_SUCCESS : EXIT_CODE_FAILURE;
	} catch (error) {
		stderr.write(`error: ${error.message}\n`);
		return EXIT_CODE_UNEXPECTED;
	}
}

/**
 * @param {string[]} argv
 * @returns {Promise<ExitCode>}
 */
export async function cli(argv) {
	const options = parseArgv(argv);
	if (options.isErr()) {
		stderr.write(`${options.error()}\n`);
		return EXIT_CODE_UNEXPECTED;
	}

	if (options.value().help) {
		help();
		return EXIT_CODE_SUCCESS;
	}

	return await depreman(options.value());
}

/** @typedef {import("./cli.js").Config} Options */
/** @typedef {0 | 1 | 2} ExitCode */
