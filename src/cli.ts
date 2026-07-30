#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { ExitCode, type ExitCode as ExitCodeValue } from './exit-codes.js';

const VERSION = '0.0.0';
const COMMANDS = ['init', 'doctor', 'sample', 'start', 'status', 'stop', 'catch-up'] as const;

type Command = (typeof COMMANDS)[number];

export interface CliIO {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

const defaultIO: CliIO = {
  stdout: (message) => {
    console.log(message);
  },
  stderr: (message) => {
    console.error(message);
  },
};

function isCommand(value: string): value is Command {
  return COMMANDS.some((command) => command === value);
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
  Stage 0 scaffold. Product commands are intentionally unavailable until implemented.`;
}

export function runCli(args: readonly string[], io: CliIO = defaultIO): ExitCodeValue {
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

  io.stderr(
    `Command "${first}" is not implemented in the Stage 0 scaffold. No external action was taken.`,
  );
  return ExitCode.unavailable;
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  process.exitCode = runCli(process.argv.slice(2));
}
