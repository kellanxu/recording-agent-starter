import { spawn, type ChildProcess } from 'node:child_process';
import { appendFileSync, closeSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';

export const MINUTES_EVENT_TYPE = 'minutes.minute.generated_v1';
export const BRIDGE_HOOK_MARK = Symbol.for('recording-agent-starter.minutes-hook');

interface HookRegistry {
  schemaVersion: 1;
  workspaceRoot: string;
  command: [string, string];
  eventEnabled: boolean;
}

export interface SanitizedMinutesEvent {
  type: typeof MINUTES_EVENT_TYPE;
  event_id: string;
  timestamp: string;
  minute_token: string;
  title?: string;
}

export interface HookDispatchOptions {
  recordingAgentHome?: string;
  spawnProcess?: (
    command: string,
    args: readonly string[],
    options: Parameters<typeof spawn>[2],
  ) => ChildProcess;
}

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function safeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export function sanitizeBridgeMinutesEvent(raw: unknown): SanitizedMinutesEvent | undefined {
  const root = object(raw);
  const header = object(root.header);
  const event = Object.keys(object(root.event)).length > 0 ? object(root.event) : root;
  const minute = object(event.minute);
  const minuteToken = safeString(event.minute_token ?? minute.minute_token ?? root.minute_token);
  if (minuteToken === undefined || !/^obcn[a-z0-9]+$/iu.test(minuteToken)) return undefined;
  const rawEventId = safeString(header.event_id ?? root.event_id);
  const eventId =
    rawEventId !== undefined && /^[A-Za-z0-9._:-]{1,200}$/u.test(rawEventId)
      ? rawEventId
      : `bridge:${MINUTES_EVENT_TYPE}:${minuteToken}`;
  const title = safeString(event.title ?? minute.title ?? root.title);
  const rawTimestamp = header.create_time ?? event.timestamp ?? root.timestamp;
  const timestamp =
    typeof rawTimestamp === 'string' || typeof rawTimestamp === 'number'
      ? String(rawTimestamp)
      : String(Date.now());
  return {
    type: MINUTES_EVENT_TYPE,
    event_id: eventId,
    timestamp,
    minute_token: minuteToken,
    ...(title === undefined ? {} : { title }),
  };
}

function readRegistry(recordingAgentHome: string): HookRegistry | undefined {
  try {
    const parsed = JSON.parse(
      readFileSync(join(recordingAgentHome, 'bridge.json'), 'utf8'),
    ) as Partial<HookRegistry>;
    if (
      parsed.schemaVersion !== 1 ||
      typeof parsed.workspaceRoot !== 'string' ||
      !isAbsolute(parsed.workspaceRoot) ||
      !Array.isArray(parsed.command) ||
      parsed.command.length !== 2 ||
      !parsed.command.every((value) => typeof value === 'string' && isAbsolute(value)) ||
      typeof parsed.eventEnabled !== 'boolean'
    ) {
      return undefined;
    }
    return parsed as HookRegistry;
  } catch {
    return undefined;
  }
}

function log(workspaceRoot: string, status: string): void {
  const logDirectory = join(workspaceRoot, 'logs');
  mkdirSync(logDirectory, { recursive: true });
  appendFileSync(
    join(logDirectory, 'bridge-hook.ndjson'),
    `${JSON.stringify({ at: new Date().toISOString(), status })}\n`,
    { encoding: 'utf8', mode: 0o600 },
  );
}

export function dispatchBridgeMinutesEvent(
  raw: unknown,
  options: HookDispatchOptions = {},
): boolean {
  const recordingAgentHome =
    options.recordingAgentHome ??
    process.env.RECORDING_AGENT_HOME ??
    join(homedir(), '.recording-agent');
  const registry = readRegistry(recordingAgentHome);
  if (registry === undefined || !registry.eventEnabled) return false;
  const event = sanitizeBridgeMinutesEvent(raw);
  if (event === undefined) {
    log(registry.workspaceRoot, 'event_rejected');
    return false;
  }
  mkdirSync(join(registry.workspaceRoot, 'logs'), { recursive: true });
  const stdout = openSync(
    join(registry.workspaceRoot, 'logs', 'hook-child.stdout.log'),
    'a',
    0o600,
  );
  const stderr = openSync(
    join(registry.workspaceRoot, 'logs', 'hook-child.stderr.log'),
    'a',
    0o600,
  );
  try {
    const spawnProcess = options.spawnProcess ?? spawn;
    const child = spawnProcess(
      registry.command[0],
      [registry.command[1], 'ingest-event', '--workspace', registry.workspaceRoot],
      {
        cwd: registry.workspaceRoot,
        detached: true,
        env: { ...process.env },
        stdio: ['pipe', stdout, stderr],
      },
    );
    child.stdin?.end(`${JSON.stringify(event)}\n`);
    child.unref?.();
    log(registry.workspaceRoot, 'event_dispatched');
    return true;
  } catch {
    log(registry.workspaceRoot, 'spawn_failed');
    return false;
  } finally {
    closeSync(stdout);
    closeSync(stderr);
  }
}

interface PatchableChannel {
  dispatcher: {
    register(handlers: Record<string, (raw: unknown) => Promise<void>>): void;
  };
}

interface PatchablePrototype extends Record<PropertyKey, unknown> {
  registerDispatcherHandlers: (this: PatchableChannel, ...args: unknown[]) => unknown;
}

export function patchChannelPrototype(prototype: PatchablePrototype): boolean {
  if (prototype[BRIDGE_HOOK_MARK] === true) return false;
  const original = prototype.registerDispatcherHandlers;
  if (typeof original !== 'function') return false;
  prototype.registerDispatcherHandlers = function registerWithMinutes(...args: unknown[]) {
    original.apply(this, args);
    this.dispatcher.register({
      [MINUTES_EVENT_TYPE]: (raw) => {
        dispatchBridgeMinutesEvent(raw);
        return Promise.resolve();
      },
    });
  };
  Object.defineProperty(prototype, BRIDGE_HOOK_MARK, {
    value: true,
    enumerable: false,
  });
  return true;
}
