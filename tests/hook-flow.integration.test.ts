import { chmod, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { delimiter, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runCli, type CliIO } from '../src/cli.js';
import { ExitCode } from '../src/exit-codes.js';
import { initializeWorkspace } from '../src/init.js';

const testRoots: string[] = [];

function testRoot(name: string): string {
  const root = resolve('tmp', `hook-flow-${process.pid}-${name}`);
  testRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function ioFor(payload: object): { io: CliIO; stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
      readStdin: () => Promise.resolve(`${JSON.stringify(payload)}\n`),
    },
    stdout,
    stderr,
  };
}

describe('Bridge Hook process boundary', () => {
  it('creates one record and one confirmation, then deduplicates event replay', async () => {
    const root = testRoot('e2e');
    const workspaceRoot = join(root, 'workspace');
    const libraryRoot = join(root, 'library');
    const bin = join(root, 'bin');
    const callLog = join(root, 'lark-calls.log');
    await mkdir(bin, { recursive: true });
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot,
      source: '本人飞书妙记',
      categories: ['工作'],
      retentionRule: '保留证据和人工意见',
      bridgeProfile: 'SafeProfile',
      confirmationTarget: { kind: 'chat', id: 'safe-chat-target', identity: 'bot' },
    });

    const fakeLark = join(bin, 'lark-cli');
    await writeFile(
      fakeLark,
      `#!/usr/bin/env node
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
appendFileSync(${JSON.stringify(callLog)}, process.argv.slice(2, 4).join(' ') + '\\n');
if (process.argv[2] === 'minutes') {
  mkdirSync(join(process.cwd(), 'runtime', 'minutes'), { recursive: true });
  writeFileSync(join(process.cwd(), 'runtime', 'minutes', 'safe-transcript.txt'), '这是安全逐字稿。');
  process.stdout.write(JSON.stringify({ ok: true, data: { minutes: [{ title: '安全录音', artifacts: { transcript_file: 'runtime/minutes/safe-transcript.txt' } }] } }));
} else if (process.argv[2] === 'im') {
  process.stdout.write(JSON.stringify({ ok: true, data: { message_id: 'safe-message-id' } }));
} else {
  process.stderr.write(JSON.stringify({ ok: false, error: { type: 'unexpected_fake_call' } }));
  process.exitCode = 1;
}
`,
      'utf8',
    );
    const fakeCodex = join(bin, 'codex');
    await writeFile(
      fakeCodex,
      `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const output = args[args.indexOf('--output-last-message') + 1];
writeFileSync(output, JSON.stringify({ schemaVersion: 1, title: '安全整理', category: '工作', summary: '安全总结', evidence: ['安全证据'], candidateActions: [{ action: '人工确认' }] }));
process.stdin.resume();
process.stdin.on('end', () => process.exit(0));
`,
      'utf8',
    );
    await Promise.all([chmod(fakeLark, 0o700), chmod(fakeCodex, 0o700)]);

    const originalPath = process.env.PATH;
    process.env.PATH = `${bin}${delimiter}${originalPath ?? ''}`;
    try {
      const payload = {
        type: 'minutes.minute.generated_v1',
        event_id: 'safe-hook-event-1',
        timestamp: '1785379200000',
        minute_token: 'obcnsafehook1',
        title: '安全录音',
      };
      const first = ioFor(payload);
      expect(await runCli(['ingest-event', '--workspace', workspaceRoot], first.io)).toBe(
        ExitCode.success,
      );
      expect(first.stderr).toEqual([]);
      expect(first.stdout.join('\n')).toContain('"outcome":"processed"');

      const second = ioFor(payload);
      expect(await runCli(['ingest-event', '--workspace', workspaceRoot], second.io)).toBe(
        ExitCode.success,
      );
      expect(second.stdout.join('\n')).toContain('"outcome":"duplicate_event"');

      const records = await readdir(join(libraryRoot, '工作'));
      expect(records).toEqual(['R-0002.md']);
      const record = await readFile(join(libraryRoot, '工作', 'R-0002.md'), 'utf8');
      expect(record).toContain('安全逐字稿');
      expect(record).toContain('status: "pending_confirmation"');
      expect(record).toContain('根据飞书妙记创建主记录');
      expect((await readFile(callLog, 'utf8')).trim().split('\n')).toEqual([
        'minutes +detail',
        'im +messages-send',
      ]);
    } finally {
      if (originalPath === undefined) delete process.env.PATH;
      else process.env.PATH = originalPath;
    }
  });
});
