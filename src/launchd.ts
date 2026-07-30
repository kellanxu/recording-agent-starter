import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { writeFileAtomic } from './atomic-file.js';

const execFileAsync = promisify(execFile);

function xml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function launchdLabel(workspaceRoot: string): string {
  const digest = createHash('sha256').update(workspaceRoot).digest('hex').slice(0, 12);
  return `dev.recording-agent-starter.${digest}`;
}

export function launchdPlistPath(workspaceRoot: string): string {
  return join(homedir(), 'Library', 'LaunchAgents', `${launchdLabel(workspaceRoot)}.plist`);
}

export function renderLaunchdPlist(
  workspaceRoot: string,
  nodeExecutable: string,
  runtimeEntry: string,
): string {
  const label = launchdLabel(workspaceRoot);
  const executablePath = [
    dirname(nodeExecutable),
    join(homedir(), '.local', 'bin'),
    join(homedir(), '.hermes', 'node', 'bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ]
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(':');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${xml(label)}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(nodeExecutable)}</string>
    <string>${xml(runtimeEntry)}</string>
    <string>--workspace</string>
    <string>${xml(workspaceRoot)}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xml(workspaceRoot)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProcessType</key>
  <string>Background</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${xml(executablePath)}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${xml(join(workspaceRoot, 'logs', 'service.stdout.log'))}</string>
  <key>StandardErrorPath</key>
  <string>${xml(join(workspaceRoot, 'logs', 'service.stderr.log'))}</string>
</dict>
</plist>
`;
}

function launchDomain(): string {
  const uid = process.getuid?.();
  if (uid === undefined) throw new Error('cannot determine launchd user domain');
  return `gui/${uid}`;
}

export async function installAndStartLaunchAgent(
  workspaceRoot: string,
  nodeExecutable: string,
  runtimeEntry: string,
): Promise<{ label: string; plistPath: string; restarted: boolean }> {
  const label = launchdLabel(workspaceRoot);
  const plistPath = launchdPlistPath(workspaceRoot);
  await writeFileAtomic(
    plistPath,
    renderLaunchdPlist(workspaceRoot, nodeExecutable, runtimeEntry),
    0o644,
  );
  const serviceTarget = `${launchDomain()}/${label}`;
  try {
    await execFileAsync('launchctl', ['print', serviceTarget]);
    await execFileAsync('launchctl', ['kickstart', '-k', serviceTarget]);
    return { label, plistPath, restarted: true };
  } catch {
    await execFileAsync('launchctl', ['bootstrap', launchDomain(), plistPath]);
    return { label, plistPath, restarted: false };
  }
}

export async function stopLaunchAgent(workspaceRoot: string): Promise<boolean> {
  const serviceTarget = `${launchDomain()}/${launchdLabel(workspaceRoot)}`;
  try {
    await execFileAsync('launchctl', ['bootout', serviceTarget]);
    return true;
  } catch {
    return false;
  }
}

export async function launchAgentLoaded(workspaceRoot: string): Promise<boolean> {
  try {
    await execFileAsync('launchctl', ['print', `${launchDomain()}/${launchdLabel(workspaceRoot)}`]);
    return true;
  } catch {
    return false;
  }
}
