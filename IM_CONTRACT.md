# Feishu Confirmation Contract

Verified locally on 2026-07-30 with `lark-cli 1.0.68`:

```bash
lark-cli event schema im.message.receive_v1 --json
lark-cli im +messages-send --help
```

V1 sends a plain-text confirmation sheet, not a handcrafted interactive card. The message contains
only the recording ID, current category, supported commands and safety boundary. It never contains
the Transcript, credentials or a machine path.

Each pending record reserves the deterministic idempotency key
`recording-confirmation-<recording_id>` before the external send. A successful send stores the
message ID. An ambiguous send failure is marked `unknown` and is not automatically repeated, which
avoids silently sending a duplicate.

The configured `lark-channel-bridge` remains the only IM long connection. It delivers the user's
reply and `bridge_context.messageIds` to Codex. The installed `recording-agent-reply` Skill accepts
only these exact commands:

```text
确认 R-XXXX
修改 R-XXXX：具体意见
分类 R-XXXX：分类名
```

Invalid IDs, unknown categories, ambiguous objects and malformed commands stop with
`needs_clarification`. Commands are idempotent by incoming message ID.

Minutes reads continue to use the user's normal `lark-cli` authorization. Confirmation sends and
the existing Bridge remain isolated in the configured profile. `recording-agent bridge-link`
installs a generic Codex Skill and a separate mode-`0600` machine registry; the Skill contains no
workspace path, chat/user ID or credentials. Codex calls:

```text
recording-agent reply --workspace <path> --message-id <id> --text <exact-command>
```

`reply` only updates the existing local Markdown record and audit registry. It never calls Feishu,
creates tasks, publishes content or deletes a recording. The verified direct
`im.message.receive_v1` adapter remains code-level evidence for a separate-app route, but it is not
started when the existing Bridge owns the application bus. P2P polling is not enabled as the main
or fallback path in V1.

Actual message sending is an external write. `catch-up` requires
`--confirm-external-writes`, and the future service start gate must show the configured target and
sending identity before enabling it.

This is a verified interface and mock-tested implementation. Real E2E evidence remains tracked
separately in `E2E_EVIDENCE.md`.
