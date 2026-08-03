# Compatibility Baseline

Observed and revalidated on 2026-08-03:

The classroom installation baseline is `lark-channel-bridge 0.6.4` plus the official
`@larksuite/cli 1.0.81`. A higher installed version may be kept when the required command probes
pass; a lower version is not rejected by number alone. The authoritative gate is availability of
Bridge `profile/start/status` and lark-cli `event/minutes/api/auth status` commands. The unrelated
unscoped npm package named `lark-cli` is not part of this project.

| Component             | Project contract                   | Observed version         | v0.2.0 candidate status            |
| --------------------- | ---------------------------------- | ------------------------ | ---------------------------------- |
| macOS                 | Single-connection supported host   | Current development host | Package/process gates passed       |
| Node.js runtime       | `>=20.12`                          | `v22.22.3`               | Compatible                         |
| Node.js development   | `^20.19.0 \|\| ^22.13.0 \|\| >=24` | `v22.22.3`               | Enforced by `devEngines`           |
| npm                   | Bundled with Node                  | `12.0.2`                 | Old/new pack JSON supported        |
| Codex CLI             | Installed and logged in            | `0.146.0`                | Packaged fake-provider gate passed |
| `lark-channel-bridge` | One existing personal profile      | `0.6.4`                  | Preload compatibility passed       |
| `lark-cli`            | Same-app isolated bot/user configs | `1.0.81`                 | Subscription dry-run passed        |

The final `v0.2.0` gate still requires a new safe real recording on a clean student-like profile.
The production profile on the maintainer's Mac was intentionally not modified for candidate tests.

Development dependencies are exactly pinned to TypeScript `5.9.3`, ESLint `10.8.0`,
`@eslint/js` `10.0.1`, `typescript-eslint` `8.65.0`, Vitest `4.1.10`, Prettier `3.9.6` and
`@types/node` `20.19.43`.

`typescript-eslint` declares peer compatibility with ESLint 10 and TypeScript below 6.1. ESLint 10
requires Node `^20.19.0 || ^22.13.0 || >=24`; this is a development-only floor enforced through
`devEngines`. The packaged CLI keeps the documented Node `>=20.12` runtime contract and has zero
production dependencies.

## Dependency audit result

- `npm audit`: zero vulnerabilities.
- `npm audit --omit=dev`: zero vulnerabilities.
- `npm audit --prefix workshop`: zero vulnerabilities.
- Slidev's DOMPurify chain is pinned to reviewed version `3.4.12`.
- No `--force`, ignored peer dependency or unsafe broad override was used.

The complete release decision and license exception handling are recorded in
`RELEASE_DECISION.md` and `DEPENDENCY_LICENSES.md`.
