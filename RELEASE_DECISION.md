# v0.1.0 Release Decision

Decision date: 2026-07-30

## Decision

`v0.1.0` may be published only from the commit that passes the complete release command matrix,
archive privacy audit, isolated ZIP installation and workshop HTML/PDF verification. GitHub
publication is allowed after those gates pass. Feishu document synchronization is allowed
afterward, but public-link permission remains a separate user-confirmed action.

## Dependency risk resolution

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

- The release archive contains no production dependencies, credentials, IDs, real recording,
  Transcript, Minutes URL, private path or private knowledge-base material.
- Public screenshots come from the built CLI and bundled safe fixture, with generated machine paths
  replaced by placeholders.
- The release does not create tasks, publish user content, delete recordings or widen Feishu
  permissions.
