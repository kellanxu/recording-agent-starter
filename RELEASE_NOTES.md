# Recording Agent Starter v0.1.0

The first public, local-first Starter for turning a user-owned Feishu recording into one auditable
Markdown record and one human confirmation loop.

## Included

- Safe `init`, green/yellow/red `doctor` and idempotent offline `sample`.
- Realtime Minutes event ingestion with event/token deduplication and bounded retry.
- Codex-backed structured processing into one atomic Markdown main record.
- One transcript-free confirmation sheet and exact confirm/modify/classify replies through the
  existing Bridge/Codex path.
- macOS LaunchAgent lifecycle and Windows foreground beta.
- Redacted real E2E evidence, original public-safe screenshots, macOS/Windows guides and complete
  Slidev workshop sources.

## Install

Download both release files, keep them together, then verify:

```bash
shasum -a 256 -c recording-agent-starter-0.1.0.zip.sha256
unzip recording-agent-starter-0.1.0.zip
cd recording-agent-starter
npm install --omit=dev
npm install --global .
recording-agent --version
```

Read `docs/MACOS.md` before enabling external writes. Every user must use their own Feishu app,
authorization, private confirmation target and local Markdown library.

## Safety

The bundled sample is fixture evidence, not the user's real Feishu E2E. The Starter never creates
tasks, publishes content or deletes recordings. Public Feishu document permissions are not part of
this release.
