# Dependency License Audit

Audited from both locked dependency graphs on 2026-07-30.

| Lockfile                     | Locked package entries |
| ---------------------------- | ---------------------: |
| `package-lock.json`          |                    162 |
| `workshop/package-lock.json` |                    825 |
| **Total**                    |                **987** |

The combined graph uses reviewed permissive, weak-copyleft or dual-license identifiers:
MIT-family expressions, Apache-2.0, BSD variants, ISC, MPL-2.0, Python-2.0, CC0-1.0,
CC-BY-4.0, Unlicense and BlueOak-1.0.0.

Run:

```bash
npm run license:audit
```

The audit fails on a missing or unreviewed license. `khroma@2.1.0` and `zigpty@0.2.1` omit
`license` metadata from their lock entries, while their installed package distributions include
MIT LICENSE files. The script accepts only those exact name/version pairs as reviewed metadata
exceptions; any upgrade must be re-reviewed.

This is a development dependency audit. The packaged Starter has zero production dependencies.
