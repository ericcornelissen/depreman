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

import semverSatisfies from "semver/functions/satisfies.js";

import * as date from "./date.js";

export function removeIgnored(config, deprecations) {
	const result = [];
	for (const pkg of deprecations) {
		const kept = [], ignored = []
		for (const path of pkg.paths) {
			const ignore = isIgnored(config, path);
			if (!!ignore) {
				ignored.push({
					path,
					reason: typeof ignore === "string" ? ignore : null,
				});
			} else {
				kept.push({ path });
			}
		}

		result.push({
			name: pkg.name,
			version: pkg.version,
			reason: pkg.reason,
			ignored,
			kept,
		});
	}

	return result;
}

function isIgnored(config, path) {
	if (path.length === 0) {
		const decision = config["#ignore"];
		if (!!decision) {
			const expire = config["#expire"];
			if (expire !== undefined) {
				const expires = date.parse(expire);
				const today = date.today();
				if (expires.isBefore(today) || expires.is(today)) {
					return false;
				}
			}

			return typeof decision === "string" ? decision : true;
		} else {
			return false;
		}
	}

	const [current, ...remaining] = path;
	for (const rule in config) {
		if (rule.startsWith("#")) {
			continue;
		}

		if (rule === "*") {
			const reason = isIgnored(config, remaining) || isIgnored(config[rule], remaining);
			if (!!reason) {
				return reason;
			} else {
				continue;
			}
		}

		const [name, version] = parseRule(rule);
		if (name === current.name && semverSatisfies(current.version, version)) {
			const reason = isIgnored(config[rule], remaining);
			if (!!reason) {
				return reason;
			}
		}
	}

	return false;
}

function parseRule(pkg) {
	const i = pkg.lastIndexOf("@");
	if (i === -1) {
		throw new Error(`invalid rule name '${pkg}'`);
	}

	const name = pkg.substring(0, i);
	const version = pkg.substring(i + 1, /* end */);
	return [name, version];
}
