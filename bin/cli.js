#!/usr/bin/env node

import { argv, exit } from "node:process";

import { cli } from "../src/main.js";

const exitCode = await cli(argv);
exit(exitCode);
