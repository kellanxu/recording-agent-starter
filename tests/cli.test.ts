import { symlink, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { commandHelpText, helpText, mainModuleMatches, runCli, type CliIO } from '../src/cli.js';
import { ExitCode } from '../src/exit-codes.js';

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

describe('CLI baseline', () => {
  it('recognizes a globally linked symlink as the executable module', async () => {
    const root = resolve('tmp', `cli-symlink-${process.pid}`);
    const target = join(root, 'cli.js');
    const link = join(root, 'recording-agent');
    const { mkdir, rm } = await import('node:fs/promises');
    await mkdir(root, { recursive: true });
    try {
      await writeFile(target, '#!/usr/bin/env node\n', 'utf8');
      await symlink(target, link);
      expect(mainModuleMatches(link, pathToFileURL(target).href)).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints help and exits successfully', async () => {
    const output = capture();

    expect(await runCli(['--help'], output.io)).toBe(ExitCode.success);
    expect(output.stdout).toEqual([helpText()]);
    expect(output.stdout[0]).toContain('Recording Agent Starter 0.2.0');
    expect(output.stdout[0]).toContain('one Feishu app and one Bridge connection');
    expect(output.stderr).toEqual([]);
  });

  it('rejects unknown commands with the usage exit code', async () => {
    const output = capture();

    expect(await runCli(['unexpected'], output.io)).toBe(ExitCode.usage);
    expect(output.stdout).toEqual([]);
    expect(output.stderr.join('\n')).toContain('Unknown command');
  });

  it('prints command help without performing the command', async () => {
    const output = capture();

    expect(await runCli(['start', '--help'], output.io)).toBe(ExitCode.success);
    expect(output.stdout).toEqual([commandHelpText('start')]);
    expect(output.stderr).toEqual([]);
  });
});
