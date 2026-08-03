# E2E Evidence

Updated: 2026-08-03

## v0.2.0 single-connection candidate

Verified on the current development host without changing the maintainer's production Bridge:

- 10 test files and 56 tests passed, including concurrent deduplication, same-app identity routing,
  Hook installation idempotency and failed-restart rollback.
- Format, lint, typecheck, build and privacy scan passed; 100 repository files were scanned.
- The compiled preload loaded successfully with the installed `lark-channel-bridge 0.6.4` CLI.
- A `v0.2.0-dev` ZIP was installed under an isolated home with zero production dependencies.
- From the extracted ZIP, one Hook dispatch spawned the packaged CLI, fetched a safe fake
  Transcript, ran a safe fake Codex provider, wrote one live-format Markdown record and sent one
  fake confirmation. Replaying the event produced `duplicate_event` and did not call either
  provider again.
- A direct Minutes subscription request passed `lark-cli` dry-run under the isolated user identity.
- Starting without `--confirm-external-writes` created no LaunchAgent; clean-home live doctor
  correctly returned RED instead of claiming authorization.

Not yet verified for `v0.2.0`:

- a new safe real Feishu recording on a clean student-like app/profile using the generic packaged
  Hook;
- post-install real confirmation reply and service-restart recovery in that clean profile.

Therefore the current archive is a development candidate, not a final student Release. The
production `codex` profile was intentionally left untouched.

## Historical v0.1.0 evidence

The evidence below belongs to the earlier `v0.1.0` event-consumer architecture. It remains as
history and must not be presented as proof that `v0.2.0` has passed its external gate.

## Automated baseline

- Node.js: `v22.22.3`
- npm: `10.9.8`
- Codex CLI: `0.144.1`
- `lark-channel-bridge`: `0.5.8`
- `lark-cli`: `1.0.68`
- Test result: 8 files, 46 tests passed
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

## Real E2E gates

- [x] Discover and verify one user-owned Feishu application and one current private P2P target
      without copying their identifiers into the repository.
- [x] Make `doctor --live` fully green, including the existing Bridge/Codex reply link.
- [x] Install and restart the macOS LaunchAgent after showing the exact target and bot identity.
- [x] Record and upload one 60-second safe Minute and receive its realtime event without catch-up.
- [x] Process one existing current `local_review_pending` Minute in the isolated workspace and
      observe one Transcript retrieval, one real Codex run, one main record and one message.
- [x] Verify confirm, modify and classify against three independent real messages.
- [x] Restart the LaunchAgent, recover persisted state and replay an event without duplication.
- [x] Save only redacted commands, timestamps, versions and aggregate results.

## Real E2E evidence

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
- The first reply attempts bundled three commands into one message and were correctly rejected by
  the exact-command contract. Three later independent user messages each had a unique message ID.
- Bridge/Codex applied the real modify message before the read-back check. The local reply Skill
  then applied classify and confirm in order. Replaying all three real message IDs returned
  `duplicate` and did not change the Markdown digest.
- The real sequence exposed a defect: confirm replaced the entire human-confirmation section and
  erased the earlier opinion text. The implementation now preserves prior opinions through final
  confirmation and has a full modify/classify/confirm regression test.
- The isolated record was reconciled only from the already audited real modify message. Final
  aggregate evidence is one `R-0002`, one Markdown under category `学习`, status `confirmed`, the
  real user opinion retained, the old `工作` path absent and one registry entry.
- A user-authorized local QuickTime/AAC source was read without modification. A 60.000-second
  AAC/M4A derivative was created outside the repository with the explicit title
  `Recording-Agent-Starter-E2E-60s-2026-07-30`.
- The derivative was uploaded to the user's private Drive and converted to one new private Minute.
  No historical catch-up command was invoked.
- At `2026-07-30T11:18:33Z`, the running LaunchAgent received the corresponding
  `minutes.minute.generated_v1` event with source `event`. It moved from `processing` to
  `processed`, created exactly one `R-0003` Markdown and sent exactly one private P2P confirmation.
- Replaying the same minute token with a new event ID returned `duplicate_token`. The transcript
  provider and processor were not called; event and record counts stayed at two, the `R-0003`
  Markdown remained unique and byte-identical, and its notification remained `sent`.
- The project completion gate is service restart plus persisted-state recovery and event replay.
  The verified LaunchAgent restart, new PID, ready consumer, retained state and no-op replay satisfy
  this gate; a full macOS logout/login is not a separate release requirement.

The required real E2E gates have passed. Local Stage 8 activity materials may now be created.
Public Release, Feishu document synchronization and public permission changes remain gated by their
separate release and authorization checks.
