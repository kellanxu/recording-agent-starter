# v0.2.0-beta.2 Pre-release Decision

Decision date: 2026-08-03

## Decision

`v0.2.0-beta.2` is approved as a public GitHub Pre-release for opt-in student testing. It must be
marked as pre-release and must not be described as the stable `v0.2.0`.

This beta is required because the first clean-student check found that beta.1 documentation could
leave the Local Channel Bridge absent and could accept an old `lark-cli` that lacked realtime event
commands. Beta.2 makes installation, student-owned QR profile binding and command capability probes
explicit before the classroom project is initialized.

The stable `v0.2.0` may be published only from a clean, tagged commit after all of these gates pass:

- complete command matrix and privacy scan;
- archive audit and isolated ZIP installation;
- packaged Hook child-process flow, replay deduplication and restart rollback;
- one new safe real recording on a clean student-like macOS profile using one app and one Bridge
  connection;
- confirmation reply and persisted-state recovery after service restart.

The beta ZIP has passed the first three items. The maintainer's production Bridge was intentionally
not changed to manufacture the final evidence. This limitation must remain visible in the GitHub
Pre-release notes.

## Dependency risk resolution retained

- The root development toolchain uses ESLint `10.8.0`, `@eslint/js` `10.0.1` and
  `typescript-eslint` `8.65.0`.
- `typescript-eslint` declares ESLint 10 compatibility. ESLint 10's Node floor is enforced for
  contributors through `devEngines` without changing the packaged Starter runtime contract of
  Node `>=20.12`.
- The Slidev tree pins DOMPurify `3.4.12` through an exact override to remove the advisory inherited
  through Monaco and Mermaid.
- Root, root production-only and workshop audits each report zero vulnerabilities.
- No `--force`, ignored peer dependency or broad transitive override is used.

## License decision

The license audit covers both lockfiles. Two workshop packages omit `license` metadata from their
lock entries; their installed distributions contain MIT LICENSE files. The audit accepts only
those exact package names and versions as reviewed exceptions. Any version change or new missing
metadata fails the gate.

## Boundaries retained

- The candidate archive contains no production dependencies, credentials, IDs, real recording,
  Transcript, Minutes URL, private path or private knowledge-base material.
- Existing public screenshots remain historical `v0.1.0` material and are not evidence for this
  candidate.
- The release does not create tasks, publish user content, delete recordings or widen Feishu
  permissions.
