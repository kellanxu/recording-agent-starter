import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bridgeHookInstalled } from './bridge-hook-install.js';
import { bridgeProfileEnvironment } from './bridge-profile.js';
import { bridgeReplyLinked } from './bridge-reply.js';
import { readMachineConfig } from './config.js';
import { minutesSubscriptionReady } from './minutes-subscription.js';

export type DiagnosticLevel = 'green' | 'yellow' | 'red';

export interface Diagnostic {
  level: DiagnosticLevel;
  name: string;
  message: string;
}

const REQUIRED_MINUTES_USER_SCOPES = [
  'minutes:minutes.basic:read',
  'minutes:minutes.search:read',
  'minutes:minutes.media:export',
] as const;

export interface DoctorOptions {
  live?: boolean;
  isBridgeReplyLinked?: (workspaceRoot: string) => Promise<boolean>;
  isBridgeHookInstalled?: (profile: string, hookEntry: string) => Promise<boolean>;
  isMinutesSubscriptionReady?: (workspaceRoot: string) => Promise<boolean>;
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

function capabilityDiagnostic(
  name: string,
  command: string,
  probes: readonly (readonly string[])[],
  installHint: string,
  runCommand: NonNullable<DoctorOptions['runCommand']>,
): Diagnostic {
  const version = runCommand(command, ['--version']);
  if (version.error !== undefined || version.status !== 0) {
    return {
      level: 'yellow',
      name,
      message: `not checked because ${command} is not available on PATH; ${installHint}`,
    };
  }

  const missing = probes.filter((args) => {
    const result = runCommand(command, args);
    return result.error !== undefined || result.status !== 0;
  });
  if (missing.length > 0) {
    return {
      level: 'red',
      name,
      message: `installed command lacks required capabilities (${missing
        .map((args) => args.slice(0, -1).join(' '))
        .join(', ')}); ${installHint}`,
    };
  }
  return { level: 'green', name, message: 'required commands are available' };
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
  diagnostics.push(
    capabilityDiagnostic(
      'bridge-capabilities',
      'lark-channel-bridge',
      [
        ['profile', '--help'],
        ['start', '--help'],
        ['status', '--help'],
      ],
      'install the course-verified lark-channel-bridge from zarazhangrui/feishu-claude-code-bridge',
      runCommand,
    ),
  );
  diagnostics.push(commandDiagnostic('lark-cli', 'lark-cli', runCommand));
  diagnostics.push(
    capabilityDiagnostic(
      'lark-cli-capabilities',
      'lark-cli',
      [
        ['event', '--help'],
        ['minutes', '--help'],
        ['api', '--help'],
        ['auth', 'status', '--help'],
      ],
      'install or update the official @larksuite/cli package; do not install the unrelated unscoped lark-cli npm package',
      runCommand,
    ),
  );
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
  if (config.confirmationTarget === undefined) {
    diagnostics.push({
      level: 'yellow',
      name: 'bridge-reply-link',
      message: 'not required until a confirmation target is configured',
    });
  } else {
    const linked = await (options.isBridgeReplyLinked ?? bridgeReplyLinked)(workspaceRoot);
    diagnostics.push({
      level: linked ? 'green' : 'red',
      name: 'bridge-reply-link',
      message: linked
        ? 'existing Bridge/Codex reply path is linked'
        : 'not linked; run recording-agent bridge-link',
    });
  }
  if (options.live === true) {
    diagnostics.push(...liveDiagnostics(config.bridgeProfile, runCommand));
    const hookEntry = fileURLToPath(new URL('./bridge-hook.js', import.meta.url));
    const hookReady = await (options.isBridgeHookInstalled ?? bridgeHookInstalled)(
      config.bridgeProfile,
      hookEntry,
    );
    diagnostics.push({
      level: hookReady ? 'green' : 'red',
      name: 'bridge-minutes-hook',
      message: hookReady
        ? 'same-connection Minutes hook is installed'
        : 'not installed; start will patch and restart the configured Bridge service',
    });
    const subscriptionReady = await (
      options.isMinutesSubscriptionReady ?? minutesSubscriptionReady
    )(workspaceRoot);
    diagnostics.push({
      level: subscriptionReady ? 'green' : 'red',
      name: 'feishu-minutes-subscription',
      message: subscriptionReady
        ? 'subscription acknowledgement is recorded'
        : 'no successful subscription acknowledgement is recorded',
    });
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
  const bridgeRuntime = runCommand('lark-channel-bridge', ['status', '--profile', bridgeProfile]);
  let lark = runCommand('lark-cli', ['auth', 'status', '--json', '--verify'], {
    env: bridgeProfileEnvironment(bridgeProfile, process.env, undefined, 'user'),
  });
  const bridgeLark = runCommand('lark-cli', ['auth', 'status', '--json', '--verify'], {
    env: bridgeProfileEnvironment(bridgeProfile, process.env, undefined, 'bot'),
  });
  type UserAuthStatus = {
    appId?: string;
    verified?: boolean;
    identities?: {
      user?: { status?: string; tokenStatus?: string; scope?: string | string[] };
    };
  };
  const parseUserAuth = (
    result: ReturnType<NonNullable<DoctorOptions['runCommand']>>,
  ): UserAuthStatus | undefined => {
    try {
      return JSON.parse(result.stdout) as UserAuthStatus;
    } catch {
      return undefined;
    }
  };
  let userAuth = parseUserAuth(lark);
  if (
    lark.status === 0 &&
    (userAuth?.verified !== true ||
      userAuth.identities?.user?.status !== 'ready' ||
      userAuth.identities.user.tokenStatus !== 'valid')
  ) {
    lark = runCommand('lark-cli', ['auth', 'status', '--json', '--verify'], {
      env: bridgeProfileEnvironment(bridgeProfile, process.env, undefined, 'user'),
    });
    userAuth = parseUserAuth(lark);
  }
  let bridgeBotReady = false;
  let bridgeAppId: string | undefined;
  const rawScopes = userAuth?.identities?.user?.scope;
  const grantedScopes = new Set(
    (Array.isArray(rawScopes) ? rawScopes : (rawScopes ?? '').split(/[\s,]+/u)).filter(Boolean),
  );
  const missingScopes = REQUIRED_MINUTES_USER_SCOPES.filter((scope) => !grantedScopes.has(scope));
  const userTokenReady =
    lark.status === 0 &&
    userAuth?.verified === true &&
    userAuth.identities?.user?.status === 'ready' &&
    userAuth.identities.user.tokenStatus === 'valid';
  const larkReady = userTokenReady && missingScopes.length === 0;
  try {
    const status = JSON.parse(bridgeLark.stdout) as {
      appId?: string;
      verified?: boolean;
      identities?: { bot?: { status?: string } };
    };
    bridgeBotReady =
      bridgeLark.status === 0 &&
      status.verified === true &&
      status.identities?.bot?.status === 'ready';
    bridgeAppId = status.appId;
  } catch {
    // Malformed output keeps the default not-ready state.
  }
  const bridgeProfileFound =
    bridge.status === 0 &&
    bridge.stdout
      .split('\n')
      .slice(1)
      .some((line) => line.trim().split(/\s+/).includes(bridgeProfile));
  const sameApplication =
    typeof userAuth?.appId === 'string' &&
    typeof bridgeAppId === 'string' &&
    userAuth.appId === bridgeAppId;
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
      message: larkReady
        ? 'verified, valid and required Minutes scopes granted'
        : userTokenReady && missingScopes.length > 0
          ? `missing required scopes: ${missingScopes.join(', ')}`
          : 'not ready or invalid',
    },
    {
      level: bridgeRuntime.status === 0 ? 'green' : 'red',
      name: 'bridge-runtime',
      message: bridgeRuntime.status === 0 ? 'configured Bridge service is running' : 'not running',
    },
    {
      level: bridgeBotReady ? 'green' : 'red',
      name: 'feishu-bridge-bot-auth',
      message: bridgeBotReady ? 'verified and ready' : 'not ready or invalid',
    },
    {
      level: sameApplication ? 'green' : 'red',
      name: 'feishu-single-app',
      message: sameApplication
        ? 'Bridge bot and Minutes user identities belong to the same application'
        : 'Bridge bot and Minutes user identities do not resolve to the same application',
    },
  ];
}

export function highestDiagnosticLevel(diagnostics: readonly Diagnostic[]): DiagnosticLevel {
  if (diagnostics.some((diagnostic) => diagnostic.level === 'red')) return 'red';
  if (diagnostics.some((diagnostic) => diagnostic.level === 'yellow')) return 'yellow';
  return 'green';
}
