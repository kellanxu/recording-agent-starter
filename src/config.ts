import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { writeFileAtomic } from './atomic-file.js';
import { validateSafeDirectory } from './path-safety.js';

export const CONFIG_DIRECTORY = '.recording-agent';
export const CONFIG_FILENAME = 'config.json';

export interface MachineConfig {
  schemaVersion: 1;
  workspaceRoot: string;
  libraryRoot: string;
  bridgeProfile: string;
  createdAt: string;
}

export function configPath(workspaceRoot: string): string {
  return join(workspaceRoot, CONFIG_DIRECTORY, CONFIG_FILENAME);
}

export async function writeMachineConfig(config: MachineConfig): Promise<void> {
  validateMachineConfig(config);
  await writeFileAtomic(configPath(config.workspaceRoot), `${JSON.stringify(config, null, 2)}\n`);
}

export async function readMachineConfig(workspaceRoot: string): Promise<MachineConfig> {
  const parsed: unknown = JSON.parse(await readFile(configPath(workspaceRoot), 'utf8'));
  return validateMachineConfig(parsed);
}

export function validateMachineConfig(value: unknown): MachineConfig {
  if (typeof value !== 'object' || value === null) {
    throw new Error('machine config must be an object');
  }

  const candidate = value as Partial<MachineConfig>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.workspaceRoot !== 'string' ||
    typeof candidate.libraryRoot !== 'string' ||
    typeof candidate.bridgeProfile !== 'string' ||
    candidate.bridgeProfile.trim() === '' ||
    typeof candidate.createdAt !== 'string'
  ) {
    throw new Error('machine config has missing or invalid fields');
  }

  return {
    schemaVersion: 1,
    workspaceRoot: validateSafeDirectory(candidate.workspaceRoot, 'workspace'),
    libraryRoot: validateSafeDirectory(candidate.libraryRoot, 'library'),
    bridgeProfile: candidate.bridgeProfile,
    createdAt: candidate.createdAt,
  };
}
