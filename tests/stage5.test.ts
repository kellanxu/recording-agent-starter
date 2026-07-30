import { readFile, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runCli, type CliIO } from '../src/cli.js';
import { ExitCode } from '../src/exit-codes.js';
import { renderLaunchdPlist } from '../src/launchd.js';
import { initializeWorkspace } from '../src/init.js';
import {
  publicServiceStatus,
  readServiceState,
  type ServiceState,
  writeServiceState,
} from '../src/service-state.js';

const testRoots: string[] = [];

function testRoot(name: string): string {
  const root = resolve('tmp', `stage5-${process.pid}-${name}`);
  testRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function capture(): { io: CliIO; stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
    },
    stdout,
    stderr,
  };
}

describe('macOS launchd contract', () => {
  it('renders restart recovery and local log paths without credentials', () => {
    const plist = renderLaunchdPlist('/safe/workspace', '/safe/node', '/safe/runtime.js');
    expect(plist).toContain('<key>RunAtLoad</key>');
    expect(plist).toContain('<key>KeepAlive</key>');
    expect(plist).toContain('/safe/workspace/logs/service.stdout.log');
    expect(plist).toContain('<string>--workspace</string>');
    expect(plist).toContain('.local/bin');
    expect(plist).toContain('/safe');
    expect(plist).not.toMatch(/Transcript|secret|token/i);
  });
});

describe('service state', () => {
  it('persists a redacted status with restricted permissions', async () => {
    const root = testRoot('state');
    const state: ServiceState = {
      schemaVersion: 1,
      status: 'running',
      pid: 12345,
      platform: 'darwin',
      startedAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:01.000Z',
      minuteConsumerReady: true,
      imConsumerReady: true,
      processedCount: 2,
      pendingCount: 1,
      failedCount: 0,
    };
    await writeServiceState(root, state);
    expect(await readServiceState(root)).toEqual(state);
    expect((await stat(join(root, 'state', 'service.json'))).mode & 0o777).toBe(0o600);
    const publicStatus = JSON.stringify(publicServiceStatus(state));
    expect(publicStatus).not.toMatch(/transcript|minute_token|secret|credential/i);
  });

  it('allows concurrent atomic state writes without temporary-path collisions', async () => {
    const root = testRoot('concurrent-state');
    const states = Array.from({ length: 20 }, (_, index): ServiceState => ({
      schemaVersion: 1,
      status: 'running',
      pid: 12000 + index,
      platform: 'darwin',
      startedAt: '2026-07-30T00:00:00.000Z',
      updatedAt: `2026-07-30T00:00:${String(index).padStart(2, '0')}.000Z`,
      minuteConsumerReady: true,
      imConsumerReady: true,
      processedCount: index,
      pendingCount: 0,
      failedCount: 0,
    }));
    await Promise.all(states.map((state) => writeServiceState(root, state)));
    const parsed = JSON.parse(
      await readFile(join(root, 'state', 'service.json'), 'utf8'),
    ) as ServiceState;
    expect(states).toContainEqual(parsed);
  });
});

describe('lifecycle safety gate', () => {
  it('shows the exact configured target and stops before launch without consent', async () => {
    const root = testRoot('gate');
    const workspaceRoot = join(root, 'workspace');
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot: join(root, 'library'),
      source: '本人飞书妙记',
      categories: ['工作'],
      retentionRule: '保留证据',
      confirmationTarget: {
        kind: 'chat',
        id: 'safe-chat-target',
        identity: 'bot',
      },
    });
    const output = capture();
    expect(await runCli(['start', '--workspace', workspaceRoot], output.io)).toBe(ExitCode.usage);
    expect(output.stdout.join('\n')).toContain('chat safe-chat-target');
    expect(output.stdout.join('\n')).toContain('Sending identity: bot');
    expect(output.stderr.join('\n')).toContain('stopped before external changes');
    expect(await readServiceState(workspaceRoot)).toBeUndefined();
  });

  it('reports not_started without exposing machine configuration', async () => {
    const root = testRoot('status');
    const workspaceRoot = join(root, 'workspace');
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot: join(root, 'library'),
      source: '本人飞书妙记',
      categories: ['工作'],
      retentionRule: '保留证据',
    });
    const output = capture();
    expect(await runCli(['status', '--workspace', workspaceRoot], output.io)).toBe(
      ExitCode.success,
    );
    expect(output.stdout.join('\n')).toContain('"status": "not_started"');
    expect(output.stdout.join('\n')).not.toContain(join(root, 'library'));
  });
});
