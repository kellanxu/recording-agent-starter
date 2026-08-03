# Feishu Minutes Event Contract

Revalidated locally on 2026-08-03 with `lark-cli 1.0.81` and
`lark-channel-bridge 0.6.4`.

```bash
lark-cli event schema minutes.minute.generated_v1 --json
```

The Feishu application has one WebSocket connection owned by the existing Bridge. Starter patches
the Bridge's internal dispatcher with one additional handler for
`minutes.minute.generated_v1`; it does not run `lark-cli event consume` and therefore does not
create a second event listener.

The Hook allow-lists the raw event into this flat object before crossing the child-process boundary:

| Field          | Meaning                                          |
| -------------- | ------------------------------------------------ |
| `type`         | Always `minutes.minute.generated_v1`             |
| `event_id`     | Globally unique event identifier                 |
| `timestamp`    | Delivery time as a millisecond timestamp string  |
| `minute_token` | Stable Minutes identifier                        |
| `title`        | Enriched title; may be empty if enrichment fails |
| `title`        | Optional title                                   |

The same application uses two isolated local identities:

- bot identity: existing Bridge messages and confirmation sends;
- user identity: Minutes subscription, search and Transcript retrieval.

They must resolve to the same Feishu application. `doctor --live` fails when they do not.

`start` registers the Minutes event subscription with the user identity through:

```text
POST /open-apis/minutes/v1/minutes/subscription
event_type = minutes.minute.generated_v1
```

The acknowledgement stored locally contains only event type, profile name and timestamp. Raw event
payloads and minute tokens are not written to the Hook log. The sanitized event is sent to the
packaged CLI over stdin, never as a process argument.

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

Event ID and minute token are both deduplicated before Transcript retrieval. A daily one-day catch-up
is a leak-recovery path, not the primary trigger and not a 15-minute scan.
