<!-- SPDX-License-Identifier: CC0-1.0 -->

# Release Guidelines

If you need to release a new version of the `depreman`, follow the guidelines
found in this document.

## Manual Releases

1. Make sure that your local copy of the repository is up-to-date, sync:

   ```shell
   git checkout main
   git pull origin main
   ```

   Or clone:

   ```shell
   git clone git@github.com:ericcornelissen/depreman.git
   ```

1. Pick a new version number in accordance with [Semantic Versioning]. For this
   example we'll use `0.3.1`.

1. Update the version number in the package manifest and lockfile:

   ```shell
   npm version --no-git-tag-version 0.3.1
   ```

   If that fails, change the value of the version field in `package.json` to the
   new version:

   ```diff
   -  "version": "0.3.0",
   +  "version": "0.3.1",
   ```

   and update the version number in `package-lock.json` using `npm install`
   (after updating `package.json`), which will sync the version number.

1. Update the `CHANGELOG.md`, manually add the following text after the
   `## [Unreleased]` line:

   ```markdown
   - _No changes yet_

   ## 0.3.1 (YYYY-MM-DD)
   ```

   The date should follow the year-month-day format where single-digit months
   and days should be prefixed with a `0` (e.g. `2022-01-01`).

1. Commit the changes to a new release branch and push using:

   ```shell
   git checkout -b release-$(sha1sum package.json | head -c 7)
   git add CHANGELOG.md package.json package-lock.json
   git commit --signoff --message "Version bump"
   git push origin release-$(sha1sum package.json | head -c 7)
   ```

1. Create a Pull Request to merge the release branch into `main`.

1. Merge the Pull Request if the changes look OK and all continuous integration
   checks are passing.

   > **NOTE:** At this point, the continuous delivery automation should kick in.

[semantic versioning]: https://semver.org/spec/v2.0.0.html
