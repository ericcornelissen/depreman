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

/**
 * @param {FileSystem} fs
 * @returns {Promise<Config>}
 */
export async function getConfiguration(fs) {
	const rawConfig = await readConfigFile({ fs, file: "./.ndmrc" });
	const config = parseRawConfig(rawConfig);
	return config;
}

/**
 * @param {Object} p
 * @param {string} p.file
 * @param {FileSystem} p.fs
 * @returns {Promise<string>}
 */
async function readConfigFile({ file, fs }) {
	try {
		const content = await fs.readFile(file);
		return content;
	} catch {
		throw new Error("Configuration file .ndmrc not found");
	}
}

/**
 * @param {Object} p
 * @param {string} p.file
 * @param {FileSystem} p.fs
 * @returns {Config}
 */
function parseRawConfig(raw) {
	try {
		const parsed = JSON.parse(raw);
		return parsed;
	} catch (error) {
		throw new Error(`Configuration file invalid (${error.message})`);
	}
}

/**
 * @typedef {Object} Config
 * @property {boolean | string | undefined} '+'
 * @property {boolean | string | undefined} '*'
 * @property {Config} [key]
 */

/**
 * @typedef FileSystem
 * @property {ReadFile} readFile
 */

/** @typedef {function(string): Promise<string>} ReadFile */
