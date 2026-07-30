import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { readMachineConfig } from './config.js';

export type DiagnosticLevel = 'green' | 'yellow' | 'red';

export interface Diagnostic {
  level: DiagnosticLevel;
  name: string;
  message: string;
}

function commandDiagnostic(name: string, command: string): Diagnostic {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
  if (result.error !== undefined || result.status !== 0) {
    return { level: 'yellow', name, message: 'not available on PATH' };
  }
  const version = `${result.stdout}${result.stderr}`.trim().split('\n')[0] ?? 'detected';
  return { level: 'green', name, message: version };
}

export async function diagnose(workspaceRoot: string): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

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
      skill.includes(config.bridgeProfile);
    diagnostics.push({
      level: leaksMachineData ? 'red' : 'green',
      name: 'skill',
      message: leaksMachineData ? 'contains machine configuration' : 'semantic rules are separated',
    });
  } catch {
    diagnostics.push({ level: 'red', name: 'skill', message: 'missing or unreadable' });
  }

  diagnostics.push(commandDiagnostic('codex', 'codex'));
  diagnostics.push(commandDiagnostic('bridge', 'lark-channel-bridge'));
  diagnostics.push(commandDiagnostic('lark-cli', 'lark-cli'));
  diagnostics.push({
    level: 'yellow',
    name: 'authorization',
    message: 'credentials and live Feishu access are intentionally not exercised by Stage 1 doctor',
  });

  return diagnostics;
}

export function highestDiagnosticLevel(diagnostics: readonly Diagnostic[]): DiagnosticLevel {
  if (diagnostics.some((diagnostic) => diagnostic.level === 'red')) return 'red';
  if (diagnostics.some((diagnostic) => diagnostic.level === 'yellow')) return 'yellow';
  return 'green';
}
