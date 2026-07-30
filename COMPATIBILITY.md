# Compatibility Baseline

Observed on 2026-07-30 before Stage 0 implementation:

| Component             | Project contract        | Observed version         | Stage 0 status                                |
| --------------------- | ----------------------- | ------------------------ | --------------------------------------------- |
| macOS                 | V1 supported host       | Current development host | Baseline only                                 |
| Node.js               | `>=20.12`               | `v22.22.3`               | Compatible                                    |
| npm                   | Bundled with Node       | `10.9.8`                 | Compatible                                    |
| Codex CLI             | Installed and logged in | `0.144.1`                | Version detected; login not exercised         |
| `lark-channel-bridge` | PersonalAgent profile   | `0.5.8`                  | Version detected; profile not exercised       |
| `lark-cli`            | Local Feishu CLI        | `1.0.68`                 | Version detected; authorization not exercised |

Stage 0 development dependencies are pinned to TypeScript `5.9.3`, ESLint and `@eslint/js`
`9.39.5`, `typescript-eslint` `8.65.0`, Vitest `4.1.10`, Prettier `3.9.6` and
`@types/node` `20.19.43`. These versions satisfy the declared Node.js `>=20.12` runtime floor
and their published peer dependency ranges. TypeScript 7 and ESLint 10 were deliberately not
used because the observed peer or engine ranges did not satisfy this project contract.

This table is compatibility evidence, not an end-to-end success claim. Real authorization, event
delivery, Transcript retrieval and write-back remain gated until their implementation stages.

## Development audit note

`npm audit --omit=dev` reports zero production vulnerabilities. The full development audit currently
reports five high-severity findings through ESLint 9's glob dependency chain. npm proposes ESLint 10,
but that release raises its Node.js floor to `20.19`, above this project's declared `>=20.12`
contract. The project does not use `--force` or an unsafe transitive override. This must be resolved
or explicitly re-decided before `v0.1.0`; the packaged Starter has zero production dependencies.
