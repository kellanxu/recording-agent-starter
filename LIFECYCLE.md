# Runtime Lifecycle

## macOS

`recording-agent start` manages two local components:

1. it adds `dist/bridge-hook.js` as a Node preload on the configured existing Bridge LaunchAgent;
2. it writes one Starter retry-worker LaunchAgent whose label is derived from the workspace path.

The Bridge still owns the only Feishu WebSocket connection. The Hook only adds a Minutes handler to
the Bridge dispatcher. The retry worker has no event listener; it handles pending Transcript retries
and the once-per-day catch-up gate.

The retry-worker plist uses:

- `RunAtLoad=true`
- `KeepAlive=true`
- the current Node executable and packaged `dist/runtime.js`
- workspace-local stdout and stderr logs

On first Hook installation, Starter backs up the original Bridge plist, patches its arguments and
restarts the service. A successful `launchctl print` is required. If the patched Bridge cannot
restart, Starter restores the original arguments and service before returning failure. Repeated
`start` verifies an already installed and loaded Hook without restarting it.

Before installation, `start` prints the configured confirmation target and sending identity. It
does nothing unless `--confirm-external-writes` is present.

`recording-agent stop` first disables Minutes dispatch in the local registry, then stops only the
retry-worker LaunchAgent. It leaves the Hook installed but inactive and does not stop the Bridge.
Queues, failure state and audit remain available. The Starter never uses `kill -9`.

Startup does not immediately scan historical Minutes. The primary path is event-driven. An hourly
timer only checks a persisted catch-up gate; the actual one-day catch-up can run at most once per
24 hours. An operator can also request one exact token with the explicit `catch-up` command after
reviewing its external-write warning.

## Windows

The single-connection Bridge Hook installer currently depends on macOS LaunchAgents. Windows can run
`init`, `doctor` and the offline `sample`, but `start` returns unavailable. It must not be presented
as a live-event beta until a native lifecycle and real E2E are implemented.

## Status and recovery

The workspace stores `state/service.json` with mode `0600`. Public status contains only lifecycle
timestamps, PID, retry-worker readiness and aggregate counts. It excludes Transcript text, minute
tokens, chat/user IDs, credentials and machine configuration.

The event registry, retry queue, record registry and failure states are separate atomic files.
Stopping the service does not delete them.
