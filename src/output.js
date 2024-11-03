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

import { exit } from "node:process";

import chalk from "chalk";

export function printAndExit(result, options) {
	let exitCode = 0;

	for (const pkg of result) {
		const id = pkgToString(pkg);
		if (pkg.kept.length > 0) {
			exitCode = 1;
			console.log(id, chalk.italic(`("${pkg.reason}"):`));
		} else if (options.everything) {
			console.log(chalk.dim(id));
		}

		for (const { path } of pkg.kept) {
			const msg = `\t. > ${path.map(pkgToString).join(" > ")}`;
			console.log(msg);
		}

		if (options.everything) {
			for (const { path, reason } of pkg.ignored) {
				const prefix = `(allowed "${typeof reason === "string" ? reason : "no reason given"}")`;
				const msg = `\t. > ${path.map(pkgToString).join(" > ")}\n\t\t${chalk.italic(prefix)}`;
				console.log(chalk.dim(msg));
			}
		}
	}

	exit(exitCode);
}

function pkgToString(pkg) {
	return `${pkg.name}@${pkg.version}`;
}
