import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  CandidateAction,
  CodexRunner,
  CodexRunnerInput,
  CodexRunnerOutput,
} from './codex-runner.js';

function runProcess(executable: string, args: string[], cwd: string, input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      stdio: ['pipe', 'ignore', 'pipe'],
      env: process.env,
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      if (stderr.length < 4_096) stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`codex exec failed with exit ${String(code)}: ${stderr.trim()}`));
    });
    child.stdin.end(input);
  });
}

function validateAction(value: unknown): CandidateAction {
  if (typeof value !== 'object' || value === null) throw new Error('invalid candidate action');
  const candidate = value as Record<string, unknown>;
  const action: CandidateAction = {};
  for (const key of ['object', 'action', 'due', 'acceptance'] as const) {
    const field = candidate[key];
    if (field !== undefined && typeof field !== 'string') {
      throw new Error(`invalid candidate action field: ${key}`);
    }
    if (typeof field === 'string') action[key] = field;
  }
  return action;
}

export function validateCodexRunnerOutput(value: unknown): CodexRunnerOutput {
  if (typeof value !== 'object' || value === null)
    throw new Error('Codex output must be an object');
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.title !== 'string' ||
    typeof candidate.category !== 'string' ||
    typeof candidate.summary !== 'string' ||
    !Array.isArray(candidate.evidence) ||
    !candidate.evidence.every((item) => typeof item === 'string') ||
    !Array.isArray(candidate.candidateActions)
  ) {
    throw new Error('Codex output does not match the runner contract');
  }
  return {
    schemaVersion: 1,
    title: candidate.title,
    category: candidate.category,
    summary: candidate.summary,
    evidence: candidate.evidence,
    candidateActions: candidate.candidateActions.map(validateAction),
  };
}

export class CodexCliRunner implements CodexRunner {
  constructor(
    private readonly workspaceRoot: string,
    private readonly executable = 'codex',
  ) {}

  async run(input: CodexRunnerInput): Promise<CodexRunnerOutput> {
    const outputPath = join(
      this.workspaceRoot,
      'runtime',
      `codex-output-${process.pid}-${Date.now()}.json`,
    );
    await mkdir(dirname(outputPath), { recursive: true });
    const schemaPath = fileURLToPath(
      new URL('../schemas/codex-output.schema.json', import.meta.url),
    );
    const prompt = `你是本人的录音整理器。只分析下方逐字稿，不调用工具、不补造事实。
允许分类：${input.allowedCategories.join('、')}
必须返回符合给定 JSON Schema 的对象。缺失的候选待办字段请省略，由确定性程序写“未明确”。
逐字稿：
${input.transcript}`;

    try {
      await runProcess(
        this.executable,
        [
          'exec',
          '--ephemeral',
          '--ignore-rules',
          '--sandbox',
          'read-only',
          '--skip-git-repo-check',
          '--output-schema',
          schemaPath,
          '--output-last-message',
          outputPath,
          '-C',
          this.workspaceRoot,
          '-',
        ],
        this.workspaceRoot,
        prompt,
      );
      const output = validateCodexRunnerOutput(JSON.parse(await readFile(outputPath, 'utf8')));
      if (!input.allowedCategories.includes(output.category)) {
        throw new Error(`Codex returned an unknown category: ${output.category}`);
      }
      return output;
    } finally {
      await rm(outputPath, { force: true });
    }
  }
}
