<!-- SPDX-License-Identifier: GFDL-1.3-or-later -->

# npm Deprecation Manager

A manager for npm deprecations.

Turn:

```shell
$ npm clean-install
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @humanwhocodes/config-array@0.12.3: Use @eslint/config-array instead
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated @humanwhocodes/config-array@0.6.0: Use @eslint/config-array instead
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated @humanwhocodes/object-schema@1.2.1: Use @eslint/object-schema instead
npm warn deprecated eslint@8.0.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
```

Into:

```shell
$ depreman
glob@8.1.0 ("Glob versions prior to v9 are no longer supported"):
        mocha@10.7.0 > glob@8.1.0
        publint@0.2.10 > npm-packlist@5.1.3 > glob@8.1.0
```

## Usage

1. Install:

   ```shell
   npm install depreman
   ```

1. Create an `.ndmrc` file in the root of your project.

1. Run:

   ```shell
   npx depreman
   ```

1. Configure.

### Configuration

#### CLI

The CLI has a couple of options:

- `--help`/`-h`: show help text.
- `--errors-only`: output only deprecation warnings that are not ignored.
- `--report-unused`: report and fail if there is an ignore directive that is
  unused. This is recommended if you have a lockfile but discouraged if you do
  not.
- `--omit=<dev|optional|peer>`: ignore deprecation warnings in development,
  optional, or peer dependencies. Can be repeated.

#### File

An `.ndmrc` file is just a JSON file with rules for deprecated dependencies to
ignore. The object hierarchy should reflect the dependency hierarchy with keys
representing `<package>@<version>` pairs ([semver] version ranges supported).

The `*` wildcard can be used to match 0-or-more dependencies in a hierarchy and
the `+` wildcard can be used to match 1-or-more dependencies in a hierarchy.

Use the `"#ignore"` directive when a deprecation for a given dependency should
be ignored and assign it a reason as a string (or a boolean if you prefer).
Optionally, use the `"#expire"` directive to set a date (`YYYY-MM-DD`) on which
the rule expires.

For example:

```json
{
  "ignore@v0": {
    "#ignore": "ignore deprecations for ignore@v0 but not its (grand)children"
  },

  "not-ignored@v1": {
    "package-a@v2": {
      "#ignore": "ignore deprecations for not-ignored@v1 > package-a@v2"
    },
    "package-b@v3": {
      "#ignore": "and for package-b@v3 only until December 31, 2024",
      "#expire": "2024-12-31"
    }
  },

  "ignore-it@v4": {
    "*": {
      "#ignore": "ignore deprecations in ignore-it@v4 and dependencies with '*'"
    }
  },
  "also-not-ignored@v5": {
    "+": {
      "#ignore": "ignore deprecations *under* also-not-ignored@v5 with '+'"
    }
  },

  "*": {
    "ignored@v6": {
      "#ignore": "ignore deprecations in ignored@v6 anywhere in the tree"
    }
  },

  "no-reason@v7": {
    "#ignore": true
  }
}
```

[semver]: https://www.npmjs.com/package/semver

## License

This software is available under the `AGPL-3.0-only` license, see [LICENSE] for
the full license text. Documentation is available under the `GFDL-1.3-or-later`
license, see [GNU Free Documentation License v1.3] for the full license text.

[LICENSE]: ./LICENSE
[gnu free documentation license v1.3]: https://www.gnu.org/licenses/fdl-1.3.en.html
