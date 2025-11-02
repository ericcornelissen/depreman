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
import { debuglog } from "node:util";

import { parseArgv } from "./cli.js";
import { getConfiguration } from "./config.js";
import { CP } from "./cp.js";
import { getDeprecatedPackages } from "./deprecations.js";
import { FS } from "./fs.js";
import { removeIgnored, unusedIgnores } from "./ignores.js";
import { NPM } from "./npm.js";
import { Object } from "./object.js";
import { printAndExit } from "./output.js";
import * as style from "./style.js";
import { getVersions } from "./version.js";
import { Yarn } from "./yarn.js";

const EXIT_CODE_SUCCESS = 0;
const EXIT_CODE_FAILURE = 1;
const EXIT_CODE_UNEXPECTED = 2;

/**
 * @param {string[]} argv
 * @returns {Promise<ExitCode>}
 */
export async function cli(argv) {
	const debug = debuglog("depreman-cli");

	debug("parsing arguments");
	const options = parseArgv(argv);
	if (options.isErr()) {
		debug("parsing arguments failed");
		stderr.write(`${options.error()}\n`);
		return EXIT_CODE_UNEXPECTED;
	}

	debug("checking for --help");
	if (options.value().help) {
		debug("outputting help");
		return help();
	}

	debug("checking for --version");
	if (options.value().version) {
		debug("outputting version");
		return await versions();
	}

	debug("running depreman");
	return await depreman(options.value());
}

/**
 * @param {Options} options
 * @returns {Promise<ExitCode>}
 */
async function depreman(options) {
	const debug = debuglog("depreman");

	try {
		const cp = new CP(nodeCp);
		const fs = new FS(nodeFs);
		const pm = options.packageManager === "yarn"
			? new Yarn({ cp, options })
			: new NPM({ cp, fs, options });

		debug("getting config and deprecation warnings");
		const [config, deprecations] = await Promise.all([
			getConfiguration(fs),
			getDeprecatedPackages(pm),
		]);

		debug("checking for errors in config and deprecation warnings");
		if (deprecations.and(config).isErr()) {
			throw new Error(deprecations.and(config).error());
		}

		debug("removing ignored deprecation warnings");
		const result = removeIgnored(config.value(), deprecations.value());

		debug("collecting unused ignore directives", options.reportUnused);
		const unused = options.reportUnused ? unusedIgnores(config.value()) : [];

		debug("creating report and exit code");
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
 * @returns {ExitCode}
 */
function help() {
	stdout.write(`depreman [-h|--help] [--version] [--errors-only] [--report-unused]
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
   --version
      Show the version of depreman and relevant software.

Need more help? Found a bug? Missing something? See:
https://github.com/ericcornelissen/depreman/issues/new/choose
`);
	return EXIT_CODE_SUCCESS;
}

/**
 * @returns {Promise<ExitCode>}
 */
async function versions() {
	const cp = new CP(nodeCp);
	const fs = new FS(nodeFs);
	const info = await getVersions({ cp, fs });
	if (info.isErr()) {
		stderr.write(`could not get version: ${info.error()}\n`);
		return EXIT_CODE_UNEXPECTED;
	}

	for (const [what, version] of Object.entries(info.value())) {
		stdout.write(`${what}: ${version}\n`);
	}

	return EXIT_CODE_SUCCESS;
}

/** @typedef {0 | 1 | 2} ExitCode */

/** @import { Config as Options } from "./cli.js" */
