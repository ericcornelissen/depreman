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

import { spawn, spawnSync } from "node:child_process";

export function run(command) {
	const _command = command.split(/\s+/g);
	const program = _command.shift();
	const args = _command;

	const process = spawn(program, args, {
		shell: false,
	});

	return process;
}

export function runSync(command) {
	const _command = command.split(/\s+/g);
	const program = _command.shift();
	const args = _command;

	const process = spawnSync(program, args, {
		shell: false,
	});

	return {
		exitCode: process.status,
		stdout: process.stdout,
		stderr: process.stderr,
	};
}
