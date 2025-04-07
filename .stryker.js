// Configuration file for StrykerJS (https://stryker-mutator.io/)

export default {
	coverageAnalysis: "perTest",
	inPlace: false,
	timeoutMS: 5_000,

	mutate: [
		"src/**/*.js",
		"!src/**/*.test.js",
		"!src/main.js",
	],

	testRunner: "tap",
	tap: {
		testFiles: ["src/*.test.js"],
		forceBail: true,
	},

	incremental: true,
	incrementalFile: "node_modules/.cache/stryker-incremental.json",

	reporters: ["clear-text", "html", "progress"],
	htmlReporter: {
		fileName: "mutation.html",
	},

	thresholds: {
		high: 100,
		low: 95,
		break: 95,
	},

	tempDirName: "node_modules/.temp/stryker",
	cleanTempDir: true,
};
