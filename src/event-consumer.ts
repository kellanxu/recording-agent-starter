import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';

import type { ControlPlane, IngestResult } from './control-plane.js';
import { MINUTE_GENERATED_EVENT } from './minute-event.js';

export interface EventConsumerCallbacks {
  onReady?: () => void;
  onResult?: (result: IngestResult) => void;
  onDiagnostic?: (message: string) => void;
}

export interface EventConsumerOptions {
  executable?: string;
  profile?: string;
}

export class MinuteEventConsumer {
  private child: ChildProcessWithoutNullStreams | undefined;

  constructor(
    private readonly workspaceRoot: string,
    private readonly controlPlane: ControlPlane,
    private readonly callbacks: EventConsumerCallbacks = {},
    private readonly options: EventConsumerOptions = {},
  ) {}

  start(): Promise<void> {
    if (this.child !== undefined) throw new Error('event consumer is already running');
    const args = ['event', 'consume', MINUTE_GENERATED_EVENT, '--as', 'user'];
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
      if (line === `[event] ready event_key=${MINUTE_GENERATED_EVENT}`) {
        this.callbacks.onReady?.();
      } else if (line.startsWith('[event]')) {
        this.callbacks.onDiagnostic?.(line);
      }
    });

    return new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code) => {
        stdout.close();
        stderr.close();
        this.child = undefined;
        if (code === 0) resolve();
        else reject(new Error(`event consumer exited with code ${String(code)}`));
      });
    });
  }

  stop(): void {
    const child = this.child;
    if (child === undefined) return;
    child.stdin.end();
  }

  private async handleLine(line: string): Promise<void> {
    try {
      const result = await this.controlPlane.ingestRaw(JSON.parse(line));
      this.callbacks.onResult?.(result);
    } catch {
      this.callbacks.onDiagnostic?.('event payload rejected');
    }
  }
}
