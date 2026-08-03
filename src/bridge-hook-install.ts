import { execFile } from 'node:child_process';
import { access, copyFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type RunCommand = (
  command: string,
  args: readonly string[],
  options: { encoding: 'utf8' },
) => Promise<{ stdout: string; stderr: string }>;

function safeProfile(profile: string): string {
  const normalized = profile.trim();
  if (
    normalized === '' ||
    normalized === '.' ||
    normalized === '..' ||
    !/^[A-Za-z0-9._-]+$/u.test(normalized)
  ) {
    throw new Error('bridge profile name is invalid');
  }
  return normalized;
}

export function bridgeLaunchAgentLabel(profile: string): string {
  return `ai.lark-channel-bridge.bot.${safeProfile(profile)}`;
}

export function bridgeLaunchAgentPlist(profile: string, home = homedir()): string {
  return join(home, 'Library', 'LaunchAgents', `${bridgeLaunchAgentLabel(profile)}.plist`);
}

export function withBridgeHookArguments(
  programArguments: readonly string[],
  hookEntry: string,
): string[] {
  if (programArguments.length < 2) throw new Error('Bridge LaunchAgent arguments are incomplete');
  for (let index = 0; index < programArguments.length - 1; index += 1) {
    if (programArguments[index] === '--import' && programArguments[index + 1] === hookEntry) {
      return [...programArguments];
    }
    if (
      programArguments[index] === '--import' &&
      /(?:minutes-hook|recording-agent.*bridge-hook)/u.test(programArguments[index + 1] ?? '')
    ) {
      throw new Error('another Minutes Bridge hook is already installed');
    }
  }
  return [programArguments[0] ?? '', '--import', hookEntry, ...programArguments.slice(1)];
}

export interface BridgeHookInstallOptions {
  home?: string;
  runCommand?: RunCommand;
}

async function programArguments(plistPath: string, runCommand: RunCommand): Promise<string[]> {
  const { stdout } = await runCommand(
    'plutil',
    ['-extract', 'ProgramArguments', 'json', '-o', '-', plistPath],
    { encoding: 'utf8' },
  );
  const parsed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
    throw new Error('Bridge LaunchAgent ProgramArguments are invalid');
  }
  return parsed;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT') return false;
    throw error;
  }
}

async function bootstrap(
  runCommand: RunCommand,
  domain: string,
  label: string,
  plistPath: string,
): Promise<void> {
  try {
    await runCommand('launchctl', ['bootout', `${domain}/${label}`], { encoding: 'utf8' });
  } catch {
    // The service may not be loaded yet; bootstrap below is authoritative.
  }
  await runCommand('launchctl', ['bootstrap', domain, plistPath], { encoding: 'utf8' });
  await runCommand('launchctl', ['print', `${domain}/${label}`], { encoding: 'utf8' });
}

export async function bridgeHookInstalled(
  profile: string,
  hookEntry: string,
  options: BridgeHookInstallOptions = {},
): Promise<boolean> {
  try {
    const plistPath = bridgeLaunchAgentPlist(profile, options.home);
    const runCommand =
      options.runCommand ??
      ((command, args, commandOptions) => execFileAsync(command, args, commandOptions));
    const args = await programArguments(plistPath, runCommand);
    return args.some((value, index) => value === '--import' && args[index + 1] === hookEntry);
  } catch {
    return false;
  }
}

export async function installBridgeHook(
  profile: string,
  hookEntry: string,
  options: BridgeHookInstallOptions = {},
): Promise<{ label: string; plistPath: string; changed: boolean }> {
  const normalized = safeProfile(profile);
  const runCommand =
    options.runCommand ??
    ((command, args, commandOptions) => execFileAsync(command, args, commandOptions));
  const home = options.home ?? homedir();
  const label = bridgeLaunchAgentLabel(normalized);
  const plistPath = bridgeLaunchAgentPlist(normalized, home);
  if (!(await fileExists(plistPath))) {
    await runCommand('lark-channel-bridge', ['start', '--profile', normalized], {
      encoding: 'utf8',
    });
  }
  await access(plistPath);
  const current = await programArguments(plistPath, runCommand);
  const next = withBridgeHookArguments(current, hookEntry);
  const changed = JSON.stringify(current) !== JSON.stringify(next);
  const uid = process.getuid?.();
  if (uid === undefined) throw new Error('cannot determine launchd user domain');
  const domain = `gui/${uid}`;

  if (!changed) {
    try {
      await runCommand('launchctl', ['print', `${domain}/${label}`], { encoding: 'utf8' });
    } catch {
      await runCommand('launchctl', ['bootstrap', domain, plistPath], { encoding: 'utf8' });
      await runCommand('launchctl', ['print', `${domain}/${label}`], { encoding: 'utf8' });
    }
    return { label, plistPath, changed: false };
  }

  const backupPath = `${plistPath}.recording-agent-starter.bak`;
  if (!(await fileExists(backupPath))) await copyFile(plistPath, backupPath);
  await runCommand(
    'plutil',
    ['-replace', 'ProgramArguments', '-json', JSON.stringify(next), plistPath],
    { encoding: 'utf8' },
  );
  try {
    await bootstrap(runCommand, domain, label, plistPath);
  } catch (error) {
    await runCommand(
      'plutil',
      ['-replace', 'ProgramArguments', '-json', JSON.stringify(current), plistPath],
      { encoding: 'utf8' },
    );
    await bootstrap(runCommand, domain, label, plistPath);
    const message = error instanceof Error ? error.message : 'unknown Bridge restart failure';
    throw new Error(
      `Bridge Hook restart failed and the original service was restored: ${message}`,
      {
        cause: error,
      },
    );
  }
  return { label, plistPath, changed: true };
}
