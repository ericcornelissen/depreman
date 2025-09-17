<!-- SPDX-License-Identifier: CC0-1.0 -->

# Changelog

All notable changes to `depreman` will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

## Unreleased

- _No changes yet_

## 0.3.11 (2025-09-17)

- Disallow dates past the year 3000.
- Include deprecation message when all instances of it are ignored.
- Warn about ineffective leafs in the configuration.

## 0.3.10 (2025-07-31)

- Add (experimental) support for Yarn v4.

## 0.3.9 (2025-06-18)

- Fix support for Windows.

## 0.3.8 (2025-05-10)

- Add support for Node.js v24.
- Add support for npm v11.

## 0.3.7 (2025-04-21)

- Add CLI argument validation and error messaging.
- Add configuration validation and error messaging.
- Fix missing output when there are no disallowed deprecation warnings.
- Fix missing deprecation warnings due to npm output parsing.

## 0.3.6 (2025-03-17)

- Add support for projects that do not have a `package-lock.json`.
- Fix potentially poor performance when parsing npm aliases.

## 0.3.5 (2025-01-23)

- Add `--omit=<dev|optional|peer>` flag to control the review scope.
- Make the output ordered alphabetically (by package name).
- Fix an unexpected runtime error if there are no dependencies.
- Add validation of expiry dates.

## 0.3.4 (2024-12-09)

- Add `--report-unused` flag to report on unnecessary ignore directives.
- Disallow expiry dates with prefixes or suffixes.
- Fix ignoring of the expiry date when using the `*` wildcard.

## 0.3.3 (2024-11-16)

- Add support for Node.js v20.
- Add support for npm v9.
- Fix support for aliases in `dependencies`.
- Fix an error if there are no `dependencies` or `devDependencies`.
- Type check the `#ignore` value.

## 0.3.2 (2024-11-09)

- Add `+` to match 1-or-more dependencies.
- Let `*` properly match 0-or-more (i.e. match the dependency itself too).

## 0.3.1 (2024-11-04)

- Fix bug where rules following a wildcard would not be matched.
- Fix matching deprecation warnings for `npm:` aliased dependencies.
- Improve matching of aliased dependencies in deprecation paths.
- Let `*` match 0-or-more instead of 1-or-more.

## 0.3.0 (2024-11-03)

- Add a `--help` message.
- Add `--errors-only` (replaces undocumented `--complete`).
- Add support for expiry dates using the `#expire` directive.
- Improve the path-to-the-deprecated package output by adding an indicator for
  the current project to the list.

## 0.2.0 (2024-10-29)

- Add support for exact path deprecation rules.
- Add support for wildcards in deprecation paths.
- Add support for using semver ranges in deprecation rules.
- Improve messaging when the configuration file is invalid.

## 0.1.0 (2024-10-28)

- Initial release.

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html
