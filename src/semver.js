// Copyright (C) 2025  Eric Cornelissen
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
import semverValid from "semver/functions/valid.js";
import semverValidRange from "semver/ranges/valid.js";

import { Err, Ok } from "./result.js";

/**
 * @param {string} version
 * @param {string} range
 * @returns {Result<boolean, string>}
 */
export function satisfies(version, range) {
	if (!semverValid(version)) {
		return new Err(`'${version}' is not a valid semver version`);
	}

	if (!semverValidRange(range)) {
		return new Err(`'${range}' is not a valid semver range`);
	}

	return new Ok(semverSatisfies(version, range));
}

/** @import { Result } from "./result.js" */
