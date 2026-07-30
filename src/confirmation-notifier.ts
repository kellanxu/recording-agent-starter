import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { readMachineConfig } from './config.js';
import type { MachineConfig } from './config.js';
import type { RecordEntry, RecordRepository } from './record-repository.js';

const execFileAsync = promisify(execFile);

export interface ConfirmationNotifier {
  send(entry: RecordEntry, content: string, idempotencyKey: string): Promise<string>;
}

export interface NotificationResult {
  outcome: 'sent' | 'already_reserved';
  recordingId: string;
  messageId?: string;
}

export function renderConfirmationSheet(entry: RecordEntry): string {
  return `录音待确认：${entry.recordingId}
分类：${entry.category}

请回复以下任一命令：
确认 ${entry.recordingId}
修改 ${entry.recordingId}：具体意见
分类 ${entry.recordingId}：分类名

不会自动创建任务、发布内容或删除原始录音。`;
}

export async function sendPendingConfirmation(
  repository: RecordRepository,
  recordingId: string,
  notifier: ConfirmationNotifier,
  now: () => Date = () => new Date(),
): Promise<NotificationResult> {
  const idempotencyKey = `recording-confirmation-${recordingId}`;
  let shouldSend = false;
  const reserved = await repository.update(recordingId, (entry) => {
    if (entry.notification === undefined) {
      entry.notification = { status: 'reserved', idempotencyKey };
      shouldSend = true;
    }
  });
  if (!shouldSend) return { outcome: 'already_reserved', recordingId };

  try {
    const messageId = await notifier.send(
      reserved,
      renderConfirmationSheet(reserved),
      idempotencyKey,
    );
    await repository.update(recordingId, (entry) => {
      entry.notification = {
        status: 'sent',
        idempotencyKey,
        messageId,
        sentAt: now().toISOString(),
      };
    });
    return { outcome: 'sent', recordingId, messageId };
  } catch (error) {
    await repository.update(recordingId, (entry) => {
      entry.notification = { status: 'unknown', idempotencyKey };
    });
    throw error;
  }
}

export class LarkCliConfirmationNotifier implements ConfirmationNotifier {
  constructor(
    private readonly workspaceRoot: string,
    private readonly target: NonNullable<MachineConfig['confirmationTarget']>,
    private readonly executable = 'lark-cli',
  ) {}

  async send(entry: RecordEntry, content: string, idempotencyKey: string): Promise<string> {
    const targetArgs =
      this.target.kind === 'chat' ? ['--chat-id', this.target.id] : ['--user-id', this.target.id];
    const { stdout } = await execFileAsync(
      this.executable,
      [
        'im',
        '+messages-send',
        ...targetArgs,
        '--text',
        content,
        '--idempotency-key',
        idempotencyKey,
        '--as',
        this.target.identity,
        '--format',
        'json',
      ],
      {
        cwd: this.workspaceRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
          LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
        },
      },
    );
    const envelope = JSON.parse(stdout) as {
      ok?: boolean;
      data?: { message_id?: string };
    };
    const messageId = envelope.data?.message_id;
    if (envelope.ok !== true || typeof messageId !== 'string') {
      throw new Error(`confirmation notification failed for ${entry.recordingId}`);
    }
    return messageId;
  }
}

export async function configuredNotifier(
  workspaceRoot: string,
): Promise<LarkCliConfirmationNotifier> {
  const config = await readMachineConfig(workspaceRoot);
  if (config.confirmationTarget === undefined) {
    throw new Error('confirmation target is not configured');
  }
  return new LarkCliConfirmationNotifier(workspaceRoot, config.confirmationTarget);
}
