import { access, mkdir, readFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { writeFileAtomic } from './atomic-file.js';
import { readMachineConfig } from './config.js';
import { RecordRepository, type RecordEntry } from './record-repository.js';
import { readSemanticRules } from './semantic-rules.js';

export type ConfirmationCommand =
  | { kind: 'confirm'; recordingId: string }
  | { kind: 'modify'; recordingId: string; opinion: string }
  | { kind: 'classify'; recordingId: string; category: string };

export type ConfirmationResult =
  | { outcome: 'applied'; recordingId: string; path: string }
  | { outcome: 'duplicate'; recordingId: string; path: string }
  | { outcome: 'needs_clarification'; reason: string };

const RECORDING_ID = 'R-\\d{4,}';

export function parseConfirmationCommand(input: string): ConfirmationCommand | undefined {
  const text = input.trim();
  const confirm = new RegExp(`^确认\\s+(${RECORDING_ID})$`).exec(text);
  if (confirm?.[1] !== undefined) return { kind: 'confirm', recordingId: confirm[1] };

  const modify = new RegExp(`^修改\\s+(${RECORDING_ID})[：:]\\s*(.+)$`, 's').exec(text);
  const modifyId = modify?.[1];
  const opinion = modify?.[2]?.trim();
  if (modifyId !== undefined && opinion !== undefined && opinion !== '') {
    return { kind: 'modify', recordingId: modifyId, opinion };
  }

  const classify = new RegExp(`^分类\\s+(${RECORDING_ID})[：:]\\s*(.+)$`, 's').exec(text);
  const classifyId = classify?.[1];
  const category = classify?.[2]?.trim();
  if (classifyId !== undefined && category !== undefined && category !== '') {
    return { kind: 'classify', recordingId: classifyId, category };
  }

  return undefined;
}

function updateFrontmatter(content: string, key: string, value: string): string {
  const pattern = new RegExp(`^${key}:.*$`, 'm');
  if (!pattern.test(content)) throw new Error(`record is missing frontmatter field: ${key}`);
  return content.replace(pattern, `${key}: ${JSON.stringify(value)}`);
}

function audit(content: string, timestamp: string, action: string, messageId: string): string {
  const marker = `message_id=${messageId}`;
  if (content.includes(marker)) return content;
  return `${content.trimEnd()}\n- ${timestamp} ${action}; ${marker}\n`;
}

function humanOpinion(content: string, text: string): string {
  const section = /## 人工确认\n\n[\s\S]*?\n\n## 审计/;
  if (!section.test(content)) throw new Error('record is missing the human confirmation section');
  return content.replace(section, `## 人工确认\n\n${text}\n\n## 审计`);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export class ConfirmationService {
  private readonly repository: RecordRepository;

  constructor(
    private readonly workspaceRoot: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.repository = new RecordRepository(workspaceRoot);
  }

  async apply(commandText: string, messageId: string): Promise<ConfirmationResult> {
    const command = parseConfirmationCommand(commandText);
    if (command === undefined) {
      return {
        outcome: 'needs_clarification',
        reason: '命令格式无效，请使用确认、修改或分类命令。',
      };
    }
    const matches = (await this.repository.list()).filter(
      (entry) => entry.recordingId === command.recordingId,
    );
    if (matches.length !== 1) {
      return {
        outcome: 'needs_clarification',
        reason: matches.length === 0 ? '录音 ID 不存在。' : '录音 ID 对应多个对象。',
      };
    }
    const entry = matches[0];
    if (entry === undefined) {
      return { outcome: 'needs_clarification', reason: '录音 ID 不存在。' };
    }
    const original = await readFile(entry.path, 'utf8');
    if (original.includes(`message_id=${messageId}`)) {
      return { outcome: 'duplicate', recordingId: entry.recordingId, path: entry.path };
    }

    if (command.kind === 'classify') {
      return this.classify(entry, original, command.category, messageId);
    }
    return this.updateSameRecord(entry, original, command, messageId);
  }

  private async updateSameRecord(
    entry: RecordEntry,
    original: string,
    command: Extract<ConfirmationCommand, { kind: 'confirm' | 'modify' }>,
    messageId: string,
  ): Promise<ConfirmationResult> {
    const timestamp = this.now().toISOString();
    const nextStatus = command.kind === 'confirm' ? 'confirmed' : 'revision_requested';
    let updated = updateFrontmatter(original, 'status', nextStatus);
    updated = humanOpinion(
      updated,
      command.kind === 'confirm' ? '已确认' : `用户修改意见：${command.opinion}`,
    );
    updated = audit(
      updated,
      timestamp,
      command.kind === 'confirm' ? '用户确认主记录' : '保留原输出并记录用户修改意见',
      messageId,
    );
    await writeFileAtomic(entry.path, updated, 0o600);
    await this.repository.update(entry.recordingId, (current) => {
      current.status = nextStatus;
    });
    return { outcome: 'applied', recordingId: entry.recordingId, path: entry.path };
  }

  private async classify(
    entry: RecordEntry,
    original: string,
    category: string,
    messageId: string,
  ): Promise<ConfirmationResult> {
    const rules = await readSemanticRules(this.workspaceRoot);
    if (!rules.categories.includes(category)) {
      return { outcome: 'needs_clarification', reason: '分类不存在。' };
    }
    if (category === entry.category) {
      return { outcome: 'duplicate', recordingId: entry.recordingId, path: entry.path };
    }
    const config = await readMachineConfig(this.workspaceRoot);
    const targetPath = join(config.libraryRoot, category, `${entry.recordingId}.md`);
    if (await exists(targetPath)) {
      return { outcome: 'needs_clarification', reason: '目标分类中已存在同名主记录。' };
    }
    const timestamp = this.now().toISOString();
    let updated = updateFrontmatter(original, 'category', category);
    updated = audit(
      updated,
      timestamp,
      `从分类“${entry.category}”移动到“${category}”，未复制正文`,
      messageId,
    );
    await writeFileAtomic(entry.path, updated, 0o600);
    await mkdir(dirname(targetPath), { recursive: true });
    await rename(entry.path, targetPath);
    await this.repository.update(entry.recordingId, (current) => {
      current.category = category;
      current.path = targetPath;
    });
    return { outcome: 'applied', recordingId: entry.recordingId, path: targetPath };
  }
}
