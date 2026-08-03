import type { ChildProcess } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BRIDGE_HOOK_MARK,
  dispatchBridgeMinutesEvent,
  MINUTES_EVENT_TYPE,
  patchChannelPrototype,
  sanitizeBridgeMinutesEvent,
} from '../src/bridge-hook-runtime.js';
import {
  bridgeLaunchAgentPlist,
  installBridgeHook,
  withBridgeHookArguments,
} from '../src/bridge-hook-install.js';
import { bridgeProfileEnvironment } from '../src/bridge-profile.js';
import { initializeWorkspace } from '../src/init.js';
import { minutesSubscriptionReady, subscribeMinutesEvent } from '../src/minutes-subscription.js';

const testRoots: string[] = [];

function testRoot(name: string): string {
  const root = resolve('tmp', `bridge-hook-${process.pid}-${name}`);
  testRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('single-connection Bridge hook', () => {
  it('sanitizes raw Minutes events and excludes unrecognized fields', () => {
    const event = sanitizeBridgeMinutesEvent({
      header: {
        event_type: MINUTES_EVENT_TYPE,
        event_id: 'safe-event-1',
        create_time: '1785379200000',
      },
      event: {
        minute_token: 'obcnabc123',
        title: '安全录音',
        ignored_secret: 'must-not-pass',
      },
    });
    expect(event).toEqual({
      type: MINUTES_EVENT_TYPE,
      event_id: 'safe-event-1',
      timestamp: '1785379200000',
      minute_token: 'obcnabc123',
      title: '安全录音',
    });
  });

  it('adds Minutes handling without removing the Bridge message handler', () => {
    const registered: string[] = [];
    const prototype: Parameters<typeof patchChannelPrototype>[0] = {
      registerDispatcherHandlers(this: { dispatcher: { register(value: object): void } }) {
        this.dispatcher.register({ 'im.message.receive_v1': () => undefined });
      },
    };
    expect(patchChannelPrototype(prototype)).toBe(true);
    prototype.registerDispatcherHandlers.call({
      dispatcher: { register: (handlers) => registered.push(...Object.keys(handlers)) },
    });
    expect(registered).toEqual(['im.message.receive_v1', MINUTES_EVENT_TYPE]);
    expect(prototype[BRIDGE_HOOK_MARK]).toBe(true);
    expect(patchChannelPrototype(prototype)).toBe(false);
  });

  it('dispatches one sanitized event over stdin only when the active link is enabled', async () => {
    const root = testRoot('dispatch');
    const workspaceRoot = join(root, 'workspace');
    const recordingAgentHome = join(root, 'recording-home');
    await Promise.all([
      mkdir(join(workspaceRoot, 'logs'), { recursive: true }),
      mkdir(recordingAgentHome, { recursive: true }),
    ]);
    await writeFile(
      join(recordingAgentHome, 'bridge.json'),
      JSON.stringify({
        schemaVersion: 1,
        workspaceRoot,
        command: ['/safe/node', '/safe/cli.js'],
        eventEnabled: true,
        linkedAt: '2026-08-03T00:00:00.000Z',
      }),
      'utf8',
    );
    const stdin = new PassThrough();
    let payload = '';
    stdin.on('data', (chunk) => {
      payload += String(chunk);
    });
    const unref = vi.fn();
    const spawnProcess = vi.fn(() => ({ stdin, unref }) as unknown as ChildProcess);
    expect(
      dispatchBridgeMinutesEvent(
        {
          type: MINUTES_EVENT_TYPE,
          event_id: 'safe-event-2',
          timestamp: '1785379200000',
          minute_token: 'obcndef456',
        },
        { recordingAgentHome, spawnProcess },
      ),
    ).toBe(true);
    await new Promise((resolvePromise) => stdin.once('finish', resolvePromise));
    expect(spawnProcess).toHaveBeenCalledWith(
      '/safe/node',
      ['/safe/cli.js', 'ingest-event', '--workspace', workspaceRoot],
      expect.objectContaining({ cwd: workspaceRoot, detached: true }),
    );
    expect(JSON.parse(payload)).toMatchObject({ event_id: 'safe-event-2' });
    expect(unref).toHaveBeenCalledOnce();
    expect(await readFile(join(workspaceRoot, 'logs', 'bridge-hook.ndjson'), 'utf8')).toContain(
      'event_dispatched',
    );
  });
});

describe('Bridge LaunchAgent argument patch', () => {
  it('inserts the preload before the Bridge entry and remains idempotent', () => {
    const original = ['/safe/node', '/safe/lark-channel-bridge', 'run', '--profile', 'SafeProfile'];
    const once = withBridgeHookArguments(original, '/safe/bridge-hook.js');
    expect(once).toEqual([
      '/safe/node',
      '--import',
      '/safe/bridge-hook.js',
      '/safe/lark-channel-bridge',
      'run',
      '--profile',
      'SafeProfile',
    ]);
    expect(withBridgeHookArguments(once, '/safe/bridge-hook.js')).toEqual(once);
  });

  it('refuses to stack a second Minutes hook', () => {
    expect(() =>
      withBridgeHookArguments(
        ['/safe/node', '--import', '/safe/other-minutes-hook.mjs', '/safe/bridge'],
        '/safe/bridge-hook.js',
      ),
    ).toThrow('another Minutes Bridge hook');
  });

  it('installs once, verifies launchd, and does not restart an already hooked service', async () => {
    const root = testRoot('install');
    const home = join(root, 'home');
    const plistPath = bridgeLaunchAgentPlist('SafeProfile', home);
    await mkdir(join(home, 'Library', 'LaunchAgents'), { recursive: true });
    await writeFile(plistPath, 'original-plist', 'utf8');
    let current = ['/safe/node', '/safe/bridge', 'run', '--profile', 'SafeProfile'];
    const calls: string[] = [];
    const runCommand = (
      command: string,
      args: readonly string[],
    ): Promise<{ stdout: string; stderr: string }> => {
      calls.push(`${command} ${args.join(' ')}`);
      if (command === 'plutil' && args[0] === '-extract') {
        return Promise.resolve({ stdout: JSON.stringify(current), stderr: '' });
      }
      if (command === 'plutil' && args[0] === '-replace') {
        current = JSON.parse(args[3] ?? '[]') as string[];
      }
      return Promise.resolve({ stdout: '', stderr: '' });
    };

    const first = await installBridgeHook('SafeProfile', '/safe/bridge-hook.js', {
      home,
      runCommand,
    });
    expect(first.changed).toBe(true);
    expect(current).toEqual([
      '/safe/node',
      '--import',
      '/safe/bridge-hook.js',
      '/safe/bridge',
      'run',
      '--profile',
      'SafeProfile',
    ]);
    expect(await readFile(`${plistPath}.recording-agent-starter.bak`, 'utf8')).toBe(
      'original-plist',
    );
    expect(calls.some((call) => call.startsWith('launchctl bootstrap '))).toBe(true);
    expect(calls.at(-1)).toMatch(/^launchctl print /u);

    calls.length = 0;
    const second = await installBridgeHook('SafeProfile', '/safe/bridge-hook.js', {
      home,
      runCommand,
    });
    expect(second.changed).toBe(false);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatch(/^plutil -extract/u);
    expect(calls[1]).toMatch(/^launchctl print /u);
  });

  it('restores the original Bridge arguments when the patched service cannot restart', async () => {
    const root = testRoot('rollback');
    const home = join(root, 'home');
    const plistPath = bridgeLaunchAgentPlist('SafeProfile', home);
    await mkdir(join(home, 'Library', 'LaunchAgents'), { recursive: true });
    await writeFile(plistPath, 'original-plist', 'utf8');
    const original = ['/safe/node', '/safe/bridge', 'run', '--profile', 'SafeProfile'];
    let current = [...original];
    let bootstrapCalls = 0;
    const runCommand = (
      command: string,
      args: readonly string[],
    ): Promise<{ stdout: string; stderr: string }> => {
      if (command === 'plutil' && args[0] === '-extract') {
        return Promise.resolve({ stdout: JSON.stringify(current), stderr: '' });
      }
      if (command === 'plutil' && args[0] === '-replace') {
        current = JSON.parse(args[3] ?? '[]') as string[];
      }
      if (command === 'launchctl' && args[0] === 'bootstrap') {
        bootstrapCalls += 1;
        if (bootstrapCalls === 1) return Promise.reject(new Error('simulated restart failure'));
      }
      return Promise.resolve({ stdout: '', stderr: '' });
    };

    await expect(
      installBridgeHook('SafeProfile', '/safe/bridge-hook.js', { home, runCommand }),
    ).rejects.toThrow('original service was restored');
    expect(current).toEqual(original);
    expect(bootstrapCalls).toBe(2);
  });
});

describe('same-app user subscription', () => {
  it('uses the profile user runtime and records only a redacted acknowledgement', async () => {
    const root = testRoot('subscription');
    const workspaceRoot = join(root, 'workspace');
    await initializeWorkspace({
      workspaceRoot,
      libraryRoot: join(root, 'library'),
      source: '本人飞书妙记',
      categories: ['工作'],
      retentionRule: '保留证据',
      bridgeProfile: 'SafeProfile',
    });
    const calls: Array<{ command: string; args: readonly string[]; env?: NodeJS.ProcessEnv }> = [];
    const first = await subscribeMinutesEvent(workspaceRoot, {
      now: () => new Date('2026-08-03T00:00:00.000Z'),
      runCommand: (command, args, options) => {
        calls.push({ command, args, env: options.env });
        return Promise.resolve({ stdout: JSON.stringify({ ok: true }), stderr: '' });
      },
    });
    const second = await subscribeMinutesEvent(workspaceRoot, {
      runCommand: () => Promise.reject(new Error('must not subscribe twice')),
    });
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toContain('/open-apis/minutes/v1/minutes/subscription');
    expect(calls[0]?.env?.LARKSUITE_CLI_CONFIG_DIR).toMatch(/SafeProfile\/lark-cli-user$/u);
    expect(await minutesSubscriptionReady(workspaceRoot)).toBe(true);
    const receipt = await readFile(
      join(workspaceRoot, 'state', 'minutes-subscription.json'),
      'utf8',
    );
    expect(receipt).not.toMatch(/app[_-]?id|open[_-]?id|token|secret/iu);
  });

  it('keeps bot and user credentials in isolated directories under one Bridge profile', () => {
    const bot = bridgeProfileEnvironment('SafeProfile', {}, '/safe/channel', 'bot');
    const user = bridgeProfileEnvironment('SafeProfile', {}, '/safe/channel', 'user');
    expect(bot.LARK_CHANNEL_CONFIG).toBe(user.LARK_CHANNEL_CONFIG);
    expect(bot.LARKSUITE_CLI_CONFIG_DIR).toBe('/safe/channel/profiles/SafeProfile/lark-cli');
    expect(user.LARKSUITE_CLI_CONFIG_DIR).toBe('/safe/channel/profiles/SafeProfile/lark-cli-user');
  });
});
