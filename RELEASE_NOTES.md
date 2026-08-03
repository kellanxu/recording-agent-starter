# Recording Agent Starter v0.2.0-beta.1

This pre-release changes the event architecture to one Feishu application and one existing Bridge
WebSocket connection. It is available for opt-in student testing, but it is not the stable release.

## Included

- Safe `init`, green/yellow/red `doctor` and idempotent offline `sample`.
- Realtime Minutes handling through a Bridge preload Hook, without a second event consumer.
- Same-app bot/user identity isolation and a direct Minutes subscription acknowledgement.
- Event/token deduplication, bounded retry and a once-per-day catch-up safety net.
- Codex-backed structured processing into one atomic Markdown main record.
- One transcript-free confirmation sheet and exact confirm/modify/classify replies through the
  existing Bridge/Codex path.
- macOS Hook installation with idempotent restart and original-service rollback.
- Packaged child-process verification from Hook dispatch through Markdown and confirmation.

## Candidate verification

Download both release files, keep them together, then verify:

```bash
shasum -a 256 -c recording-agent-starter-0.2.0-beta.1.zip.sha256
unzip recording-agent-starter-0.2.0-beta.1.zip
cd recording-agent-starter
npm install --omit=dev
npm install --global .
recording-agent --version
```

This archive is a Pre-release for voluntary testing. Do not present it as the stable student package
until the real clean-profile gate in `RELEASE_DECISION.md` passes.

## Safety

The bundled sample is fixture evidence, not the user's real Feishu E2E. The Starter never creates
tasks, publishes content or deletes recordings. Public Feishu document permissions are not part of
this release.
