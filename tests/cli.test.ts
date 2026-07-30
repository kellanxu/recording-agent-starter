import { describe, expect, it } from 'vitest';

import { helpText, runCli, type CliIO } from '../src/cli.js';
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
  it('prints help and exits successfully', async () => {
    const output = capture();

    expect(await runCli(['--help'], output.io)).toBe(ExitCode.success);
    expect(output.stdout).toEqual([helpText()]);
    expect(output.stderr).toEqual([]);
  });

  it('rejects unknown commands with the usage exit code', async () => {
    const output = capture();

    expect(await runCli(['unexpected'], output.io)).toBe(ExitCode.usage);
    expect(output.stdout).toEqual([]);
    expect(output.stderr.join('\n')).toContain('Unknown command');
  });
});
