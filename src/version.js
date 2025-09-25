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

import * as path from "node:path";
import * as url from "node:url";

import { parseJSON } from "./json.js";
import { Err, Ok } from "./result.js";

/**
 * @param {object} p
 * @param {ExecCP} p.cp
 * @param {ReadFS} p.fs
 * @returns {Promise<Versions>}
 */
export async function getVersions({ cp, fs }) {
	const [depreman, node, npm, yarn] = await Promise.all([
		selfVersion(fs),
		nodeVersion(cp),
		npmVersion(cp),
		yarnVersion(cp),
	]);

	const err = node.and(depreman);
	if (err.isErr()) {
		return err;
	}

	if (yarn.or(npm).isNone()) {
		return new Err("no package manager found");
	}

	const result = {
		depreman: depreman.value(),
		node: node.value(),
	};

	if (npm.isSome()) {
		result.npm = npm.value();
	}

	if (yarn.isSome()) {
		result.yarn = yarn.value();
	}

	return new Ok(result);
}

/**
 * @param {ExecCP} cp
 * @returns {Promise<Result<Version, string>>}
 */
async function nodeVersion(cp) {
	const result = await cp.exec("node", ["--version"]);
	return result
		.map(({ stdout }) => stdout.slice(1).trim())
		.mapErr(({ stderr }) => stderr);
}

/**
 * @param {ExecCP} cp
 * @returns {Promise<Option<Version>>}
 */
async function npmVersion(cp) {
	const result = await cp.exec("npm", ["--version"]);
	return result.map(({ stdout }) => stdout.trim()).ok();
}

/**
 * @param {ExecCP} cp
 * @returns {Promise<Option<Version>>}
 */
async function yarnVersion(cp) {
	const result = await cp.exec("yarn", ["--version"]);
	return result.map(({ stdout }) => stdout.trim()).ok();
}

/**
 * @param {ReadFS} fs
 * @returns {Promise<Result<Version, string>>}
 */
async function selfVersion(fs) {
	const filepath = path.join(dirname(), "..", "package.json");
	const result = await fs.readFile(filepath);
	return result
		.andThen(raw => parseJSON(raw))
		.map(manifest => manifest.version);
}

/**
 * @returns {string}
 */
function dirname() {
	const scriptUrl = import.meta.url;
	const scriptPath = url.fileURLToPath(scriptUrl);
	return path.dirname(scriptPath);
}

/**
 * @typedef {string} Version
 */

/**
 * @typedef Versions
 * @property {Version} depreman
 * @property {Version} node
 * @property {Version} [npm]
 * @property {Version} [yarn]
 */

/** @import { ExecCP } from "./cp.js" */
/** @import { ReadFS } from "./fs.js" */
/** @import { Option } from "./option.js" */
/** @import { Result } from "./result.js" */
