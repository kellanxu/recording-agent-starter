import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { writeFileAtomic } from './atomic-file.js';
import type { SkillAnswers } from './skill-template.js';

export const SEMANTIC_RULES_FILENAME = 'rules.json';

export interface SemanticRules {
  schemaVersion: 1;
  source: string;
  categories: string[];
  retentionRule: string;
}

export function semanticRulesPath(workspaceRoot: string): string {
  return join(workspaceRoot, 'skills', 'personal-recording-processor', SEMANTIC_RULES_FILENAME);
}

export async function writeSemanticRules(
  workspaceRoot: string,
  answers: SkillAnswers,
): Promise<void> {
  const rules: SemanticRules = {
    schemaVersion: 1,
    source: answers.source,
    categories: [...answers.categories],
    retentionRule: answers.retentionRule,
  };
  await writeFileAtomic(semanticRulesPath(workspaceRoot), `${JSON.stringify(rules, null, 2)}\n`);
}

export async function readSemanticRules(workspaceRoot: string): Promise<SemanticRules> {
  const parsed: unknown = JSON.parse(await readFile(semanticRulesPath(workspaceRoot), 'utf8'));
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('semantic rules must be an object');
  }
  const candidate = parsed as Partial<SemanticRules>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.source !== 'string' ||
    candidate.source.trim() === '' ||
    !Array.isArray(candidate.categories) ||
    candidate.categories.length === 0 ||
    !candidate.categories.every(
      (category) => typeof category === 'string' && category.trim() !== '',
    ) ||
    typeof candidate.retentionRule !== 'string' ||
    candidate.retentionRule.trim() === ''
  ) {
    throw new Error('semantic rules have missing or invalid fields');
  }
  return {
    schemaVersion: 1,
    source: candidate.source,
    categories: candidate.categories,
    retentionRule: candidate.retentionRule,
  };
}
