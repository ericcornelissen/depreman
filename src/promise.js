// Copyright (C) 2026  Eric Cornelissen
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
 * @template T
 * @param {number} maximum
 * @param {function(T[])} finished
 * @returns {function(function(): Promise<T>)}
 */
function createPool(maximum, finished) {
	let n = 0; // eslint-disable-line functional/no-let

	const queue = [];
	const results = [];

	return async function enqueue(callback) {
		if (maximum <= n) {
			queue.push(callback);
			return;
		}

		n += 1;
		do {
			const result = await callback(); // eslint-disable-line no-await-in-loop
			results.push(result);
			callback = queue.pop()
		} while (callback !== undefined);
		n -= 1;

		finished(results);
	};
}

/**
 * @template T
 * @param {number} size
 * @returns {PromisePool<T>}
 */
function pool(size) {
	const CREATED = 0, STARTED = 1, PENDING = 2, DONE = 3;
	let state = CREATED; // eslint-disable-line functional/no-let

	const { promise, resolve } = withResolvers();
	const enqueue = createPool(size, (results) => {
		resolve(results);
	});

	return {
		add(callback) {
			if (state === CREATED) {
				state = STARTED;
			}

			if (state !== STARTED) {
				throw new Error("cannot add to an awaited pool"); // eslint-disable-line functional/no-throw-statements
			}

			enqueue(callback);
		},
		async await() {
			if (state === CREATED) {
				state = DONE;
				return [];
			}

			if (state !== STARTED) {
				throw new Error("cannot await a pool multiple times"); // eslint-disable-line functional/no-promise-reject, functional/no-throw-statements
			}

			state = PENDING;
			return await promise;
		},
	};
}

/**
 * @returns {Resolver}
 */
function withResolvers() {
	const result = Object.create(null);
	result.promise = new Promise((resolve, reject) => { // eslint-disable-line functional/no-promise-reject
	  result.resolve = resolve;
	  result.reject = reject;
	});

	return result;
}

const promise = {
	pool,
	withResolvers
};

export { promise as Promise };

/**
 * @template T
 * @typedef PromisePool
 * @property {function(): Promise<T>} add
 * @property {Promise<T[]>} await
 */

/**
 * @typedef Resolver
 * @property {Promise} promise
 * @property {function(): void} resolve
 * @property {function(): void} reject
 */
