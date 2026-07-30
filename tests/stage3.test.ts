import { chmod, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import type { CodexRunner } from '../src/codex-runner.js';
import {
  ControlPlane,
  TranscriptNotReadyError,
  type CatchUpSource,
  type TranscriptProcessor,
  type TranscriptProvider,
  type TranscriptResult,
} from '../src/control-plane.js';
import { ControlStateStore } from '../src/control-state.js';
import { MinuteEventConsumer } from '../src/event-consumer.js';
import { initializeWorkspace } from '../src/init.js';
import { LiveTranscriptProcessor } from '../src/live-processor.js';
import {
  MINUTE_GENERATED_EVENT,
  parseMinuteGeneratedEvent,
  type MinuteGeneratedEvent,
} from '../src/minute-event.js';

const testRoots: string[] = [];

function testRoot(name: string): string {
  const root = resolve('tmp', `stage3-${process.pid}-${name}`);
  testRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function event(
  eventId: string,
  minuteToken: string,
  source: MinuteGeneratedEvent['source'] = 'event',
): MinuteGeneratedEvent {
  return {
    eventId,
    minuteToken,
    title: '安全测试录音',
    occurredAt: '2026-07-30T00:00:00.000Z',
    source,
  };
}

function processor(calls: string[]): TranscriptProcessor {
  return {
    process: (input): Promise<string> => {
      calls.push(input.eventId);
      return Promise.resolve(`R-${calls.length.toString().padStart(4, '0')}`);
    },
  };
}

describe('minute event adapter', () => {
  it('parses the verified flat lark-cli event schema', () => {
    expect(
      parseMinuteGeneratedEvent({
        type: MINUTE_GENERATED_EVENT,
        event_id: 'event-flat',
        timestamp: '1785379200000',
        minute_token: 'minute-token-flat',
        title: '',
      }),
    ).toEqual({
      ...event('event-flat', 'minute-token-flat'),
      title: '未命名录音',
      occurredAt: '1785379200000',
    });
  });

  it('parses the generated event without guessing other event types', () => {
    expect(
      parseMinuteGeneratedEvent({
        header: {
          event_id: 'event-1',
          event_type: MINUTE_GENERATED_EVENT,
          create_time: '2026-07-30T00:00:00.000Z',
        },
        event: {
          minute: {
            minute_token: 'minute-token-1',
            title: '安全测试录音',
          },
        },
      }),
    ).toEqual(event('event-1', 'minute-token-1'));

    expect(() =>
      parseMinuteGeneratedEvent({
        header: { event_id: 'x', event_type: 'other', create_time: 'now' },
        event: { minute_token: 'token' },
      }),
    ).toThrow('unsupported event type');
  });
});

describe('deterministic event control plane', () => {
  it('deduplicates both event_id and minute_token before processing', async () => {
    const calls: string[] = [];
    const provider: TranscriptProvider = {
      fetch: (): Promise<TranscriptResult> => Promise.resolve({ transcript: '安全逐字稿' }),
    };
    const plane = new ControlPlane(testRoot('dedupe'), provider, processor(calls));

    expect((await plane.ingest(event('event-1', 'token-1'))).outcome).toBe('processed');
    expect((await plane.ingest(event('event-1', 'token-1'))).outcome).toBe('duplicate_event');
    expect((await plane.ingest(event('event-2', 'token-1'))).outcome).toBe('duplicate_token');
    expect(calls).toEqual(['event-1']);
  });

  it('allows only one concurrent registration', async () => {
    const calls: string[] = [];
    const provider: TranscriptProvider = {
      fetch: (): Promise<TranscriptResult> => Promise.resolve({ transcript: '安全逐字稿' }),
    };
    const plane = new ControlPlane(testRoot('concurrent'), provider, processor(calls));

    const outcomes = await Promise.all([
      plane.ingest(event('event-1', 'token-1')),
      plane.ingest(event('event-1', 'token-1')),
    ]);
    expect(outcomes.map((result) => result.outcome).sort()).toEqual([
      'duplicate_event',
      'processed',
    ]);
    expect(calls).toEqual(['event-1']);
  });

  it('backs off and retries only the pending token', async () => {
    let now = new Date('2026-07-30T00:00:00.000Z');
    const fetched: string[] = [];
    let ready = false;
    const provider: TranscriptProvider = {
      fetch: (minuteToken): Promise<TranscriptResult> => {
        fetched.push(minuteToken);
        return ready
          ? Promise.resolve({ transcript: '安全逐字稿' })
          : Promise.reject(new TranscriptNotReadyError());
      },
    };
    const calls: string[] = [];
    const plane = new ControlPlane(testRoot('retry'), provider, processor(calls), {
      now: () => now,
      retryBaseMs: 1_000,
      retryMaxMs: 8_000,
    });

    const first = await plane.ingest(event('event-1', 'token-1'));
    expect(first).toMatchObject({
      outcome: 'transcript_pending',
      nextAttemptAt: '2026-07-30T00:00:01.000Z',
    });
    expect(await plane.retryDue()).toEqual([]);

    now = new Date('2026-07-30T00:00:01.000Z');
    ready = true;
    expect((await plane.retryDue())[0]).toMatchObject({ outcome: 'processed' });
    expect(fetched).toEqual(['token-1', 'token-1']);
    expect(calls).toEqual(['event-1']);
  });

  it('persists state across a new controller instance', async () => {
    const root = testRoot('restart');
    const calls: string[] = [];
    const provider: TranscriptProvider = {
      fetch: (): Promise<TranscriptResult> => Promise.resolve({ transcript: '安全逐字稿' }),
    };
    const first = new ControlPlane(root, provider, processor(calls));
    expect((await first.ingest(event('event-1', 'token-1'))).outcome).toBe('processed');

    const restarted = new ControlPlane(root, provider, processor(calls));
    expect((await restarted.ingest(event('event-1', 'token-1'))).outcome).toBe('duplicate_event');
    expect(calls).toEqual(['event-1']);
    expect(JSON.parse(await readFile(new ControlStateStore(root).statePath, 'utf8'))).toMatchObject(
      {
        schemaVersion: 1,
        minuteTokens: { 'token-1': 'event-1' },
      },
    );
  });

  it('runs catch-up at most once per 24 hours and returns duplicates', async () => {
    let now = new Date('2026-07-30T00:00:00.000Z');
    const calls: string[] = [];
    const provider: TranscriptProvider = {
      fetch: (): Promise<TranscriptResult> => Promise.resolve({ transcript: '安全逐字稿' }),
    };
    const sourceCalls: number[] = [];
    const source: CatchUpSource = {
      list: (days): Promise<MinuteGeneratedEvent[]> => {
        sourceCalls.push(days);
        return Promise.resolve([event('catchup-1', 'token-1', 'catch-up')]);
      },
    };
    const plane = new ControlPlane(testRoot('catchup'), provider, processor(calls), {
      now: () => now,
    });

    expect((await plane.runDailyCatchUp(source))[0]?.outcome).toBe('processed');
    expect(await plane.runDailyCatchUp(source)).toEqual([]);
    now = new Date('2026-07-31T00:00:00.000Z');
    expect((await plane.runDailyCatchUp(source))[0]?.outcome).toBe('duplicate_event');
    expect(sourceCalls).toEqual([1, 1]);
    expect(calls).toEqual(['catchup-1']);
  });

  it('rejects unsupported catch-up windows', async () => {
    const plane = new ControlPlane(
      testRoot('days'),
      { fetch: () => Promise.resolve({ transcript: '安全逐字稿' }) },
      processor([]),
    );
    await expect(plane.catchUp(2, { list: () => Promise.resolve([]) })).rejects.toThrow('--days 1');
  });

  it('uses the structured runner contract to create one persistent live record', async () => {
    const root = testRoot('live-record');
    const workspaceRoot = join(root, 'workspace');
    const libraryRoot = join(root, 'library');
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot,
      source: '本人飞书妙记',
      categories: ['工作'],
      retentionRule: '保留证据和人工意见',
    });
    const runner: CodexRunner = {
      run: () =>
        Promise.resolve({
          schemaVersion: 1,
          title: '安全测试录音',
          category: '工作',
          summary: '安全结论',
          evidence: ['安全证据'],
          candidateActions: [{ action: '整理检查清单' }],
        }),
    };
    const liveProcessor = new LiveTranscriptProcessor(
      workspaceRoot,
      runner,
      () => new Date('2026-07-30T02:00:00.000Z'),
    );

    expect(
      await liveProcessor.process(event('event-1', 'token-1'), { transcript: '安全逐字稿' }),
    ).toBe('R-0002');
    expect(
      await liveProcessor.process(event('event-2', 'token-1'), { transcript: '安全逐字稿' }),
    ).toBe('R-0002');
    expect(await readdir(join(libraryRoot, '工作'))).toEqual(['R-0002.md']);
    expect(await readFile(join(libraryRoot, '工作', 'R-0002.md'), 'utf8')).toContain(
      'recording_id: "R-0002"',
    );
  });

  it('consumes the verified flat NDJSON event stream and stops via stdin EOF', async () => {
    const root = testRoot('consumer');
    const executable = join(root, 'fake-lark-cli.mjs');
    await mkdir(root, { recursive: true });
    await writeFile(
      executable,
      `#!/usr/bin/env node
process.stderr.write('[event] ready event_key=minutes.minute.generated_v1\\n');
process.stdout.write(JSON.stringify({
  type: 'minutes.minute.generated_v1',
  event_id: 'event-stream-1',
  timestamp: '1785379200000',
  minute_token: 'token-stream-1',
  title: '安全测试录音'
}) + '\\n');
process.stdin.resume();
process.stdin.on('end', () => process.exit(0));
`,
      'utf8',
    );
    await chmod(executable, 0o700);
    const calls: string[] = [];
    const plane = new ControlPlane(
      root,
      { fetch: () => Promise.resolve({ transcript: '安全逐字稿' }) },
      processor(calls),
    );
    let resolveResult: (() => void) | undefined;
    const gotResult = new Promise<void>((resolveResultPromise) => {
      resolveResult = resolveResultPromise;
    });
    const consumer = new MinuteEventConsumer(
      root,
      plane,
      {
        onResult: () => {
          resolveResult?.();
        },
      },
      { executable },
    );

    const running = consumer.start();
    await gotResult;
    consumer.stop();
    await running;
    expect(calls).toEqual(['event-stream-1']);
  });
});
