import { chmod, readFile, rm, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runCli, type CliIO } from '../src/cli.js';
import { readMachineConfig } from '../src/config.js';
import { diagnose, highestDiagnosticLevel } from '../src/doctor.js';
import { ExitCode } from '../src/exit-codes.js';
import { initializeWorkspace } from '../src/init.js';
import { validateSafeDirectory } from '../src/path-safety.js';

const testRoots: string[] = [];

function testRoot(name: string): string {
  const root = resolve('tmp', `stage1-${process.pid}-${name}`);
  testRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('safe path validation', () => {
  it('rejects filesystem, home and temporary roots', () => {
    expect(() => validateSafeDirectory('/', 'workspace')).toThrow('filesystem root');
    expect(() => validateSafeDirectory(homedir(), 'workspace')).toThrow('home root');
    expect(() => validateSafeDirectory(tmpdir(), 'workspace')).toThrow('temporary');
    expect(() => validateSafeDirectory(join(tmpdir(), 'nested'), 'library')).toThrow('temporary');
  });

  it('rejects relative paths', () => {
    expect(() => validateSafeDirectory('relative/path', 'workspace')).toThrow('absolute');
  });
});

describe('Stage 1 initialization', () => {
  it('separates machine config from semantic Skill', async () => {
    const root = testRoot('separation');
    const workspaceRoot = join(root, 'workspace');
    const libraryRoot = join(root, 'library');
    const result = await initializeWorkspace(
      {
        workspaceRoot,
        libraryRoot,
        source: '本人飞书妙记',
        categories: ['工作', '学习'],
        retentionRule: '保留原始证据、结论和未明确的候选待办。',
      },
      new Date('2026-07-30T00:00:00.000Z'),
    );

    const config = await readMachineConfig(workspaceRoot);
    const skill = await readFile(result.skillPath, 'utf8');
    const configMode = (await stat(join(workspaceRoot, '.recording-agent', 'config.json'))).mode;

    expect(config.libraryRoot).toBe(libraryRoot);
    expect(config.bridgeProfile).toBe('PersonalAgent');
    expect(configMode & 0o777).toBe(0o600);
    expect(skill).toContain('本人飞书妙记');
    expect(skill).toContain('- 工作');
    expect(skill).toContain('未明确');
    expect(skill).not.toContain(workspaceRoot);
    expect(skill).not.toContain(libraryRoot);
    expect(skill).not.toContain('PersonalAgent');
  });

  it('asks one question at a time in the required order', async () => {
    const root = testRoot('interactive');
    const prompts: string[] = [];
    const answers = [
      join(root, 'workspace'),
      '本人飞书妙记',
      '工作,学习',
      join(root, 'library'),
      '保留证据和人工意见',
    ];
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io: CliIO = {
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
      question: (prompt) => {
        prompts.push(prompt);
        return Promise.resolve(answers[prompts.length - 1] ?? '');
      },
    };

    expect(await runCli(['init'], io)).toBe(ExitCode.success);
    expect(prompts).toEqual([
      'Starter workspace 的绝对路径：',
      '录音来源是什么？',
      '分类体系是什么？请用英文逗号分隔：',
      'Markdown 入库位置的绝对路径：',
      '哪些内容需要沉淀？',
    ]);
    expect(stderr).toEqual([]);
    expect(stdout.join('\n')).toContain('No credentials');
  });
});

describe('doctor', () => {
  it('returns red for a missing config', async () => {
    const diagnostics = await diagnose(testRoot('missing'));
    expect(highestDiagnosticLevel(diagnostics)).toBe('red');
  });

  it('detects machine data leaked into the Skill', async () => {
    const root = testRoot('leak');
    const workspaceRoot = join(root, 'workspace');
    const libraryRoot = join(root, 'library');
    const result = await initializeWorkspace({
      workspaceRoot,
      libraryRoot,
      source: '安全样本',
      categories: ['默认'],
      retentionRule: '保留证据',
    });
    await chmod(result.skillPath, 0o600);
    const original = await readFile(result.skillPath, 'utf8');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(result.skillPath, `${original}\n${libraryRoot}\n`, 'utf8');

    const diagnostics = await diagnose(workspaceRoot);
    expect(diagnostics).toContainEqual({
      level: 'red',
      name: 'skill',
      message: 'contains machine configuration',
    });
  });

  it('can reach all green in live mode only when each external prerequisite verifies', async () => {
    const root = testRoot('live-doctor');
    const workspaceRoot = join(root, 'workspace');
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot: join(root, 'library'),
      source: '安全样本',
      categories: ['默认'],
      retentionRule: '保留证据',
      bridgeProfile: 'SafeProfile',
      confirmationTarget: {
        kind: 'chat',
        id: 'safe-chat-target',
        identity: 'bot',
      },
    });
    const diagnostics = await diagnose(workspaceRoot, {
      live: true,
      runCommand: (command, args) => {
        if (command === 'lark-channel-bridge' && args[0] === 'profile') {
          return {
            status: 0,
            stdout: 'ACTIVE PROFILE AGENT STATUS\n* SafeProfile codex stopped\n',
            stderr: '',
          };
        }
        if (command === 'lark-cli' && args[0] === 'auth') {
          return {
            status: 0,
            stdout: JSON.stringify({
              verified: true,
              identities: { user: { status: 'ready', tokenStatus: 'valid' } },
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: `${command} safe-version\n`, stderr: '' };
      },
    });
    expect(highestDiagnosticLevel(diagnostics)).toBe('green');
  });
});
