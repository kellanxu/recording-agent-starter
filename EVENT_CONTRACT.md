# Feishu Minutes Event Contract

Verified locally on 2026-07-30 with `lark-cli 1.0.68`:

```bash
lark-cli event schema minutes.minute.generated_v1 --json
```

The consumer contract is a flat NDJSON object:

| Field           | Meaning                                          |
| --------------- | ------------------------------------------------ |
| `type`          | Always `minutes.minute.generated_v1`             |
| `event_id`      | Globally unique event identifier                 |
| `timestamp`     | Delivery time as a millisecond timestamp string  |
| `minute_token`  | Stable Minutes identifier                        |
| `title`         | Enriched title; may be empty if enrichment fails |
| `minute_source` | Optional source metadata                         |

The runtime starts one user-authenticated consumer:

```bash
lark-cli event consume minutes.minute.generated_v1 --as user
```

It waits for the exact stderr ready marker before considering the stream ready:

```text
[event] ready event_key=minutes.minute.generated_v1
```

Events are read from stdout as NDJSON. Shutdown closes stdin so the CLI can unsubscribe cleanly;
the Starter never uses `kill -9`.

Transcript retrieval is a separate read:

```bash
lark-cli minutes +detail \
  --minute-tokens <token> \
  --transcript \
  --overwrite \
  --output-dir runtime/minutes \
  --as user \
  --format json
```

The output directory is relative to the Starter workspace. The transcript file returned by the CLI
must resolve inside that workspace or it is rejected.

This document records a verified interface contract, not a claim that live authorization or a real
recording event has passed end to end.
