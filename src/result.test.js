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

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";

import * as fc from "fast-check";

import { None } from "./option.js";
import { Err, Ok } from "./result.js";

test("result.js", (t) => {
	const arbitrary = {
		err: () => fc.anything().map((err) => new Err(err)),
		ok: () => fc.anything().map((value) => new Ok(value)),
	};

	t.test("Err", (t) => {
		t.test("and", (t) => {
			t.test("Err", () => {
				fc.assert(
					fc.property(
						arbitrary.err(),
						arbitrary.err(),
						(errA, errB) => {
							const got = errA.and(errB);
							const want = errA;
							assert.equal(got, want);
						}
					),
				);
			});

			t.test("Ok", () => {
				fc.assert(
					fc.property(
						arbitrary.err(),
						arbitrary.ok(),
						(err, ok) => {
							const got = err.and(ok);
							const want = err;
							assert.equal(got, want);
						}
					),
				);
			});
		});

		t.test("andThen", (t) => {
			t.test("return value", (t) => {
				t.test("Err", () => {
					fc.assert(
						fc.property(
							arbitrary.err(),
							arbitrary.err(),
							(errA, errB) => {
								const got = errA.andThen(() => errB);
								const want = errA;
								assert.equal(got, want);
							}
						),
					);
				});

				t.test("Ok", () => {
					fc.assert(
						fc.property(
							arbitrary.err(),
							arbitrary.ok(),
							(err, ok) => {
								const got = err.andThen(() => ok);
								const want = err;
								assert.equal(got, want);
							}
						),
					);
				});
			});

			t.test("callback", () => {
				fc.assert(
					fc.property(arbitrary.err(), (err) => {
						const callback = mock.fn();

						err.andThen(callback);
						assert.equal(callback.mock.calls.length, 0);
					}),
				);
			});
		});

		t.test("error", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const err = new Err(value);

					const got = err.error();
					const want = value;
					assert.equal(got, want);
				}),
			);
		});

		t.test("isErr", () => {
			fc.assert(
				fc.property(arbitrary.err(), (err) => {
					const got = err.isErr();
					const want = true;
					assert.equal(got, want);
				}),
			);
		});

		t.test("isOk", () => {
			fc.assert(
				fc.property(arbitrary.err(), (err) => {
					const got = err.isOk();
					const want = false;
					assert.equal(got, want);
				}),
			);
		});

		t.test("map", (t) => {
			t.test("return value", () => {
				fc.assert(
					fc.property(
						arbitrary.err(),
						fc.anything(),
						(err, mapped) => {
							const got = err.map(() => mapped);
							assert.equal(got, err);
						},
					),
				);
			});

			t.test("callback", () => {
				fc.assert(
					fc.property(arbitrary.err(), (err) => {
						const callback = mock.fn();

						err.map(callback);
						assert.equal(callback.mock.calls.length, 0);
					}),
				);
			});
		});

		t.test("mapErr", (t) => {
			t.test("return value", () => {
				fc.assert(
					fc.property(
						arbitrary.err(),
						fc.anything(),
						(err, mapped) => {
							const got = err.mapErr(() => mapped);
							assert.ok(got.isErr());

							const value = got.error();
							assert.equal(value, mapped);
						},
					),
				);
			});

			t.test("callback", () => {
				fc.assert(
					fc.property(fc.anything(), (value) => {
						const callback = mock.fn();

						const err = new Err(value);
						err.mapErr(callback);
						assert.equal(callback.mock.calls.length, 1);

						const call = callback.mock.calls[0];
						assert.equal(call.arguments.length, 1);
						assert.equal(call.arguments[0], value);
					}),
				);
			});
		});

		t.test("ok", () => {
			fc.assert(
				fc.property(arbitrary.err(), (err) => {
					const got = err.ok();
					const want = None;
					assert.equal(got, want);
				}),
			);
		});

		t.test("value", () => {
			fc.assert(
				fc.property(arbitrary.err(), (err) => {
					assert.throws(
						() => err.value(),
						{
							name: "TypeError",
							message: typeof err.error() === "string"
								? err.error()
								: "Err has no value",
						},
					);
				}),
			);
		});
	});

	t.test("Ok", (t) => {
		t.test("and", (t) => {
			t.test("Err", () => {
				fc.assert(
					fc.property(
						arbitrary.ok(),
						arbitrary.err(),
						(ok, err) => {
							const got = ok.and(err);
							const want = err;
							assert.equal(got, want);
						}
					),
				);
			});

			t.test("Ok", () => {
				fc.assert(
					fc.property(
						arbitrary.ok(),
						arbitrary.ok(),
						(okA, okB) => {
							const got = okA.and(okB);
							const want = okB;
							assert.equal(got, want);
						}
					),
				);
			});
		});

		t.test("andThen", (t) => {
			t.test("return value", (t) => {
				t.test("Err", () => {
					fc.assert(
						fc.property(
							arbitrary.ok(),
							arbitrary.err(),
							(ok, err) => {
								const got = ok.andThen(() => err);
								const want = err;
								assert.equal(got, want);
							}
						),
					);
				});

				t.test("Ok", () => {
					fc.assert(
						fc.property(
							arbitrary.ok(),
							arbitrary.ok(),
							(okA, okB) => {
								const got = okA.andThen(() => okB);
								const want = okB;
								assert.equal(got, want);
							}
						),
					);
				});
			});

			t.test("callback", () => {
				fc.assert(
					fc.property(fc.anything(), (value) => {
						const callback = mock.fn();

						const ok = new Ok(value);
						ok.andThen(callback);
						assert.equal(callback.mock.calls.length, 1);

						const call = callback.mock.calls[0];
						assert.equal(call.arguments.length, 1);
						assert.equal(call.arguments[0], value);
					}),
				);
			});
		});

		t.test("error", () => {
			fc.assert(
				fc.property(arbitrary.ok(), (ok) => {
					assert.throws(
						() => ok.error(),
						{
							name: "TypeError",
							message: "Ok has no error",
						},
					);
				}),
			);
		});

		t.test("isErr", () => {
			fc.assert(
				fc.property(arbitrary.ok(), (ok) => {
					const got = ok.isErr();
					const want = false;
					assert.equal(got, want);
				}),
			);
		});

		t.test("isOk", () => {
			fc.assert(
				fc.property(arbitrary.ok(), (ok) => {
					const got = ok.isOk();
					const want = true;
					assert.equal(got, want);
				}),
			);
		});

		t.test("map", (t) => {
			t.test("return value", () => {
				fc.assert(
					fc.property(
						arbitrary.ok(),
						fc.anything(),
						(ok, mapped) => {
							const got = ok.map(() => mapped);
							assert.ok(got.isOk());

							const value = got.value();
							assert.equal(value, mapped);
						},
					),
				);
			});

			t.test("callback", () => {
				fc.assert(
					fc.property(fc.anything(), (value) => {
						const callback = mock.fn();

						const ok = new Ok(value);
						ok.map(callback);
						assert.equal(callback.mock.calls.length, 1);

						const call = callback.mock.calls[0];
						assert.equal(call.arguments.length, 1);
						assert.equal(call.arguments[0], value);
					}),
				);
			});
		});

		t.test("mapErr", (t) => {
			t.test("return value", () => {
				fc.assert(
					fc.property(
						arbitrary.ok(),
						fc.anything(),
						(ok, mapped) => {
							const got = ok.mapErr(() => mapped);
							assert.equal(got, ok);
						},
					),
				);
			});

			t.test("callback", () => {
				fc.assert(
					fc.property(arbitrary.ok(), (ok) => {
						const callback = mock.fn();

						ok.mapErr(callback);
						assert.equal(callback.mock.calls.length, 0);
					}),
				);
			});
		});

		t.test("ok", () => {
			fc.assert(
				fc.property(arbitrary.ok(), (ok) => {
					const some = ok.ok();
					assert.ok(some.isSome());

					const got = some.value();
					const want = ok.value();
					assert.equal(got, want);
				}),
			);
		});

		t.test("value", () => {
			fc.assert(
				fc.property(fc.anything(), (value) => {
					const ok = new Ok(value);

					const got = ok.value();
					const want = value;
					assert.equal(got, want);
				}),
			);
		});
	});
});
