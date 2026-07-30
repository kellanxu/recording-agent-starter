import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { writeFileAtomic } from './atomic-file.js';
import { CONFIG_DIRECTORY, type MachineConfig, writeMachineConfig } from './config.js';
import { validateSafeDirectory } from './path-safety.js';
import { writeSemanticRules } from './semantic-rules.js';
import { renderRecordingSkill } from './skill-template.js';

export interface InitAnswers {
  workspaceRoot: string;
  source: string;
  categories: readonly string[];
  libraryRoot: string;
  retentionRule: string;
  bridgeProfile?: string;
}

export interface InitResult {
  config: MachineConfig;
  skillPath: string;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} must not be empty`);
  return normalized;
}

export function parseCategories(value: string): string[] {
  const categories = value
    .split(',')
    .map((category) => category.trim())
    .filter(Boolean);

  if (categories.length === 0) {
    throw new Error('categories must include at least one value');
  }

  if (new Set(categories).size !== categories.length) {
    throw new Error('categories must not contain duplicates');
  }

  return categories;
}

export async function initializeWorkspace(
  answers: InitAnswers,
  now: Date = new Date(),
): Promise<InitResult> {
  const workspaceRoot = validateSafeDirectory(answers.workspaceRoot, 'workspace');
  const libraryRoot = validateSafeDirectory(answers.libraryRoot, 'library');
  const source = required(answers.source, 'source');
  const retentionRule = required(answers.retentionRule, 'retention rule');
  const categories = answers.categories.map((category) => required(category, 'category'));

  if (categories.length === 0 || new Set(categories).size !== categories.length) {
    throw new Error('categories must be non-empty and unique');
  }

  await mkdir(workspaceRoot, { recursive: true });
  await mkdir(libraryRoot, { recursive: true });
  await Promise.all([
    mkdir(join(workspaceRoot, CONFIG_DIRECTORY), { recursive: true }),
    mkdir(join(workspaceRoot, 'state'), { recursive: true }),
    mkdir(join(workspaceRoot, 'logs'), { recursive: true }),
    mkdir(join(workspaceRoot, 'skills', 'personal-recording-processor'), { recursive: true }),
  ]);

  const config: MachineConfig = {
    schemaVersion: 1,
    workspaceRoot,
    libraryRoot,
    bridgeProfile: answers.bridgeProfile?.trim() || 'PersonalAgent',
    createdAt: now.toISOString(),
  };
  await writeMachineConfig(config);

  const skillPath = join(workspaceRoot, 'skills', 'personal-recording-processor', 'SKILL.md');
  const semanticAnswers = { source, categories, retentionRule };
  await writeFileAtomic(skillPath, renderRecordingSkill(semanticAnswers), 0o644);
  await writeSemanticRules(workspaceRoot, semanticAnswers);

  return { config, skillPath };
}
