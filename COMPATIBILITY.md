# Compatibility Baseline

Observed and revalidated on 2026-07-30:

| Component             | Project contract                   | Observed version         | v0.1.0 status                          |
| --------------------- | ---------------------------------- | ------------------------ | -------------------------------------- |
| macOS                 | V1 supported host                  | Current development host | Isolated real E2E passed               |
| Node.js runtime       | `>=20.12`                          | `v22.22.3`               | Compatible                             |
| Node.js development   | `^20.19.0 \|\| ^22.13.0 \|\| >=24` | `v22.22.3`               | Enforced by `devEngines`               |
| npm                   | Bundled with Node                  | `10.9.8`                 | Compatible                             |
| Codex CLI             | Installed and logged in            | `0.144.1`                | Real structured run passed             |
| `lark-channel-bridge` | PersonalAgent profile              | `0.5.8`                  | Existing Bridge reply path passed      |
| `lark-cli`            | Local Feishu CLI                   | `1.0.68`                 | Real event, Transcript and send passed |

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
