import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  TranscriptNotReadyError,
  type CatchUpSource,
  type TranscriptProvider,
  type TranscriptResult,
} from './control-plane.js';
import type { MinuteGeneratedEvent } from './minute-event.js';

const execFileAsync = promisify(execFile);

interface LarkEnvelope {
  ok?: boolean;
  data?: unknown;
  error?: {
    type?: string;
    subtype?: string;
    code?: number;
    message?: string;
  };
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export class LarkCliError extends Error {
  constructor(readonly errorType: string) {
    super(`lark-cli request failed: ${errorType}`);
    this.name = 'LarkCliError';
  }
}

export interface LarkCliMinutesClientOptions {
  now?: () => Date;
  executable?: string;
}

export class LarkCliMinutesClient implements TranscriptProvider, CatchUpSource {
  private readonly now: () => Date;
  private readonly executable: string;

  constructor(
    private readonly workspaceRoot: string,
    options: LarkCliMinutesClientOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.executable = options.executable ?? 'lark-cli';
  }

  async fetch(minuteToken: string): Promise<TranscriptResult> {
    const envelope = await this.run([
      'minutes',
      '+detail',
      '--minute-tokens',
      minuteToken,
      '--transcript',
      '--overwrite',
      '--output-dir',
      'runtime/minutes',
      '--as',
      'user',
      '--format',
      'json',
    ]);
    const data = record(envelope.data);
    const minute = record(array(data.minutes)[0]);
    const artifacts = record(minute.artifacts);
    const transcriptFile = string(artifacts.transcript_file);
    if (transcriptFile === undefined) throw new TranscriptNotReadyError();

    const transcriptPath = resolve(this.workspaceRoot, transcriptFile);
    const relation = relative(this.workspaceRoot, transcriptPath);
    if (relation.startsWith('..') || isAbsolute(relation)) {
      throw new LarkCliError('unsafe_transcript_path');
    }
    const transcript = await readFile(transcriptPath, 'utf8');
    if (transcript.trim() === '') throw new TranscriptNotReadyError();
    const title = string(minute.title);
    return { transcript, ...(title === undefined ? {} : { title }) };
  }

  async list(days: number): Promise<MinuteGeneratedEvent[]> {
    if (days !== 1) throw new Error('Lark catch-up currently supports exactly one day');
    const end = this.now();
    const start = new Date(end.getTime() - 86_400_000);
    const [owned, participated] = await Promise.all([
      this.search(['--owner-ids', 'me'], start, end),
      this.search(['--participant-ids', 'me'], start, end),
    ]);

    const byToken = new Map<string, MinuteGeneratedEvent>();
    for (const item of [...owned, ...participated]) byToken.set(item.minuteToken, item);
    return [...byToken.values()];
  }

  private async search(
    identityFilter: [string, string],
    start: Date,
    end: Date,
  ): Promise<MinuteGeneratedEvent[]> {
    const results: MinuteGeneratedEvent[] = [];
    let pageToken: string | undefined;

    do {
      const args = [
        'minutes',
        '+search',
        ...identityFilter,
        '--start',
        start.toISOString(),
        '--end',
        end.toISOString(),
        '--page-size',
        '30',
        '--as',
        'user',
        '--format',
        'json',
      ];
      if (pageToken !== undefined) args.push('--page-token', pageToken);
      const envelope = await this.run(args);
      const data = record(envelope.data);
      for (const rawItem of array(data.items)) {
        const item = record(rawItem);
        const minuteToken = string(item.minute_token ?? item.token);
        if (minuteToken === undefined) continue;
        const occurredAt =
          string(item.create_time ?? item.created_at ?? item.start_time) ?? end.toISOString();
        const eventDigest = createHash('sha256')
          .update(`${minuteToken}\0${occurredAt}`)
          .digest('hex')
          .slice(0, 24);
        results.push({
          eventId: `catchup-${eventDigest}`,
          minuteToken,
          title: string(item.title) ?? '未命名录音',
          occurredAt,
          source: 'catch-up',
        });
      }

      const hasMore = data.has_more === true;
      pageToken = hasMore ? string(data.page_token) : undefined;
    } while (pageToken !== undefined && results.length < 50);

    return results;
  }

  private async run(args: string[]): Promise<LarkEnvelope> {
    try {
      const { stdout } = await execFileAsync(this.executable, args, {
        cwd: this.workspaceRoot,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
          LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
        },
      });
      const envelope = JSON.parse(stdout) as LarkEnvelope;
      if (envelope.ok !== true) throw this.toError(envelope);
      return envelope;
    } catch (error) {
      if (error instanceof TranscriptNotReadyError || error instanceof LarkCliError) throw error;
      const stderr =
        error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
          ? error.stderr
          : undefined;
      if (stderr !== undefined) {
        try {
          throw this.toError(JSON.parse(stderr) as LarkEnvelope);
        } catch (parsedError) {
          if (
            parsedError instanceof TranscriptNotReadyError ||
            parsedError instanceof LarkCliError
          ) {
            throw parsedError;
          }
        }
      }
      throw new LarkCliError('command_failed');
    }
  }

  private toError(envelope: LarkEnvelope): Error {
    const type = envelope.error?.subtype ?? envelope.error?.type ?? 'unknown';
    const message = `${type} ${envelope.error?.message ?? ''}`.toLowerCase();
    if (
      message.includes('not_ready') ||
      message.includes('not ready') ||
      message.includes('processing')
    ) {
      return new TranscriptNotReadyError();
    }
    return new LarkCliError(type);
  }
}
