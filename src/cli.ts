#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';

import { CodexCliRunner } from './codex-cli-runner.js';
import { configuredNotifier } from './confirmation-notifier.js';
import { ControlPlane } from './control-plane.js';
import { diagnose, highestDiagnosticLevel } from './doctor.js';
import { ExitCode, type ExitCode as ExitCodeValue } from './exit-codes.js';
import { initializeWorkspace, parseCategories } from './init.js';
import { LarkCliMinutesClient } from './lark-minutes-client.js';
import { LiveTranscriptProcessor } from './live-processor.js';
import { runSample } from './sample.js';

const VERSION = '0.0.0';
const COMMANDS = ['init', 'doctor', 'sample', 'start', 'status', 'stop', 'catch-up'] as const;

type Command = (typeof COMMANDS)[number];

export interface CliIO {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
  question?: (prompt: string) => Promise<string>;
}

const defaultIO: CliIO = {
  stdout: (message) => {
    console.log(message);
  },
  stderr: (message) => {
    console.error(message);
  },
  question: async (prompt) => {
    const reader = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return await reader.question(prompt);
    } finally {
      reader.close();
    }
  },
};

function isCommand(value: string): value is Command {
  return COMMANDS.some((command) => command === value);
}

function option(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

async function answer(
  args: readonly string[],
  name: string,
  prompt: string,
  io: CliIO,
): Promise<string> {
  const provided = option(args, name);
  if (provided !== undefined) return provided;
  if (io.question === undefined) {
    throw new Error(`${name} is required when interactive input is unavailable`);
  }
  return io.question(prompt);
}

async function runInit(args: readonly string[], io: CliIO): Promise<ExitCodeValue> {
  try {
    const workspaceRoot = await answer(args, '--workspace', 'Starter workspace 的绝对路径：', io);
    const source = await answer(args, '--source', '录音来源是什么？', io);
    const categoryText = await answer(
      args,
      '--categories',
      '分类体系是什么？请用英文逗号分隔：',
      io,
    );
    const libraryRoot = await answer(args, '--library', 'Markdown 入库位置的绝对路径：', io);
    const retentionRule = await answer(args, '--retention', '哪些内容需要沉淀？', io);
    const bridgeProfile = option(args, '--bridge-profile');
    const confirmationChatId = option(args, '--confirmation-chat-id');
    const confirmationUserId = option(args, '--confirmation-user-id');
    const confirmationIdentity = option(args, '--confirmation-identity') ?? 'bot';
    if (confirmationChatId !== undefined && confirmationUserId !== undefined) {
      throw new Error('choose only one confirmation target');
    }
    if (confirmationIdentity !== 'bot' && confirmationIdentity !== 'user') {
      throw new Error('--confirmation-identity must be bot or user');
    }
    const safeConfirmationIdentity: 'bot' | 'user' = confirmationIdentity;
    const confirmationTarget =
      confirmationChatId === undefined && confirmationUserId === undefined
        ? undefined
        : {
            kind: confirmationChatId === undefined ? ('user' as const) : ('chat' as const),
            id: confirmationChatId ?? confirmationUserId ?? '',
            identity: safeConfirmationIdentity,
          };

    const result = await initializeWorkspace({
      workspaceRoot,
      source,
      categories: parseCategories(categoryText),
      libraryRoot,
      retentionRule,
      ...(bridgeProfile === undefined ? {} : { bridgeProfile }),
      ...(confirmationTarget === undefined ? {} : { confirmationTarget }),
    });
    io.stdout(`Starter workspace created: ${result.config.workspaceRoot}`);
    io.stdout(`Machine config: .recording-agent/config.json`);
    io.stdout(`Semantic skill: skills/personal-recording-processor/SKILL.md`);
    io.stdout('No credentials, background service or Feishu write action was created.');
    return ExitCode.success;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown init error';
    io.stderr(`Init failed: ${message}`);
    return ExitCode.usage;
  }
}

async function runDoctor(args: readonly string[], io: CliIO): Promise<ExitCodeValue> {
  try {
    const workspaceRoot = await answer(args, '--workspace', 'Starter workspace 的绝对路径：', io);
    const diagnostics = await diagnose(workspaceRoot);
    for (const diagnostic of diagnostics) {
      io.stdout(`${diagnostic.level.toUpperCase()} ${diagnostic.name}: ${diagnostic.message}`);
    }
    const level = highestDiagnosticLevel(diagnostics);
    io.stdout(`Doctor result: ${level.toUpperCase()}`);
    return level === 'red' ? ExitCode.failure : ExitCode.success;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown doctor error';
    io.stderr(`Doctor failed: ${message}`);
    return ExitCode.usage;
  }
}

async function executeSample(args: readonly string[], io: CliIO): Promise<ExitCodeValue> {
  try {
    const workspaceRoot = await answer(args, '--workspace', 'Starter workspace 的绝对路径：', io);
    const result = await runSample(workspaceRoot);
    io.stdout(
      result.created
        ? `Offline sample created one main record: ${result.recordPath}`
        : `Offline sample already exists; no duplicate was created: ${result.recordPath}`,
    );
    io.stdout('This is fixture evidence, not a real Feishu or Codex end-to-end result.');
    return ExitCode.success;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown sample error';
    io.stderr(`Sample failed: ${message}`);
    return ExitCode.failure;
  }
}

async function runCatchUp(args: readonly string[], io: CliIO): Promise<ExitCodeValue> {
  try {
    const workspaceRoot = await answer(args, '--workspace', 'Starter workspace 的绝对路径：', io);
    const daysText = option(args, '--days');
    if (daysText === undefined || daysText !== '1') {
      throw new Error('catch-up requires --days 1');
    }
    if (!args.includes('--confirm-external-writes')) {
      throw new Error(
        'catch-up may send confirmation messages; review the configured target and add --confirm-external-writes',
      );
    }
    const client = new LarkCliMinutesClient(workspaceRoot);
    const processor = new LiveTranscriptProcessor(
      workspaceRoot,
      new CodexCliRunner(workspaceRoot),
      () => new Date(),
      await configuredNotifier(workspaceRoot),
    );
    const controlPlane = new ControlPlane(workspaceRoot, client, processor);
    const results = await controlPlane.catchUp(1, client);
    const counts = results.reduce<Record<string, number>>((summary, result) => {
      summary[result.outcome] = (summary[result.outcome] ?? 0) + 1;
      return summary;
    }, {});
    io.stdout(`Catch-up result: ${JSON.stringify(counts)}`);
    io.stdout(
      'Only the requested one-day window was searched; one confirmation message is sent for each new pending record.',
    );
    return results.some((result) => result.outcome === 'failed')
      ? ExitCode.failure
      : ExitCode.success;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown catch-up error';
    io.stderr(`Catch-up failed: ${message}`);
    return ExitCode.failure;
  }
}

export function helpText(): string {
  return `Recording Agent Starter ${VERSION}

Usage:
  recording-agent <command> [options]

Commands:
  init                 Create a safe local Starter workspace
  doctor               Diagnose local prerequisites and configuration
  sample               Run the bundled offline transcript sample
  start                Start the local recording event loop
  status               Show local service and queue status
  stop                 Stop the local recording event loop
  catch-up --days 1    Recover missed recording events

Options:
  -h, --help           Show this help
  -v, --version        Show version

Current milestone:
  Stage 3 event control plane and catch-up are implemented.
  start, status and stop remain intentionally unavailable.`;
}

export async function runCli(
  args: readonly string[],
  io: CliIO = defaultIO,
): Promise<ExitCodeValue> {
  const [first] = args;

  if (first === undefined || first === '--help' || first === '-h' || first === 'help') {
    io.stdout(helpText());
    return ExitCode.success;
  }

  if (first === '--version' || first === '-v') {
    io.stdout(VERSION);
    return ExitCode.success;
  }

  if (!isCommand(first)) {
    io.stderr(`Unknown command: ${first}`);
    io.stderr('Run "recording-agent --help" for usage.');
    return ExitCode.usage;
  }

  if (first === 'init') return runInit(args.slice(1), io);
  if (first === 'doctor') return runDoctor(args.slice(1), io);
  if (first === 'sample') return executeSample(args.slice(1), io);
  if (first === 'catch-up') return runCatchUp(args.slice(1), io);

  io.stderr(
    `Command "${first}" is not implemented in the current milestone. No external action was taken.`,
  );
  return ExitCode.unavailable;
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  process.exitCode = await runCli(process.argv.slice(2));
}
