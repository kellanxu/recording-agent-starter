import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';

import type { MachineConfig } from './config.js';
import { ConfirmationService, type ConfirmationResult } from './confirmation.js';

export const IM_RECEIVE_EVENT = 'im.message.receive_v1';

interface ImCommandEvent {
  eventId: string;
  messageId: string;
  messageType: string;
  chatId: string;
  senderId: string;
  content: string;
}

function required(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`missing ${field}`);
  return value;
}

export function parseImCommandEvent(input: unknown): ImCommandEvent {
  if (typeof input !== 'object' || input === null) throw new Error('IM event must be an object');
  const event = input as Record<string, unknown>;
  if (event.type !== IM_RECEIVE_EVENT) throw new Error('unsupported IM event type');
  return {
    eventId: required(event.event_id, 'event_id'),
    messageId: required(event.message_id ?? event.id, 'message_id'),
    messageType: required(event.message_type, 'message_type'),
    chatId: required(event.chat_id, 'chat_id'),
    senderId: required(event.sender_id, 'sender_id'),
    content: required(event.content, 'content'),
  };
}

export interface ImCommandCallbacks {
  onReady?: () => void;
  onResult?: (result: ConfirmationResult) => void;
  onDiagnostic?: (message: string) => void;
}

export interface ImCommandConsumerOptions {
  executable?: string;
  profile?: string;
}

export class ImCommandConsumer {
  private child: ChildProcessWithoutNullStreams | undefined;

  constructor(
    private readonly workspaceRoot: string,
    private readonly target: NonNullable<MachineConfig['confirmationTarget']>,
    private readonly service = new ConfirmationService(workspaceRoot),
    private readonly callbacks: ImCommandCallbacks = {},
    private readonly options: ImCommandConsumerOptions = {},
  ) {}

  start(): Promise<void> {
    if (this.child !== undefined) throw new Error('IM command consumer is already running');
    const args = ['event', 'consume', IM_RECEIVE_EVENT, '--as', 'bot'];
    if (this.options.profile !== undefined) args.push('--profile', this.options.profile);
    const child = spawn(this.options.executable ?? 'lark-cli', args, {
      cwd: this.workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
        LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
      },
    });
    this.child = child;
    const stdout = createInterface({ input: child.stdout });
    const stderr = createInterface({ input: child.stderr });
    stdout.on('line', (line) => {
      void this.handleLine(line);
    });
    stderr.on('line', (line) => {
      if (line === `[event] ready event_key=${IM_RECEIVE_EVENT}`) this.callbacks.onReady?.();
      else if (line.startsWith('[event]')) this.callbacks.onDiagnostic?.(line);
    });

    return new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code) => {
        stdout.close();
        stderr.close();
        this.child = undefined;
        if (code === 0) resolve();
        else reject(new Error(`IM command consumer exited with code ${String(code)}`));
      });
    });
  }

  stop(): void {
    this.child?.stdin.end();
  }

  private async handleLine(line: string): Promise<void> {
    try {
      const event = parseImCommandEvent(JSON.parse(line));
      const targetMatches =
        this.target.kind === 'chat'
          ? event.chatId === this.target.id
          : event.senderId === this.target.id;
      if (!targetMatches || !['text', 'post'].includes(event.messageType)) return;
      const result = await this.service.apply(event.content, event.messageId);
      this.callbacks.onResult?.(result);
    } catch {
      this.callbacks.onDiagnostic?.('IM command payload rejected');
    }
  }
}
