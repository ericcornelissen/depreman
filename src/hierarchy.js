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

import { runSync } from "./command.js";

export function obtainDependencyPaths(packages) {
	const hierarchy = obtainHierarchy();

	const result = [];
	for (const pkg of packages) {
		result.push({
			...pkg,
			paths: findEach(hierarchy, pkg),
		});
	}

	return result;
}

function findEach(hierarchy, pkg, path=[]) {
	const found = [];
	if (hierarchy.dependencies) {
		for (const [name, info] of Object.entries(hierarchy.dependencies)) {
			const version = info.version;
			if (name === pkg.name && version === pkg.version) {
				found.push([...path, pkg]);
				continue;
			}

			found.push(...findEach(info, pkg, [...path, { name, version }]));
		}
	}

	return found;
}

function obtainHierarchy() {
	const { stdout } = runSync("npm list --all --json");
	return JSON.parse(stdout);
}
