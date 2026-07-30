import { readFile, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import type { CodexRunner, CodexRunnerOutput } from '../src/codex-runner.js';
import { initializeWorkspace } from '../src/init.js';
import { runSample, SAMPLE_RECORDING_ID } from '../src/sample.js';

const testRoots: string[] = [];

function testRoot(name: string): string {
  const root = resolve('tmp', `stage2-${process.pid}-${name}`);
  testRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function initialized(name: string): Promise<{ workspaceRoot: string; libraryRoot: string }> {
  const root = testRoot(name);
  const workspaceRoot = join(root, 'workspace');
  const libraryRoot = join(root, 'library');
  await initializeWorkspace({
    workspaceRoot,
    libraryRoot,
    source: '安全离线样本',
    categories: ['默认', '学习'],
    retentionRule: '保留证据、结论和人工意见',
  });
  return { workspaceRoot, libraryRoot };
}

describe('Stage 2 offline sample', () => {
  it('creates one auditable Markdown main record', async () => {
    const { workspaceRoot, libraryRoot } = await initialized('record');
    const result = await runSample(workspaceRoot, undefined, new Date('2026-07-30T01:02:03.000Z'));
    const record = await readFile(result.recordPath, 'utf8');

    expect(result.created).toBe(true);
    expect(result.recordPath).toBe(
      join(libraryRoot, '默认', `${SAMPLE_RECORDING_ID}-offline-sample.md`),
    );
    expect(record).toContain('recording_id: "R-0001"');
    expect(record).toContain('source_kind: "offline-sample"');
    expect(record).toContain('status: "pending_confirmation"');
    expect(record).toContain('## 原始证据');
    expect(record).toContain('## AI 整理');
    expect(record).toContain('## 候选待办');
    expect(record).toContain('## 人工确认');
    expect(record).toContain('## 审计');
    expect(record).toContain('对象：未明确');
    expect(record).toContain('时间：未明确');
    expect(record).toContain('验收：未明确');
  });

  it('does not create a duplicate when repeated', async () => {
    const { workspaceRoot, libraryRoot } = await initialized('dedupe');

    expect((await runSample(workspaceRoot)).created).toBe(true);
    expect((await runSample(workspaceRoot)).created).toBe(false);
    expect(await readdir(join(libraryRoot, '默认'))).toEqual([
      `${SAMPLE_RECORDING_ID}-offline-sample.md`,
    ]);
  });

  it('rejects a runner category outside the configured taxonomy', async () => {
    const { workspaceRoot } = await initialized('category');
    const runner: CodexRunner = {
      run: (): Promise<CodexRunnerOutput> =>
        Promise.resolve({
          schemaVersion: 1,
          title: '错误分类',
          category: '不存在',
          summary: '不应写入',
          evidence: [],
          candidateActions: [],
        }),
    };

    await expect(runSample(workspaceRoot, runner)).rejects.toThrow('unknown category');
  });
});
