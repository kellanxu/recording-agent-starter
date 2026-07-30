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
