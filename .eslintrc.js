// Configuration file for ESLint (https://eslint.org/)

import * as process from "node:process";

import json from "@eslint/json";
import markdown from "@eslint/markdown";
import depend from "eslint-plugin-depend";
import jsdoc from "eslint-plugin-jsdoc";
import regexp from "eslint-plugin-regexp";
import top from "@ericcornelissen/eslint-plugin-top";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";

export default [
	{
		name: "Code",
		files: ["**/*.js"],
		linterOptions: {
			reportUnusedDisableDirectives: "error",
			reportUnusedInlineConfigs: "error",
		},
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
		},
		plugins: {
			depend,
			jsdoc,
			regexp,
			top,
			unicorn,
		},
		rules: {
			...{
				"accessor-pairs": "error",
				"array-callback-return": "error",
				"arrow-body-style": "error",
				"block-scoped-var": "error",
				"camelcase": "error",
				"capitalized-comments": ["error", "always",{
					ignoreConsecutiveComments: true,
				}],
				"class-methods-use-this": "off",
				"complexity": "off",
				"consistent-return": "off",
				"consistent-this": "error",
				"constructor-super": "error",
				"curly": "error",
				"default-case-last": "error",
				"default-case": "error",
				"default-param-last": "error",
				"dot-notation": "error",
				"eqeqeq": "error",
				"for-direction": "error",
				"func-name-matching": "error",
				"func-names": "error",
				"func-style": ["error", "declaration"],
				"getter-return": "error",
				"grouped-accessor-pairs": "error",
				"guard-for-in": "error",
				"id-denylist": "error",
				"id-length": "off",
				"id-match": "error",
				"init-declarations": "error",
				"logical-assignment-operators": "error",
				"max-classes-per-file": "off",
				"max-depth": "off",
				"max-lines": "off",
				"max-lines-per-function": "error",
				"max-nested-callbacks": "error",
				"max-params": "off",
				"max-statements": "off",
				"new-cap": "error",
				"no-alert": "error",
				"no-array-constructor": "error",
				"no-async-promise-executor": "error",
				"no-await-in-loop": "error",
				"no-bitwise": "error",
				"no-caller": "error",
				"no-case-declarations": "error",
				"no-class-assign": "error",
				"no-compare-neg-zero": "error",
				"no-cond-assign": "error",
				"no-console": "error",
				"no-constant-binary-expression": "error",
				"no-constant-condition": "error",
				"no-const-assign": "error",
				"no-constructor-return": "error",
				"no-continue": "off",
				"no-control-regex": "error",
				"no-debugger": "error",
				"no-delete-var": "error",
				"no-div-regex": "error",
				"no-dupe-args": "error",
				"no-dupe-class-members": "error",
				"no-dupe-else-if": "error",
				"no-dupe-keys": "error",
				"no-duplicate-case": "error",
				"no-duplicate-imports": "error",
				"no-else-return": "error",
				"no-empty-character-class": "error",
				"no-empty-function": "error",
				"no-empty": "error",
				"no-empty-pattern": "error",
				"no-empty-static-block": "error",
				"no-eq-null": "error",
				"no-eval": "error",
				"no-ex-assign": "error",
				"no-extend-native": "error",
				"no-extra-bind": "error",
				"no-extra-boolean-cast": "error",
				"no-extra-label": "error",
				"no-fallthrough": "error",
				"no-func-assign": "error",
				"no-global-assign": "error",
				"no-implicit-coercion": "error",
				"no-implicit-globals": "error",
				"no-implied-eval": "error",
				"no-import-assign": "error",
				"no-inline-comments": "error",
				"no-inner-declarations": "error",
				"no-invalid-regexp": "error",
				"no-invalid-this": "error",
				"no-irregular-whitespace": "error",
				"no-iterator": "error",
				"no-labels": "error",
				"no-label-var": "error",
				"no-lone-blocks": "error",
				"no-lonely-if": "error",
				"no-loop-func": "error",
				"no-loss-of-precision": "error",
				"no-magic-numbers": ["error", {
					detectObjects: true,
					ignore: [-1, 0, 1],
				}],
				"no-misleading-character-class": "error",
				"no-multi-assign": "error",
				"no-multi-str": "error",
				"no-negated-condition": "error",
				"no-nested-ternary": "error",
				"no-new-func": "error",
				"no-new": "error",
				"no-new-native-nonconstructor": "error",
				"no-new-wrappers": "error",
				"no-nonoctal-decimal-escape": "error",
				"no-obj-calls": "error",
				"no-object-constructor": "error",
				"no-octal-escape": "error",
				"no-octal": "error",
				"no-param-reassign": "off",
				"no-plusplus": "error",
				"no-promise-executor-return": "error",
				"no-proto": "error",
				"no-prototype-builtins": "error",
				"no-redeclare": "error",
				"no-regex-spaces": "error",
				"no-restricted-exports": "error",
				"no-restricted-globals": "error",
				"no-restricted-imports": "error",
				"no-restricted-properties": "error",
				"no-restricted-syntax": "error",
				"no-return-assign": "error",
				"no-script-url": "error",
				"no-self-assign": "error",
				"no-self-compare": "error",
				"no-sequences": "error",
				"no-setter-return": "error",
				"no-shadow": "error",
				"no-shadow-restricted-names": ["error", {
					reportGlobalThis: true,
				}],
				"no-sparse-arrays": "error",
				"no-template-curly-in-string": "error",
				"no-ternary": "off",
				"no-this-before-super": "error",
				"no-throw-literal": "error",
				"no-unassigned-vars": "error",
				"no-undefined": "off",
				"no-undef-init": "error",
				"no-undef": "error",
				"no-underscore-dangle": "error",
				"no-unexpected-multiline": "error",
				"no-unmodified-loop-condition": "error",
				"no-unneeded-ternary": "error",
				"no-unreachable-loop": "error",
				"no-unreachable": "error",
				"no-unsafe-finally": "error",
				"no-unsafe-negation": "error",
				"no-unsafe-optional-chaining": "error",
				"no-unused-expressions": "error",
				"no-unused-labels": "error",
				"no-unused-private-class-members": "error",
				"no-unused-vars": "error",
				"no-use-before-define": "off",
				"no-useless-assignment": "error",
				"no-useless-backreference": "error",
				"no-useless-call": "error",
				"no-useless-catch": "error",
				"no-useless-computed-key": "error",
				"no-useless-concat": "error",
				"no-useless-constructor": "error",
				"no-useless-escape": "error",
				"no-useless-rename": "error",
				"no-useless-return": "error",
				"no-var": "error",
				"no-void": "error",
				"no-warning-comments": "error",
				"no-with": "error",
				"object-shorthand": "error",
				"one-var": "off",
				"operator-assignment": "error",
				"prefer-arrow-callback": "error",
				"prefer-const": "error",
				"prefer-destructuring": ["error", {
					"array": false,
					"object": true,
				}],
				"prefer-exponentiation-operator": "error",
				"prefer-named-capture-group": "error",
				"prefer-numeric-literals": "error",
				"prefer-object-has-own": "error",
				"prefer-object-spread": "error",
				"prefer-promise-reject-errors": "error",
				"prefer-regex-literals": "error",
				"prefer-rest-params": "error",
				"prefer-spread": "error",
				"prefer-template": "error",
				"radix": "error",
				"require-atomic-updates": "error",
				"require-await": "error",
				"require-unicode-regexp": "error",
				"require-yield": "error",
				"sort-imports": "off",
				"sort-keys": "off",
				"sort-vars": "off",
				"strict": "error",
				"symbol-description": "error",
				"unicode-bom": "error",
				"use-isnan": "error",
				"valid-typeof": "error",
				"vars-on-top": "error",
				"yoda": "error",
			},

			// eslint-plugin-depend
			...{
				"depend/ban-dependencies": ["error", {
					"allowed": ["eslint-plugin-unicorn"],
				}],
			},

			// eslint-plugin-jsdoc
			...{
				"jsdoc/check-access": "error",
				"jsdoc/check-alignment": "error",
				"jsdoc/check-indentation": [
					"error",
					{
						excludeTags: [
							"typedef",
						],
					},
				],
				"jsdoc/check-line-alignment": ["error", "never"],
				"jsdoc/check-param-names": [
					"error",
					{
						allowExtraTrailingParamDocs: false,
						checkDestructured: true,
						checkRestProperty: true,
						disableExtraPropertyReporting: false,
						enableFixer: false,
						useDefaultObjectProperties: true,
					},
				],
				"jsdoc/check-property-names": "error",
				"jsdoc/check-syntax": "error",
				"jsdoc/check-tag-names": "error",
				"jsdoc/check-types": [
					"error",
					{
						exemptTagContexts: [],
						noDefaults: false,
						unifyParentAndChildTypeChecks: false,
					},
				],
				"jsdoc/empty-tags": "error",
				"jsdoc/implements-on-classes": "error",
				"jsdoc/informative-docs": "error",
				"jsdoc/match-description": [
					"error",
					{
						mainDescription: "^$",
						tags: {
							param: "^$",
							returns: "^$",
							throws: "^$",
							yields: "^$",
						},
					},
				],
				"jsdoc/match-name": "off",
				"jsdoc/multiline-blocks": [
					"error",
					{
						noFinalLineText: true,
						noMultilineBlocks: false,
						noSingleLineBlocks: false,
						noZeroLineText: true,
						singleLineTags: [],
					},
				],
				"jsdoc/no-bad-blocks": [
					"error",
					{
						ignore: [],
						preventAllMultiAsteriskBlocks: true,
					},
				],
				"jsdoc/no-blank-block-descriptions": "error",
				"jsdoc/no-defaults": "error",
				"jsdoc/no-missing-syntax": "off",
				"jsdoc/no-multi-asterisks": [
					"error",
					{
						allowWhitespace: true,
						preventAtEnd: true,
						preventAtMiddleLines: true,
					},
				],
				"jsdoc/no-restricted-syntax": "off",
				"jsdoc/no-types": "off",
				"jsdoc/no-undefined-types": "error",
				"jsdoc/require-asterisk-prefix": ["error", "always"],
				"jsdoc/require-description-complete-sentence": "off",
				"jsdoc/require-description": "off",
				"jsdoc/require-example": "off",
				"jsdoc/require-file-overview": "off",
				"jsdoc/require-hyphen-before-param-description": "off",
				"jsdoc/require-jsdoc": [
					"error",
					{
						publicOnly: false,
						require: {
							ArrowFunctionExpression: false,
							ClassDeclaration: false,
							ClassExpression: false,
							FunctionDeclaration: true,
							FunctionExpression: false,
							MethodDefinition: true,
						},
					},
				],
				"jsdoc/require-param": "error",
				"jsdoc/require-param-description": "off",
				"jsdoc/require-param-name": "error",
				"jsdoc/require-param-type": "error",
				"jsdoc/require-property": "error",
				"jsdoc/require-property-description": "off",
				"jsdoc/require-property-name": "error",
				"jsdoc/require-property-type": "error",
				"jsdoc/require-returns": [
					"error",
					{
						checkConstructors: false,
						checkGetters: true,
						exemptedBy: [],
						forceRequireReturn: true,
						forceReturnsWithAsync: true,
					},
				],
				"jsdoc/require-returns-check": [
					"error",
					{
						exemptGenerators: true,
						exemptAsync: false,
						reportMissingReturnForUndefinedTypes: false,
					},
				],
				"jsdoc/require-returns-description": "off",
				"jsdoc/require-returns-type": "error",
				"jsdoc/require-throws": "error",
				"jsdoc/require-yields": [
					"error",
					{
						exemptedBy: [],
						forceRequireNext: false,
						forceRequireYields: true,
						next: false,
						nextWithGeneratorTag: false,
						withGeneratorTag: false,
					},
				],
				"jsdoc/require-yields-check": [
					"error",
					{
						checkGeneratorsOnly: false,
						next: false,
					},
				],
				"jsdoc/sort-tags": "error",
				"jsdoc/tag-lines": [
					"error",
					"any",
					{
						endLines: 0,
						startLines: 1,
					},
				],
				"jsdoc/text-escaping": "off",
				"jsdoc/valid-types": "error",
			},

			// eslint-plugin-regexp
			...{
				"regexp/confusing-quantifier": "error",
				"regexp/control-character-escape": "error",
				"regexp/grapheme-string-literal": "error",
				"regexp/hexadecimal-escape": ["error", "never"],
				"regexp/letter-case": [
					"error",
					{
						caseInsensitive: "lowercase",
						controlEscape: "lowercase",
						hexadecimalEscape: "uppercase",
						unicodeEscape: "uppercase",
					},
				],
				"regexp/match-any": [
					"error",
					{
						allows: ["[^]", "dotAll"],
					},
				],
				"regexp/negation": "error",
				"regexp/no-contradiction-with-assertion": "error",
				"regexp/no-control-character": "error",
				"regexp/no-dupe-characters-character-class": "error",
				"regexp/no-dupe-disjunctions": [
					"error",
					{
						report: "all",
						reportExponentialBacktracking: "potential",
						reportUnreachable: "potential",
					},
				],
				"regexp/no-empty-alternative": "error",
				"regexp/no-empty-capturing-group": "error",
				"regexp/no-empty-character-class": "error",
				"regexp/no-empty-group": "error",
				"regexp/no-empty-lookarounds-assertion": "error",
				"regexp/no-empty-string-literal": "error",
				"regexp/no-escape-backspace": "error",
				"regexp/no-extra-lookaround-assertions": "error",
				"regexp/no-invalid-regexp": "error",
				"regexp/no-invisible-character": "error",
				"regexp/no-lazy-ends": [
					"error",
					{
						ignorePartial: false,
					},
				],
				"regexp/no-legacy-features": "error",
				"regexp/no-misleading-capturing-group": [
					"error",
					{
						reportBacktrackingEnds: true,
					},
				],
				"regexp/no-misleading-unicode-character": [
					"error",
					{
						fixable: false,
					},
				],
				"regexp/no-missing-g-flag": [
					"error",
					{
						strictTypes: true,
					},
				],
				"regexp/no-non-standard-flag": "error",
				"regexp/no-obscure-range": [
					"error",
					{
						allowed: "alphanumeric",
					},
				],
				"regexp/no-octal": "error",
				"regexp/no-optional-assertion": "error",
				"regexp/no-potentially-useless-backreference": "error",
				"regexp/no-standalone-backslash": "error",
				"regexp/no-super-linear-backtracking": [
					"error",
					{
						report: "potential",
					},
				],
				"regexp/no-super-linear-move": [
					"error",
					{
						ignoreSticky: false,
						report: "potential",
					},
				],
				"regexp/no-trivially-nested-assertion": "error",
				"regexp/no-trivially-nested-quantifier": "error",
				"regexp/no-unused-capturing-group": [
					"error",
					{
						allowNamed: false,
						fixable: false,
					},
				],
				"regexp/no-useless-assertions": "error",
				"regexp/no-useless-backreference": "error",
				"regexp/no-useless-character-class": "error",
				"regexp/no-useless-dollar-replacements": "error",
				"regexp/no-useless-escape": "error",
				"regexp/no-useless-flag": "error",
				"regexp/no-useless-lazy": "error",
				"regexp/no-useless-non-capturing-group": "error",
				"regexp/no-useless-quantifier": "error",
				"regexp/no-useless-range": "error",
				"regexp/no-useless-set-operand": "error",
				"regexp/no-useless-string-literal": "error",
				"regexp/no-useless-two-nums-quantifier": "error",
				"regexp/no-zero-quantifier": "error",
				"regexp/optimal-lookaround-quantifier": "error",
				"regexp/optimal-quantifier-concatenation": [
					"error",
					{
						capturingGroups: "report",
					},
				],
				"regexp/prefer-character-class": [
					"error",
					{
						minAlternatives: 2,
					},
				],
				"regexp/prefer-d": [
					"error",
					{
						insideCharacterClass: "range",
					},
				],
				"regexp/prefer-escape-replacement-dollar-char": "error",
				"regexp/prefer-lookaround": [
					"error",
					{
						lookbehind: true,
						strictTypes: true,
					},
				],
				"regexp/prefer-named-backreference": "error",
				"regexp/prefer-named-capture-group": "error",
				"regexp/prefer-named-replacement": "error",
				"regexp/prefer-plus-quantifier": "error",
				"regexp/prefer-predefined-assertion": "error",
				"regexp/prefer-quantifier": "error",
				"regexp/prefer-question-quantifier": "error",
				"regexp/prefer-range": [
					"error",
					{
						target: "alphanumeric",
					},
				],
				"regexp/prefer-regexp-exec": "error",
				"regexp/prefer-regexp-test": "error",
				"regexp/prefer-result-array-groups": [
					"error",
					{
						strictTypes: true,
					},
				],
				"regexp/prefer-set-operation": "error",
				"regexp/prefer-star-quantifier": "error",
				"regexp/prefer-unicode-codepoint-escapes": "error",
				"regexp/prefer-w": "error",
				"regexp/require-unicode-regexp": "error",
				"regexp/require-unicode-sets-regexp": "off",
				"regexp/simplify-set-operations": "error",
				"regexp/sort-alternatives": "error",
				"regexp/sort-character-class-elements": [
					"error",
					{
						order: ["\\s", "\\w", "\\d", "\\p", "*"],
					},
				],
				"regexp/sort-flags": "error",
				"regexp/strict": "error",
				"regexp/unicode-escape": ["error", "unicodeEscape"],
				"regexp/unicode-property": [
					"error",
					{
						generalCategory: "never",
						key: "long",
						property: {
							binary: "long",
							generalCategory: "long",
							script: "long",
						},
					},
				],
				"regexp/use-ignore-case": "error",
			},

			// eslint-plugin-top
			...{
				"top/no-top-level-side-effects": ["error", {
					allowDerived: false,
					allowedCalls: [],
					allowedNews: [],
					allowFunctionProperties: false,
					allowIIFE: false,
					allowPropertyAccess: false,
				}],
				"top/no-top-level-variables": ["error", {
					allowed: ["ObjectExpression"],
					kind: ["const"],
				}],
			},

			// eslint-plugin-unicorn
			...{
				"unicorn/better-regex": "error",
				"unicorn/catch-error-name": "error",
				"unicorn/consistent-assert": "error",
				"unicorn/consistent-date-clone": "error",
				"unicorn/consistent-destructuring": "off",
				"unicorn/consistent-empty-array-spread": "error",
				"unicorn/consistent-existence-index-check": "error",
				"unicorn/consistent-function-scoping": "off",
				"unicorn/custom-error-definition": "error",
				"unicorn/empty-brace-spaces": "error",
				"unicorn/error-message": "error",
				"unicorn/escape-case": "error",
				"unicorn/expiring-todo-comments": "error",
				"unicorn/explicit-length-check": "error",
				"unicorn/filename-case": "error",
				"unicorn/import-style": "off",
				"unicorn/new-for-builtins": "error",
				"unicorn/no-abusive-eslint-disable": "error",
				"unicorn/no-accessor-recursion": "error",
				"unicorn/no-anonymous-default-export": "error",
				"unicorn/no-array-callback-reference": "off",
				"unicorn/no-array-for-each": "error",
				"unicorn/no-array-method-this-argument": "error",
				"unicorn/no-array-reduce": "error",
				"unicorn/no-array-reverse": "error",
				"unicorn/no-await-expression-member": "error",
				"unicorn/no-await-in-promise-methods": "error",
				"unicorn/no-console-spaces": "error",
				"unicorn/no-document-cookie": "error",
				"unicorn/no-empty-file": "error",
				"unicorn/no-for-loop": "error",
				"unicorn/no-hex-escape": "error",
				"unicorn/no-instanceof-builtins": "error",
				"unicorn/no-invalid-fetch-options": "error",
				"unicorn/no-invalid-remove-event-listener": "error",
				"unicorn/no-keyword-prefix": "error",
				"unicorn/no-lonely-if": "error",
				"unicorn/no-magic-array-flat-depth": "error",
				"unicorn/no-named-default": "error",
				"unicorn/no-negated-condition": "error",
				"unicorn/no-negation-in-equality-check": "error",
				"unicorn/no-nested-ternary": "error",
				"unicorn/no-new-array": "error",
				"unicorn/no-new-buffer": "error",
				"unicorn/no-null": "off",
				"unicorn/no-object-as-default-parameter": "error",
				"unicorn/no-process-exit": "error",
				"unicorn/no-single-promise-in-promise-methods": "error",
				"unicorn/no-static-only-class": "error",
				"unicorn/no-thenable": "error",
				"unicorn/no-this-assignment": "error",
				"unicorn/no-typeof-undefined": "error",
				"unicorn/no-unnecessary-array-flat-depth": "error",
				"unicorn/no-unnecessary-array-splice-count": "error",
				"unicorn/no-unnecessary-await": "error",
				"unicorn/no-unnecessary-polyfills": "error",
				"unicorn/no-unnecessary-slice-end": "error",
				"unicorn/no-unreadable-array-destructuring": "error",
				"unicorn/no-unreadable-iife": "error",
				"unicorn/no-unused-properties": "error",
				"unicorn/no-useless-error-capture-stack-trace": "error",
				"unicorn/no-useless-fallback-in-spread": "error",
				"unicorn/no-useless-length-check": "error",
				"unicorn/no-useless-promise-resolve-reject": "error",
				"unicorn/no-useless-spread": "off",
				"unicorn/no-useless-switch-case": "error",
				"unicorn/no-useless-undefined": "error",
				"unicorn/no-zero-fractions": "error",
				"unicorn/number-literal-case": "error",
				"unicorn/numeric-separators-style": "error",
				"unicorn/prefer-add-event-listener": "error",
				"unicorn/prefer-array-find": "error",
				"unicorn/prefer-array-flat-map": "error",
				"unicorn/prefer-array-flat": "error",
				"unicorn/prefer-array-index-of": "error",
				"unicorn/prefer-array-some": "error",
				"unicorn/prefer-at": "error",
				"unicorn/prefer-blob-reading-methods": "error",
				"unicorn/prefer-class-fields": "error",
				"unicorn/prefer-code-point": "error",
				"unicorn/prefer-date-now": "error",
				"unicorn/prefer-default-parameters": "error",
				"unicorn/prefer-dom-node-append": "error",
				"unicorn/prefer-dom-node-dataset": "error",
				"unicorn/prefer-dom-node-remove": "error",
				"unicorn/prefer-dom-node-text-content": "error",
				"unicorn/prefer-event-target": "error",
				"unicorn/prefer-export-from": "error",
				"unicorn/prefer-global-this": "error",
				"unicorn/prefer-import-meta-properties": "error",
				"unicorn/prefer-includes": "error",
				"unicorn/prefer-json-parse-buffer": "error",
				"unicorn/prefer-keyboard-event-key": "error",
				"unicorn/prefer-logical-operator-over-ternary": "error",
				"unicorn/prefer-math-min-max": "error",
				"unicorn/prefer-math-trunc": "error",
				"unicorn/prefer-modern-dom-apis": "error",
				"unicorn/prefer-modern-math-apis": "error",
				"unicorn/prefer-module": "error",
				"unicorn/prefer-native-coercion-functions": "error",
				"unicorn/prefer-negative-index": "error",
				"unicorn/prefer-node-protocol": "error",
				"unicorn/prefer-number-properties": "error",
				"unicorn/prefer-object-from-entries": "error",
				"unicorn/prefer-optional-catch-binding": "error",
				"unicorn/prefer-prototype-methods": "error",
				"unicorn/prefer-query-selector": "error",
				"unicorn/prefer-reflect-apply": "error",
				"unicorn/prefer-regexp-test": "off",
				"unicorn/prefer-set-has": "error",
				"unicorn/prefer-set-size": "error",
				"unicorn/prefer-single-call": "error",
				"unicorn/prefer-spread": "error",
				"unicorn/prefer-string-raw": "off",
				"unicorn/prefer-string-replace-all": "error",
				"unicorn/prefer-string-slice": "error",
				"unicorn/prefer-string-starts-ends-with": "error",
				"unicorn/prefer-string-trim-start-end": "error",
				"unicorn/prefer-structured-clone": "error",
				"unicorn/prefer-switch": "error",
				"unicorn/prefer-ternary": "error",
				"unicorn/prefer-top-level-await": "error",
				"unicorn/prefer-type-error": "error",
				"unicorn/prevent-abbreviations": "off",
				"unicorn/relative-url-style": "error",
				"unicorn/require-array-join-separator": "error",
				"unicorn/require-module-specifiers": "error",
				"unicorn/require-number-to-fixed-digits-argument": "error",
				"unicorn/require-post-message-target-origin": "error",
				"unicorn/string-content": "error",
				"unicorn/switch-case-braces": "off",
				"unicorn/template-indent": "error",
				"unicorn/text-encoding-identifier-case": "error",
				"unicorn/throw-new-error": "error",
			},
		},
	},
	{
		name: "bin",
		files: ["bin/*.js"],
		rules: {
			// eslint-plugin-top
			"top/no-top-level-side-effects": "off",
			"top/no-top-level-variables": "off",
		},
	},
	{
		name: "Scripts",
		files: ["script/*.js"],
		rules: {
			"no-console": "off",
			"no-await-in-loop": "off",

			// eslint-plugin-jsdoc
			"jsdoc/require-jsdoc": "off",

			// eslint-plugin-top
			"top/no-top-level-side-effects": "off",
			"top/no-top-level-variables": "off",

			// eslint-plugin-unicorn
			"unicorn/no-process-exit": "off",
		},
	},
	{
		name: "Tests",
		files: ["**/*.test.js"],
		rules: {
			"guard-for-in": "off",
			"max-lines-per-function": "off",
			"max-lines": "off",
			"no-await-in-loop": "off",
			"no-magic-numbers": "off",
			"no-shadow": ["error", {
				allow: ["t"],
			}],

			// eslint-plugin-jsdoc
			"jsdoc/require-jsdoc": "off",
			"jsdoc/require-returns": "off",

			// eslint-plugin-top
			"top/no-top-level-side-effects": "off",
			"top/no-top-level-variables": "off",
		},
	},
	{
		name: "Config",
		files: [
			".eslintrc.js",
			".stryker.js",
		],
		rules: {
			"no-magic-numbers": "off",
		},
	},
	{
		name: "JSON",
		files: ["**/*.json"],
		language: "json/json",
		plugins: {
			json,
		},
		rules: {
			"json/no-duplicate-keys": "error",
			"json/no-empty-keys": "error",
			"json/no-unnormalized-keys": "error",
			"json/no-unsafe-values": "error",
			"json/top-level-interop": "error",
		},
	},
	{
		name: "YAML",
		files: [".github/**/*.yml", ".lockfile-lintrc.yml"],
		plugins: { yml },
		rules: {
			"yml/block-mapping": ["error", "always"],
			"yml/block-mapping-colon-indicator-newline": ["error", "never"],
			"yml/block-mapping-question-indicator-newline": ["error", "never"],
			"yml/block-sequence": ["error", "always"],
			"yml/block-sequence-hyphen-indicator-newline": ["error", "never"],
			"yml/file-extension": [
				"error",
				{
					extension: "yml",
					caseSensitive: true,
				},
			],
			"yml/indent": [
				"error",
				2,
				{
					indentBlockSequences: true,
					indicatorValueIndent: 2,
				},
			],
			"yml/key-name-casing": "off",
			"yml/key-spacing": [
				"error",
				{
					afterColon: true,
					beforeColon: false,
					mode: "strict",
				},
			],
			"yml/no-empty-document": "error",
			"yml/no-empty-key": "error",
			"yml/no-empty-mapping-value": "error",
			"yml/no-empty-sequence-entry": "error",
			"yml/no-irregular-whitespace": "error",
			"yml/no-multiple-empty-lines": [
				"error",
				{
					max: 1,
					maxEOF: 0,
					maxBOF: 0,
				},
			],
			"yml/no-tab-indent": "error",
			"yml/no-trailing-zeros": "error",
			"yml/plain-scalar": ["error", "always"],
			"yml/quotes": [
				"error",
				{
					avoidEscape: true,
					prefer: "double",
				},
			],
			"yml/require-string-key": "error",
			"yml/sort-keys": "off",
			"yml/sort-sequence-values": "off",
			"yml/spaced-comment": ["error", "always"],
		},
	},

	...process.argv.includes("**/*.md**") ? [
		{
			name: "MarkDown processor",
			files: ["**/*.md"],
			plugins: {
				markdown,
			},
			processor: "markdown/markdown",
		},
		{
			name: "Documentation snippets",
			files: ["**/*.md/*.js"],
			plugins: {
				unicorn,
			},
			rules: {
				"eol-last": "off",
				"no-undef": "off",
				"no-unused-expressions": "off",
				"no-unused-vars": "off",
				"padded-blocks": "off",
				"strict": "off",
				"unicode-bom": "off",
			},
		},
	] : [
		{
			name: "Documentation",
			files: ["**/*.md"],
			language: "markdown/commonmark",
			plugins: {
				markdown,
			},
			rules: {
				"markdown/fenced-code-language": "error",
				"markdown/heading-increment": "error",
				"markdown/no-bare-urls": "error",
				"markdown/no-duplicate-definitions": "error",
				"markdown/no-duplicate-headings": "error",
				"markdown/no-empty-definitions": ["error", {
					allowDefinitions: [],
					allowFootnoteDefinitions: [],
					checkFootnoteDefinitions: true
				}],
				"markdown/no-empty-images": "error",
				"markdown/no-empty-links": "error",
				"markdown/no-html": "error",
				"markdown/no-invalid-label-refs": "error",
				"markdown/no-missing-atx-heading-space": "error",
				"markdown/no-missing-label-refs": "error",
				"markdown/no-missing-link-fragments": ["error", {
					allowPattern: "",
					ignoreCase: true,
				}],
				"markdown/no-multiple-h1": "error",
				"markdown/no-reversed-media-syntax": "error",
				"markdown/no-unused-definitions": "error",
				"markdown/require-alt-text": "error",
				"markdown/table-column-count": "error",
			},
		},
	],

	{
		ignores: [
			"**/node_modules/",
			"**/package-lock.json",
		],
	},

	...yml.configs["flat/base"],
];
