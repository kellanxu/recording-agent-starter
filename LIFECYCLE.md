# Runtime Lifecycle

## macOS

`recording-agent start` writes one user LaunchAgent whose label is derived from a SHA-256 digest of
the Starter workspace path. The plist uses:

- `RunAtLoad=true`
- `KeepAlive=true`
- the current Node executable and packaged `dist/runtime.js`
- workspace-local stdout and stderr logs

This design supports process restart and user-session restart recovery. The generated plist and
atomic control-state tests pass, but a real LaunchAgent has not yet been installed in Stage 5
development.

Before installation, `start` prints the configured confirmation target and sending identity. It
does nothing unless `--confirm-external-writes` is present.

`recording-agent stop` uses `launchctl bootout`. The plist remains available for a later explicit
start. Event consumers receive SIGTERM and close stdin, allowing `lark-cli` to unsubscribe cleanly.
The Starter never uses `kill -9`.

## Windows beta and development foreground mode

Windows V1 remains beta. It does not install a background service:

```powershell
recording-agent start `
  --workspace C:\absolute\path\to\starter-workspace `
  --foreground `
  --confirm-external-writes
```

Keep that terminal open. Stop with `Ctrl+C`. `recording-agent stop --workspace ...` can send SIGTERM
only after verifying that the saved PID command belongs to this workspace runtime.

## Status and recovery

The workspace stores `state/service.json` with mode `0600`. Public status contains only lifecycle
timestamps, PID, consumer readiness and aggregate counts. It excludes Transcript text, minute
tokens, chat/user IDs, credentials and machine configuration.

The event registry, retry queue, record registry and failure states are separate atomic files.
Stopping the service does not delete them.
