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

import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";

export async function obtainDependencyPaths(packages) {
	const [hierarchy, aliases] = await Promise.all([
		obtainHierarchy(),
		obtainAliases(),
	]);

	const result = [];
	for (const pkg of packages) {
		result.push({
			...pkg,
			paths: findEach(hierarchy, aliases, pkg),
		});
	}

	return result;
}

function findEach(hierarchy, aliases, pkg, path = []) {
	const found = [];
	if (hierarchy.dependencies) {
		for (const [_name, info] of Object.entries(hierarchy.dependencies)) {
			const alias = aliases.get(_name);
			const [name, version] = (
				alias === undefined
					? [_name, info.version]
					: [alias.name, alias.version]
			);

			if (name === pkg.name && version === pkg.version) {
				found.push([...path, pkg]);
			} else {
				found.push(
					...findEach(info, aliases, pkg, [...path, { name, version }]),
				);
			}

		}
	}

	return found;
}

async function obtainAliases() {
	const rawManifest = await readFile("./package.json", { encoding: "utf-8" });
	const manifest = JSON.parse(rawManifest);

	const aliases = new Map();
	for (const deps of [
		manifest.dependencies,
		manifest.devDependencies,
	]) {
		for (const name in deps) {
			const rhs = manifest.devDependencies[name];
			const aliasMatch = /^npm:(@?.+?)@(.+)$/.exec(rhs);
			if (aliasMatch) {
				const [, alias, version] = aliasMatch;
				aliases.set(name, { name: alias, version });
			}
		}
	}

	return aliases;
}

function obtainHierarchy() {
	return new Promise((resolve, reject) =>
		exec(
			"npm list --all --json",
			{ shell: false },
			(error, stdout) => {
				if (error) {
					reject(error);
				} else {
					const hierarchy = JSON.parse(stdout);
					delete hierarchy.dependencies[hierarchy.name];
					resolve(hierarchy);
				}
			},
		)
	);
}
