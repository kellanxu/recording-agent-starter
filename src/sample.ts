import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeFileAtomic } from './atomic-file.js';
import { OfflineSampleRunner, type CodexRunner, type CodexRunnerInput } from './codex-runner.js';
import { readMachineConfig } from './config.js';
import { renderMainRecord } from './record.js';
import { readSemanticRules } from './semantic-rules.js';

export const SAMPLE_RECORDING_ID = 'R-0001';
const SAMPLE_FILENAME = `${SAMPLE_RECORDING_ID}-offline-sample.md`;

export interface SampleResult {
  recordPath: string;
  created: boolean;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runSample(
  workspaceRoot: string,
  runner: CodexRunner = new OfflineSampleRunner(),
  now: Date = new Date(),
): Promise<SampleResult> {
  const config = await readMachineConfig(workspaceRoot);
  const rules = await readSemanticRules(workspaceRoot);
  const category = rules.categories[0];
  if (category === undefined) throw new Error('semantic rules do not define a category');

  const recordPath = join(config.libraryRoot, category, SAMPLE_FILENAME);
  if (await exists(recordPath)) return { recordPath, created: false };

  const fixturePath = fileURLToPath(new URL('../fixtures/sample-transcript.txt', import.meta.url));
  const transcript = await readFile(fixturePath, 'utf8');
  const input: CodexRunnerInput = {
    schemaVersion: 1,
    recordingId: SAMPLE_RECORDING_ID,
    source: {
      kind: 'offline-sample',
      sourceId: 'bundled-safe-fixture-v1',
      title: '安全离线样本',
      capturedAt: '2026-07-30T00:00:00.000Z',
    },
    transcript,
    allowedCategories: rules.categories,
  };
  const output = await runner.run(input);
  if (!rules.categories.includes(output.category)) {
    throw new Error(`runner returned an unknown category: ${output.category}`);
  }
  const record = renderMainRecord(input, output, now.toISOString());
  await writeFileAtomic(recordPath, record, 0o600);
  return { recordPath, created: true };
}
