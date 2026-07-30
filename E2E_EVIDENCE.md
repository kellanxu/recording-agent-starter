# E2E Evidence

Updated: 2026-07-30

## Automated baseline

- Node.js: `v22.22.3`
- npm: `10.9.8`
- Codex CLI: `0.144.1`
- `lark-channel-bridge`: `0.5.8`
- `lark-cli`: `1.0.68`
- Test result: 8 files, 45 tests passed
- Build, format, lint, typecheck, privacy scan: passed

The mock integration covers:

```text
flat Minutes event
→ dual deduplication
→ Transcript provider
→ structured Codex Runner contract
→ one Markdown main record
→ one transcript-free confirmation sheet
→ process restart and event replay
→ confirmation updates the same record
```

All providers and message sends in this test are mocks. This is not a real Feishu E2E.

## Candidate ZIP isolation run

Artifact: `recording-agent-starter-0.0.0-dev.zip`

Successful checks:

1. SHA-256 verification passed.
2. ZIP extraction produced `dist/`, `fixtures/`, `schemas/`, README, LICENSE and package metadata.
3. `npm install --omit=dev` reported zero production dependencies and zero vulnerabilities.
4. Built CLI help ran from the extracted package.
5. `init` created an isolated workspace and library.
6. `doctor` returned YELLOW, not GREEN:
   - confirmation target was intentionally absent;
   - live Feishu authorization was intentionally not exercised.
7. `sample` generated exactly one `R-0001-offline-sample.md`.
8. Packaged archive audit passed for 136 paths and text payloads.

The first isolation attempt ran `node dist/cli.js` from the parent `release/` directory and failed
with `MODULE_NOT_FOUND`. The package contents were present; rerunning from the extracted package
directory passed. Because `npm install --omit=dev` in the wrong directory resolved the parent
project, it also pruned the development dependencies from the root `node_modules`; `npm install`
restored the exact lockfile dependencies before the full baseline passed again. This failed attempt
and its side effect are retained here so they are not rewritten as success.

A later SHA check was also invoked from the repository root while the checksum file contained the
adjacent archive filename. It failed to locate the ZIP from that cwd; rerunning from `release/`
passed. Release instructions therefore keep the ZIP and checksum together and run verification
from their containing directory.

The candidate ZIP is a development artifact, not `v0.1.0`, not built from a release tag and not
published.

## Real E2E gates still open

- [x] Discover and verify one user-owned Feishu application and one current private P2P target
      without copying their identifiers into the repository.
- [x] Make `doctor --live` fully green, including the existing Bridge/Codex reply link.
- [x] Install and restart the macOS LaunchAgent after showing the exact target and bot identity.
- [ ] Record one 60-second safe Minute.
- [x] Process one existing current `local_review_pending` Minute in the isolated workspace and
      observe one Transcript retrieval, one real Codex run, one main record and one message.
- [ ] Verify confirm, modify and classify against real messages.
- [x] Restart the service and replay the event without duplication.
- [ ] Restart the machine/user session and verify launchd recovery.
- [ ] Save only redacted commands, timestamps, versions and aggregate results.

## Partial real E2E evidence

The live run used repository-ignored paths under `tmp/live-e2e/`; no private system path, target ID,
message ID, token or Transcript was added to the repository.

- Read-only discovery found exactly one active Bridge profile and one current private internal P2P
  confirmation target using bot identity. The private meeting router was not modified.
- The one-day Minutes search returned three candidates. Two had existing `deleted` tombstones and
  were excluded. An exact token filter selected the only non-tombstoned
  `local_review_pending` candidate.
- The first exact attempt stopped at `processing_failed` before record creation or message sending.
  Diagnosis found that the real Codex Structured Outputs API rejected the repository schema.
- Commit `fbc4804` added the required integer type and strict nullable action fields. A separate
  live schema request then passed before the failed event was retried.
- The retained event recovered to `processed`. Aggregate evidence was exactly one event, one token,
  one `R-0002` record under the isolated library and one notification with `sent` status.
- Restarting the LaunchAgent at `2026-07-30T10:52:35Z` produced a running service with the Minutes
  consumer ready. Replaying the same candidate returned one `duplicate_token`; aggregate record
  and notification counts stayed at one.

This is not the required 60-second-new-recording gate. It is a real isolated replay of an existing
pending Minute. The three real Bridge-delivered reply commands and a user-session restart remain
open, so full E2E has not passed.

No public Release or activity demo may be created while these gates remain open.
