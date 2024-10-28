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

export function removeIgnored(config, deprecations) {
	const result = [];
	for (const pkg of deprecations) {
		const kept = [], ignored = []
		for (const path of pkg.paths) {
			const [ignore, rule] = isIgnored(config, path);
			if (ignore) {
				ignored.push({ rule, path });
			} else {
				kept.push(path);
			}
		}

		result.push({
			...pkg,
			ignored,
			kept,
		});
	}

	return result;
}

function isIgnored(config, path) {
	for (const rule of config) {
		for (const pkg of path) {
			const pkgId = `${pkg.name}@${pkg.version}`;
			if (pkgId !== rule.pkg) {
				continue;
			}

			if (rule.transitive) {
				return [true, rule];
			}

			if (path[path.length - 1] === pkg) {
				return [true, rule];
			}
		}
	}

	return [false, null];
}
