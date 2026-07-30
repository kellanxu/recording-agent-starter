import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { bridgeProfileEnvironment } from './bridge-profile.js';
import { readMachineConfig } from './config.js';

export type DiagnosticLevel = 'green' | 'yellow' | 'red';

export interface Diagnostic {
  level: DiagnosticLevel;
  name: string;
  message: string;
}

export interface DoctorOptions {
  live?: boolean;
  runCommand?: (
    command: string,
    args: readonly string[],
    options?: { env?: NodeJS.ProcessEnv },
  ) => { status: number | null; stdout: string; stderr: string; error?: Error };
}

function defaultRunCommand(
  command: string,
  args: readonly string[],
  options: { env?: NodeJS.ProcessEnv } = {},
): { status: number | null; stdout: string; stderr: string; error?: Error } {
  const result = spawnSync(command, args, { encoding: 'utf8', env: options.env });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    ...(result.error === undefined ? {} : { error: result.error }),
  };
}

function commandDiagnostic(
  name: string,
  command: string,
  runCommand: NonNullable<DoctorOptions['runCommand']>,
): Diagnostic {
  const result = runCommand(command, ['--version']);
  if (result.error !== undefined || result.status !== 0) {
    return { level: 'yellow', name, message: 'not available on PATH' };
  }
  const version = `${result.stdout}${result.stderr}`.trim().split('\n')[0] ?? 'detected';
  return { level: 'green', name, message: version };
}

export async function diagnose(
  workspaceRoot: string,
  options: DoctorOptions = {},
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const runCommand = options.runCommand ?? defaultRunCommand;

  let config;
  try {
    config = await readMachineConfig(workspaceRoot);
    diagnostics.push({ level: 'green', name: 'config', message: 'valid and readable' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown config error';
    return [{ level: 'red', name: 'config', message }];
  }

  try {
    await access(config.libraryRoot, constants.R_OK | constants.W_OK);
    diagnostics.push({ level: 'green', name: 'library', message: 'readable and writable' });
  } catch {
    diagnostics.push({ level: 'red', name: 'library', message: 'not readable and writable' });
  }

  const skillPath = join(
    config.workspaceRoot,
    'skills',
    'personal-recording-processor',
    'SKILL.md',
  );
  try {
    const skill = await readFile(skillPath, 'utf8');
    const leaksMachineData =
      skill.includes(config.workspaceRoot) ||
      skill.includes(config.libraryRoot) ||
      skill.includes(config.bridgeProfile) ||
      (config.confirmationTarget !== undefined && skill.includes(config.confirmationTarget.id));
    diagnostics.push({
      level: leaksMachineData ? 'red' : 'green',
      name: 'skill',
      message: leaksMachineData ? 'contains machine configuration' : 'semantic rules are separated',
    });
  } catch {
    diagnostics.push({ level: 'red', name: 'skill', message: 'missing or unreadable' });
  }

  diagnostics.push(commandDiagnostic('codex', 'codex', runCommand));
  diagnostics.push(commandDiagnostic('bridge', 'lark-channel-bridge', runCommand));
  diagnostics.push(commandDiagnostic('lark-cli', 'lark-cli', runCommand));
  diagnostics.push(
    config.confirmationTarget === undefined
      ? {
          level: 'yellow',
          name: 'confirmation-target',
          message: 'not configured; live records cannot send a confirmation sheet',
        }
      : {
          level: 'green',
          name: 'confirmation-target',
          message: `${config.confirmationTarget.kind} target configured for ${config.confirmationTarget.identity} identity`,
        },
  );
  if (options.live === true) {
    diagnostics.push(...liveDiagnostics(config.bridgeProfile, runCommand));
  } else {
    diagnostics.push({
      level: 'yellow',
      name: 'authorization',
      message: 'live Codex, bridge profile and Feishu authorization were not exercised',
    });
  }

  return diagnostics;
}

function liveDiagnostics(
  bridgeProfile: string,
  runCommand: NonNullable<DoctorOptions['runCommand']>,
): Diagnostic[] {
  const codex = runCommand('codex', ['login', 'status']);
  const bridge = runCommand('lark-channel-bridge', ['profile', 'list']);
  const lark = runCommand('lark-cli', ['auth', 'status', '--json', '--verify']);
  const bridgeLark = runCommand('lark-cli', ['auth', 'status', '--json', '--verify'], {
    env: bridgeProfileEnvironment(bridgeProfile),
  });
  let larkReady = false;
  let bridgeBotReady = false;
  try {
    const status = JSON.parse(lark.stdout) as {
      verified?: boolean;
      identities?: { user?: { status?: string; tokenStatus?: string } };
    };
    larkReady =
      lark.status === 0 &&
      status.verified === true &&
      status.identities?.user?.status === 'ready' &&
      status.identities.user.tokenStatus === 'valid';
  } catch {
    larkReady = false;
  }
  try {
    const status = JSON.parse(bridgeLark.stdout) as {
      verified?: boolean;
      identities?: { bot?: { status?: string } };
    };
    bridgeBotReady =
      bridgeLark.status === 0 &&
      status.verified === true &&
      status.identities?.bot?.status === 'ready';
  } catch {
    bridgeBotReady = false;
  }
  const bridgeProfileFound =
    bridge.status === 0 &&
    bridge.stdout
      .split('\n')
      .slice(1)
      .some((line) => line.trim().split(/\s+/).includes(bridgeProfile));
  return [
    {
      level: codex.status === 0 ? 'green' : 'red',
      name: 'codex-login',
      message: codex.status === 0 ? 'logged in' : 'not logged in',
    },
    {
      level: bridgeProfileFound ? 'green' : 'red',
      name: 'bridge-profile',
      message: bridgeProfileFound ? 'configured profile found' : 'configured profile not found',
    },
    {
      level: larkReady ? 'green' : 'red',
      name: 'feishu-user-auth',
      message: larkReady ? 'verified and valid' : 'not ready or invalid',
    },
    {
      level: bridgeBotReady ? 'green' : 'red',
      name: 'feishu-bridge-bot-auth',
      message: bridgeBotReady ? 'verified and ready' : 'not ready or invalid',
    },
  ];
}

export function highestDiagnosticLevel(diagnostics: readonly Diagnostic[]): DiagnosticLevel {
  if (diagnostics.some((diagnostic) => diagnostic.level === 'red')) return 'red';
  if (diagnostics.some((diagnostic) => diagnostic.level === 'yellow')) return 'yellow';
  return 'green';
}
