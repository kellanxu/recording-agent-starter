import { join } from 'node:path';

import { ControlStateStore, type ControlState, type EventState } from './control-state.js';
import { withFileLock } from './file-lock.js';
import { parseMinuteGeneratedEvent, type MinuteGeneratedEvent } from './minute-event.js';

export class TranscriptNotReadyError extends Error {
  constructor() {
    super('transcript is not ready');
    this.name = 'TranscriptNotReadyError';
  }
}

export interface TranscriptResult {
  transcript: string;
  title?: string;
}

export interface TranscriptProvider {
  fetch(minuteToken: string): Promise<TranscriptResult>;
}

export interface TranscriptProcessor {
  process(event: MinuteGeneratedEvent, transcript: TranscriptResult): Promise<string>;
}

export interface CatchUpSource {
  list(days: number): Promise<MinuteGeneratedEvent[]>;
}

export type IngestResult =
  | { outcome: 'duplicate_event'; eventId: string }
  | { outcome: 'duplicate_token'; eventId: string }
  | { outcome: 'transcript_pending'; eventId: string; nextAttemptAt: string }
  | { outcome: 'processed'; eventId: string; recordingId: string }
  | { outcome: 'failed'; eventId: string; errorCode: string };

export interface ControlPlaneOptions {
  now?: () => Date;
  retryBaseMs?: number;
  retryMaxMs?: number;
}

function retryAt(attempts: number, now: Date, base: number, maximum: number): string {
  const delay = Math.min(maximum, base * 2 ** Math.max(0, attempts - 1));
  return new Date(now.getTime() + delay).toISOString();
}

function eventById(state: ControlState, eventId: string): EventState {
  const event = state.events[eventId];
  if (event === undefined) throw new Error(`event state disappeared: ${eventId}`);
  return event;
}

export class ControlPlane {
  readonly store: ControlStateStore;
  private readonly dailyLockPath: string;
  private readonly now: () => Date;
  private readonly retryBaseMs: number;
  private readonly retryMaxMs: number;

  constructor(
    workspaceRoot: string,
    private readonly transcriptProvider: TranscriptProvider,
    private readonly processor: TranscriptProcessor,
    options: ControlPlaneOptions = {},
  ) {
    this.store = new ControlStateStore(workspaceRoot);
    this.dailyLockPath = join(workspaceRoot, 'state', 'catch-up.lock');
    this.now = options.now ?? (() => new Date());
    this.retryBaseMs = options.retryBaseMs ?? 30_000;
    this.retryMaxMs = options.retryMaxMs ?? 3_600_000;
  }

  ingestRaw(input: unknown): Promise<IngestResult> {
    return this.ingest(parseMinuteGeneratedEvent(input));
  }

  async ingest(event: MinuteGeneratedEvent): Promise<IngestResult> {
    const registration = await this.store.update((state) => {
      if (state.events[event.eventId] !== undefined) return 'duplicate_event';
      const existingEventId = state.minuteTokens[event.minuteToken];
      if (existingEventId !== undefined) return 'duplicate_token';

      const timestamp = this.now().toISOString();
      state.events[event.eventId] = {
        ...event,
        status: 'registered',
        attempts: 0,
        updatedAt: timestamp,
      };
      state.minuteTokens[event.minuteToken] = event.eventId;
      return 'registered';
    });

    if (registration === 'duplicate_event') {
      return { outcome: 'duplicate_event', eventId: event.eventId };
    }
    if (registration === 'duplicate_token') {
      return { outcome: 'duplicate_token', eventId: event.eventId };
    }
    return this.attempt(event.eventId);
  }

  async retryDue(): Promise<IngestResult[]> {
    const now = this.now();
    const state = await this.store.read();
    const due = Object.values(state.events).filter(
      (event) =>
        event.status === 'transcript_pending' &&
        event.nextAttemptAt !== undefined &&
        new Date(event.nextAttemptAt).getTime() <= now.getTime(),
    );
    const results: IngestResult[] = [];
    for (const event of due) results.push(await this.attempt(event.eventId));
    return results;
  }

  async catchUp(
    days: number,
    source: CatchUpSource,
    minuteToken?: string,
  ): Promise<IngestResult[]> {
    if (!Number.isInteger(days) || days !== 1) {
      throw new Error('catch-up currently requires --days 1');
    }
    const listedEvents = await source.list(days);
    const events =
      minuteToken === undefined
        ? listedEvents
        : listedEvents.filter((event) => event.minuteToken === minuteToken);
    if (minuteToken !== undefined && events.length === 0) {
      throw new Error('requested minute token was not found in the one-day window');
    }
    const results: IngestResult[] = [];
    for (const event of events) results.push(await this.ingest({ ...event, source: 'catch-up' }));
    return results;
  }

  runDailyCatchUp(source: CatchUpSource): Promise<IngestResult[]> {
    return withFileLock(this.dailyLockPath, async () => {
      const state = await this.store.read();
      const last = state.lastCatchUpAt;
      const now = this.now();
      if (last !== undefined && now.getTime() - new Date(last).getTime() < 86_400_000) return [];

      const results = await this.catchUp(1, source);
      await this.store.update((current) => {
        current.lastCatchUpAt = now.toISOString();
      });
      return results;
    });
  }

  private async attempt(eventId: string): Promise<IngestResult> {
    const state = await this.store.read();
    const event = eventById(state, eventId);

    let transcript: TranscriptResult;
    try {
      transcript = await this.transcriptProvider.fetch(event.minuteToken);
    } catch (error) {
      if (error instanceof TranscriptNotReadyError) {
        return this.store.update((current) => {
          const pending = eventById(current, eventId);
          pending.attempts += 1;
          pending.status = 'transcript_pending';
          pending.nextAttemptAt = retryAt(
            pending.attempts,
            this.now(),
            this.retryBaseMs,
            this.retryMaxMs,
          );
          pending.updatedAt = this.now().toISOString();
          delete pending.errorCode;
          return {
            outcome: 'transcript_pending',
            eventId,
            nextAttemptAt: pending.nextAttemptAt,
          };
        });
      }
      return this.fail(eventId, 'transcript_fetch_failed');
    }

    await this.store.update((current) => {
      const processing = eventById(current, eventId);
      processing.status = 'processing';
      processing.updatedAt = this.now().toISOString();
      delete processing.nextAttemptAt;
    });

    try {
      const recordingId = await this.processor.process(event, transcript);
      await this.store.update((current) => {
        const processed = eventById(current, eventId);
        processed.status = 'processed';
        processed.recordingId = recordingId;
        processed.updatedAt = this.now().toISOString();
        delete processed.errorCode;
      });
      return { outcome: 'processed', eventId, recordingId };
    } catch {
      return this.fail(eventId, 'processing_failed');
    }
  }

  private fail(eventId: string, errorCode: string): Promise<IngestResult> {
    return this.store.update((current) => {
      const failed = eventById(current, eventId);
      failed.status = 'failed';
      failed.errorCode = errorCode;
      failed.updatedAt = this.now().toISOString();
      return { outcome: 'failed', eventId, errorCode };
    });
  }
}
