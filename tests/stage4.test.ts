import { access, readFile, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import type { CodexRunner } from '../src/codex-runner.js';
import { bridgeProfileEnvironment } from '../src/bridge-profile.js';
import { ConfirmationService, parseConfirmationCommand } from '../src/confirmation.js';
import type { ConfirmationNotifier } from '../src/confirmation-notifier.js';
import { parseImCommandEvent } from '../src/im-command-consumer.js';
import { initializeWorkspace } from '../src/init.js';
import { LiveTranscriptProcessor } from '../src/live-processor.js';
import type { MinuteGeneratedEvent } from '../src/minute-event.js';
import { RecordRepository } from '../src/record-repository.js';

const testRoots: string[] = [];

function testRoot(name: string): string {
  const root = resolve('tmp', `stage4-${process.pid}-${name}`);
  testRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const runner: CodexRunner = {
  run: () =>
    Promise.resolve({
      schemaVersion: 1,
      title: '安全确认回路',
      category: '工作',
      summary: '原始 AI 结论',
      evidence: ['安全证据'],
      candidateActions: [{ action: '整理检查清单' }],
    }),
};

function minuteEvent(token: string): MinuteGeneratedEvent {
  return {
    eventId: `event-${token}`,
    minuteToken: token,
    title: '安全确认回路',
    occurredAt: '2026-07-30T00:00:00.000Z',
    source: 'event',
  };
}

async function liveRecord(name: string): Promise<{
  workspaceRoot: string;
  libraryRoot: string;
  repository: RecordRepository;
}> {
  const root = testRoot(name);
  const workspaceRoot = join(root, 'workspace');
  const libraryRoot = join(root, 'library');
  await initializeWorkspace({
    workspaceRoot,
    libraryRoot,
    source: '本人飞书妙记',
    categories: ['工作', '学习'],
    retentionRule: '保留证据和人工意见',
  });
  const processor = new LiveTranscriptProcessor(
    workspaceRoot,
    runner,
    () => new Date('2026-07-30T03:00:00.000Z'),
  );
  await processor.process(minuteEvent(`token-${name}`), { transcript: '安全逐字稿' });
  return { workspaceRoot, libraryRoot, repository: new RecordRepository(workspaceRoot) };
}

describe('confirmation command parser', () => {
  it('parses the three public commands strictly', () => {
    expect(parseConfirmationCommand('确认 R-0002')).toEqual({
      kind: 'confirm',
      recordingId: 'R-0002',
    });
    expect(parseConfirmationCommand('修改 R-0002：保留更多证据')).toEqual({
      kind: 'modify',
      recordingId: 'R-0002',
      opinion: '保留更多证据',
    });
    expect(parseConfirmationCommand('分类 R-0002：学习')).toEqual({
      kind: 'classify',
      recordingId: 'R-0002',
      category: '学习',
    });
    expect(parseConfirmationCommand('帮我确认一下')).toBeUndefined();
  });
});

describe('Stage 4 confirmation loop', () => {
  it('sends only one transcript-free confirmation sheet per pending record', async () => {
    const root = testRoot('notify');
    const workspaceRoot = join(root, 'workspace');
    const libraryRoot = join(root, 'library');
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot,
      source: '本人飞书妙记',
      categories: ['工作'],
      retentionRule: '保留证据',
    });
    const sent: string[] = [];
    const notifier: ConfirmationNotifier = {
      send: (_entry, content): Promise<string> => {
        sent.push(content);
        return Promise.resolve('safe-message-1');
      },
    };
    const processor = new LiveTranscriptProcessor(
      workspaceRoot,
      runner,
      () => new Date('2026-07-30T03:00:00.000Z'),
      notifier,
    );

    await processor.process(minuteEvent('token-notify'), { transcript: '绝不进入确认单的逐字稿' });
    await processor.process(minuteEvent('token-notify'), { transcript: '绝不进入确认单的逐字稿' });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('确认 R-0002');
    expect(sent[0]).not.toContain('绝不进入确认单的逐字稿');
  });

  it('confirms the same record and appends an audit marker', async () => {
    const { workspaceRoot, repository } = await liveRecord('confirm');
    const service = new ConfirmationService(
      workspaceRoot,
      () => new Date('2026-07-30T04:00:00.000Z'),
    );
    const result = await service.apply('确认 R-0002', 'safe-message-confirm');
    const entry = await repository.get('R-0002');
    const record = await readFile(entry?.path ?? '', 'utf8');

    expect(result.outcome).toBe('applied');
    expect(entry?.status).toBe('confirmed');
    expect(record).toContain('status: "confirmed"');
    expect(record).toContain('## 人工确认\n\n已确认');
    expect(record).toContain('message_id=safe-message-confirm');
    expect((await service.apply('确认 R-0002', 'safe-message-confirm')).outcome).toBe('duplicate');
  });

  it('preserves original output and records the user opinion', async () => {
    const { workspaceRoot, repository } = await liveRecord('modify');
    const service = new ConfirmationService(workspaceRoot);
    expect(
      (await service.apply('修改 R-0002：负责人应继续保持未明确', 'safe-message-modify')).outcome,
    ).toBe('applied');
    const entry = await repository.get('R-0002');
    const record = await readFile(entry?.path ?? '', 'utf8');

    expect(entry?.status).toBe('revision_requested');
    expect(record).toContain('原始 AI 结论');
    expect(record).toContain('用户修改意见：负责人应继续保持未明确');
  });

  it('moves the original file for a valid category without copying the body', async () => {
    const { workspaceRoot, libraryRoot, repository } = await liveRecord('classify');
    const service = new ConfirmationService(workspaceRoot);
    const originalPath = join(libraryRoot, '工作', 'R-0002.md');
    const original = await readFile(originalPath, 'utf8');
    const result = await service.apply('分类 R-0002：学习', 'safe-message-classify');
    const targetPath = join(libraryRoot, '学习', 'R-0002.md');

    expect(result).toMatchObject({ outcome: 'applied', path: targetPath });
    await expect(access(originalPath)).rejects.toThrow();
    expect(await readdir(join(libraryRoot, '学习'))).toEqual(['R-0002.md']);
    const moved = await readFile(targetPath, 'utf8');
    expect(moved).toContain('category: "学习"');
    expect(moved).toContain('原始 AI 结论');
    expect(moved.length).toBeGreaterThan(original.length);
    expect((await repository.get('R-0002'))?.path).toBe(targetPath);
  });

  it('stops for invalid IDs, invalid categories and malformed commands', async () => {
    const { workspaceRoot } = await liveRecord('clarify');
    const service = new ConfirmationService(workspaceRoot);
    expect((await service.apply('确认 R-9999', 'safe-message-1')).outcome).toBe(
      'needs_clarification',
    );
    expect((await service.apply('分类 R-0002：不存在', 'safe-message-2')).outcome).toBe(
      'needs_clarification',
    );
    expect((await service.apply('确认一下', 'safe-message-3')).outcome).toBe('needs_clarification');
  });
});

describe('verified IM event adapter', () => {
  it('isolates bot commands in the configured Bridge profile', () => {
    const env = bridgeProfileEnvironment('SafeProfile', {}, '/safe/lark-channel');
    expect(env).toMatchObject({
      LARK_CHANNEL: '1',
      LARK_CHANNEL_HOME: '/safe/lark-channel',
      LARK_CHANNEL_PROFILE: 'SafeProfile',
      LARK_CHANNEL_CONFIG: '/safe/lark-channel/profiles/SafeProfile/lark-cli-source/config.json',
      LARKSUITE_CLI_CONFIG_DIR: '/safe/lark-channel/profiles/SafeProfile/lark-cli',
    });
    expect(() => bridgeProfileEnvironment('../escape', {}, '/safe/lark-channel')).toThrow(
      'invalid',
    );
  });

  it('parses the flat lark-cli receive event', () => {
    expect(
      parseImCommandEvent({
        type: 'im.message.receive_v1',
        event_id: 'safe-event-1',
        message_id: 'safe-message-1',
        message_type: 'text',
        chat_id: 'safe-chat',
        sender_id: 'safe-user',
        content: '确认 R-0002',
      }),
    ).toMatchObject({
      eventId: 'safe-event-1',
      messageId: 'safe-message-1',
      content: '确认 R-0002',
    });
  });
});
