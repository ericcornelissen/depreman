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

/**
 * @param {FileSystem} fs
 * @returns {Object}
 */
export async function readConfig(fs) {
	let rawConfig;
	try {
		rawConfig = await fs.readFile("./.ndmrc");
	} catch (_) {
		throw new Error("Configuration file .ndmrc not found");
	}

	try {
		return JSON.parse(rawConfig);
	} catch (error) {
		throw new Error(`Configuration file invalid (${error.message})`);
	}
}

/**
 * @typedef {function(string): Promise<string>} ReadFile
 */

/**
 * @typedef FileSystem
 * @property {ReadFile} readFile
 */
