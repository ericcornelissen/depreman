<!-- SPDX-License-Identifier: CC0-1.0 -->

# Changelog

All notable changes to `depreman` will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

## [Unreleased]

- _No changes yet_

## [0.3.4] - 2024-12-09

- Add `--report-unused` flag to report on unnecessary ignore directives.
- Disallow expiry dates with prefixes or suffixes.
- Fix ignoring of the expiry date when using the `*` wildcard.

## [0.3.3] - 2024-11-16

- Add support for Node.js v20.
- Add support for npm v9.
- Fix support for aliases in `dependencies`.
- Fix an error if there are no `dependencies` or `devDependencies`.
- Type check the `#ignore` value.

## [0.3.2] - 2024-11-09

- Add `+` to match 1-or-more dependencies.
- Let `*` properly match 0-or-more (i.e. match the dependency itself too).

## [0.3.1] - 2024-11-04

- Fix bug where rules following a wildcard would not be matched.
- Fix matching deprecations for `npm:` aliased dependencies.
- Improve matching of aliased dependencies in deprecation paths.
- Let `*` match 0-or-more instead of 1-or-more.

## [0.3.0] - 2024-11-03

- Add a `--help` message.
- Add `--errors-only` (replaces undocumented `--complete`).
- Add support for expiry dates using the `#expire` directive.
- Improve the path-to-the-deprecated package output by adding an indicator for
  the current project to the list.

## [0.2.0] - 2024-10-29

- Add support for exact path deprecation rules.
- Add support for wildcards in deprecation paths.
- Add support for using semver ranges in deprecation rules.
- Improve messaging when the configuration file is invalid.

## [0.1.0] - 2024-10-28

- Initial release.

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html
