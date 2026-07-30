import { readFile, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import type { CodexRunner } from '../src/codex-runner.js';
import { ConfirmationService } from '../src/confirmation.js';
import type { ConfirmationNotifier } from '../src/confirmation-notifier.js';
import { ControlPlane } from '../src/control-plane.js';
import { initializeWorkspace } from '../src/init.js';
import { LiveTranscriptProcessor } from '../src/live-processor.js';
import { RecordRepository } from '../src/record-repository.js';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('mock event-to-confirmation integration', () => {
  it('keeps one record and one notification through replay, restart and confirmation', async () => {
    const root = resolve('tmp', `integration-${process.pid}`);
    roots.push(root);
    const workspaceRoot = join(root, 'workspace');
    const libraryRoot = join(root, 'library');
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot,
      source: '安全 mock 妙记',
      categories: ['工作'],
      retentionRule: '保留证据和人工意见',
    });
    const runner: CodexRunner = {
      run: () =>
        Promise.resolve({
          schemaVersion: 1,
          title: '安全 mock 集成',
          category: '工作',
          summary: '安全 mock 结论',
          evidence: ['安全 mock 证据'],
          candidateActions: [{ action: '整理检查清单' }],
        }),
    };
    const notifications: string[] = [];
    const notifier: ConfirmationNotifier = {
      send: (_entry, content) => {
        notifications.push(content);
        return Promise.resolve('safe-message-integration');
      },
    };
    const processor = new LiveTranscriptProcessor(
      workspaceRoot,
      runner,
      () => new Date('2026-07-30T05:00:00.000Z'),
      notifier,
    );
    const provider = {
      fetch: () => Promise.resolve({ transcript: '安全 mock 逐字稿' }),
    };
    const rawEvent = {
      type: 'minutes.minute.generated_v1',
      event_id: 'safe-event-integration',
      timestamp: '1785379200000',
      minute_token: 'safe-minute-integration',
      title: '安全 mock 集成',
    };

    const first = new ControlPlane(workspaceRoot, provider, processor);
    expect((await first.ingestRaw(rawEvent)).outcome).toBe('processed');
    const restarted = new ControlPlane(workspaceRoot, provider, processor);
    expect((await restarted.ingestRaw(rawEvent)).outcome).toBe('duplicate_event');

    expect(await readdir(join(libraryRoot, '工作'))).toEqual(['R-0002.md']);
    expect(notifications).toHaveLength(1);
    const confirmation = new ConfirmationService(
      workspaceRoot,
      () => new Date('2026-07-30T06:00:00.000Z'),
    );
    expect(
      (await confirmation.apply('确认 R-0002', 'safe-message-confirm-integration')).outcome,
    ).toBe('applied');
    const entry = await new RecordRepository(workspaceRoot).get('R-0002');
    const record = await readFile(entry?.path ?? '', 'utf8');
    expect(entry?.status).toBe('confirmed');
    expect(record).toContain('安全 mock 结论');
    expect(record).toContain('已确认');
    expect(record).toContain('safe-message-confirm-integration');
  });
});
