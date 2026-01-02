<!-- SPDX-License-Identifier: CC0-1.0 -->

# Security Policy

The maintainers of the _depreman_ project take security issues seriously. We
appreciate your efforts to responsibly disclose your findings. Due to the
non-funded and open-source nature of the project, we take a best-efforts
approach when it comes to engaging with security reports.

This document should be considered expired after 2026-06-01. If you are
reading this after that date you should find an up-to-date version in the
official source repository.

## Supported Versions

The table below shows which versions of the project are currently supported
with security updates.

| Version | End-of-life |
| ------: | :---------- |
|   0.x.x | -           |

## Reporting a Vulnerability

To report a security issue in the latest version of a supported version range,
either (in order of preference):

- [Report it through GitHub][new github advisory], or
- Send an email to [security@ericcornelissen.dev] with the terms "SECURITY" and
  "depreman" in the subject line.

Please do not open a regular issue or Pull Request in the public repository.

To report a security issue in an unsupported version of the project, or if the
latest version of a supported version range isn't affected, please report it
publicly. For example, as a regular issue in the public repository. If in doubt,
report the issue privately.

[new github advisory]: https://github.com/ericcornelissen/depreman/security/advisories/new
[security@ericcornelissen.dev]: mailto:security@ericcornelissen.dev?subject=SECURITY%20%28depreman%29

### What to Report

Consider if the issue you found really is a security concern. Below you can find
guidelines for what is and is not considered a security issue. Any issue that
does not fall into one of the listed categories should be reported based on your
own judgement. If in doubt, report the issue privately.

Any issue that is explicitly out of scope can still be reported, but should be
reported publicly because it is not considered sensitive.

#### In Scope

- Bugs with a security implication that can be triggered through inputs not
  provided by the user invoking the software.
- Insecure suggestions or snippets in the documentation.
- Security misconfigurations in the continuous integration and delivery pipeline
  or software supply chain.

#### Out of Scope

- Insecure defaults or confusing API design.
- Known vulnerabilities in third-party `dependencies` or `devDependencies`.

### What to Include in a Report

Try to include as many of the following items as possible in a security report:

- An explanation of the issue
- A proof of concept exploit
- A suggested severity
- Relevant [CWE] identifiers
- The latest affected version
- The earliest affected version
- A suggested patch
- An automated regression test

[cwe]: https://cwe.mitre.org/

### Threat Model

The CLI considers CLI arguments, program configuration files, package managers
(npm or yarn), JavaScript runtime, and host OS as trusted. All other inputs, for
example data coming from the package registry, are considered untrusted. Any
violation of confidentiality or integrity is considered a security issue.

The project considers local tooling, the GitHub infrastructure, and all project
maintainers to be trusted. Any action performed by any other GitHub user against
the repository is considered untrusted.

## Advisories

An advisory will be created only if a vulnerability affects at least one
released versions of the project. The affected versions range of an advisory
will by default include all unsupported versions of the project at the time of
disclosure.

All advisories are listed in the table below, ordered most to least recent by
publication date.

| ID               | Date       | Affected versions | Patched versions |
| :--------------- | :--------- | :---------------- | :--------------- |
| -                | -          | -                 | -                |

## Acknowledgments

We would like to publicly thank the following reporters:

- _none yet_
