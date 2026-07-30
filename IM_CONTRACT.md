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

Incoming commands are consumed from the flat `im.message.receive_v1` NDJSON schema. Only `text` or
`post` messages from the configured chat or user are accepted:

```text
确认 R-XXXX
修改 R-XXXX：具体意见
分类 R-XXXX：分类名
```

Invalid IDs, unknown categories, ambiguous objects and malformed commands stop with
`needs_clarification`. Commands are idempotent by incoming message ID.

Minutes reads continue to use the user's normal `lark-cli` authorization. Confirmation sends and
reply events are isolated in the configured `lark-channel-bridge` profile by setting that profile's
`LARK_CHANNEL_CONFIG` and `LARKSUITE_CLI_CONFIG_DIR`. The Starter derives those paths at runtime and
does not copy app credentials into its workspace.

Actual message sending is an external write. `catch-up` requires
`--confirm-external-writes`, and the future service start gate must show the configured target and
sending identity before enabling it.

This is a verified interface and mock-tested implementation. Real E2E evidence remains tracked
separately in `E2E_EVIDENCE.md`.
