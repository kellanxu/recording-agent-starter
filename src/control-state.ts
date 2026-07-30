import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { writeFileAtomic } from './atomic-file.js';
import { withFileLock } from './file-lock.js';
import type { MinuteGeneratedEvent } from './minute-event.js';

export type EventStatus =
  'registered' | 'transcript_pending' | 'processing' | 'processed' | 'failed';

export interface EventState {
  eventId: string;
  minuteToken: string;
  title: string;
  occurredAt: string;
  source: MinuteGeneratedEvent['source'];
  status: EventStatus;
  attempts: number;
  nextAttemptAt?: string;
  recordingId?: string;
  errorCode?: string;
  updatedAt: string;
}

export interface ControlState {
  schemaVersion: 1;
  events: Record<string, EventState>;
  minuteTokens: Record<string, string>;
  lastCatchUpAt?: string;
}

export function emptyControlState(): ControlState {
  return { schemaVersion: 1, events: {}, minuteTokens: {} };
}

export class ControlStateStore {
  readonly statePath: string;
  readonly lockPath: string;

  constructor(workspaceRoot: string) {
    this.statePath = join(workspaceRoot, 'state', 'control.json');
    this.lockPath = join(workspaceRoot, 'state', 'control.lock');
  }

  async read(): Promise<ControlState> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'));
      return validateControlState(parsed);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      if (code === 'ENOENT') return emptyControlState();
      throw error;
    }
  }

  update<T>(mutate: (state: ControlState) => T | Promise<T>): Promise<T> {
    return withFileLock(this.lockPath, async () => {
      const state = await this.read();
      const result = await mutate(state);
      await writeFileAtomic(this.statePath, `${JSON.stringify(state, null, 2)}\n`);
      return result;
    });
  }
}

export function validateControlState(value: unknown): ControlState {
  if (typeof value !== 'object' || value === null)
    throw new Error('control state must be an object');
  const candidate = value as Partial<ControlState>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.events !== 'object' ||
    candidate.events === null ||
    typeof candidate.minuteTokens !== 'object' ||
    candidate.minuteTokens === null
  ) {
    throw new Error('control state has missing or invalid fields');
  }
  return candidate as ControlState;
}
