# Dependency License Audit

Audited from the locked dependency graph on 2026-07-30.

| SPDX license  | Locked package entries |
| ------------- | ---------------------: |
| 0BSD          |                      1 |
| Apache-2.0    |                     16 |
| BSD-2-Clause  |                      6 |
| BSD-3-Clause  |                      2 |
| BlueOak-1.0.0 |                      1 |
| ISC           |                      8 |
| MIT           |                    135 |
| MPL-2.0       |                     12 |
| Python-2.0    |                      1 |
| **Total**     |                **182** |

Run:

```bash
npm run license:audit
```

The audit reads `package-lock.json` and fails on missing or unreviewed licenses. This is a
development dependency audit; the packaged Starter currently has zero production dependencies.
