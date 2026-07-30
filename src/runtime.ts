#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { bridgeReplyLinked } from './bridge-reply.js';
import { CodexCliRunner } from './codex-cli-runner.js';
import { configuredNotifier } from './confirmation-notifier.js';
import { ControlPlane, type IngestResult } from './control-plane.js';
import { readMachineConfig } from './config.js';
import { MinuteEventConsumer } from './event-consumer.js';
import { LarkCliMinutesClient } from './lark-minutes-client.js';
import { LiveTranscriptProcessor } from './live-processor.js';
import { type ServiceState, writeServiceState } from './service-state.js';

function workspaceArgument(args: readonly string[]): string {
  const index = args.indexOf('--workspace');
  const value = index === -1 ? undefined : args[index + 1];
  if (value === undefined) throw new Error('runtime requires --workspace');
  return value;
}

export async function runRuntime(
  workspaceRoot: string,
  now: () => Date = () => new Date(),
): Promise<void> {
  const config = await readMachineConfig(workspaceRoot);
  if (config.confirmationTarget === undefined) {
    throw new Error('confirmation target is not configured');
  }
  if (!(await bridgeReplyLinked(workspaceRoot))) {
    throw new Error('Bridge reply link is not installed');
  }
  const startedAt = now().toISOString();
  const state: ServiceState = {
    schemaVersion: 1,
    status: 'starting',
    pid: process.pid,
    platform: process.platform,
    startedAt,
    updatedAt: startedAt,
    minuteConsumerReady: false,
    imConsumerReady: true,
    processedCount: 0,
    pendingCount: 0,
    failedCount: 0,
  };
  const persist = async (): Promise<void> => {
    state.updatedAt = now().toISOString();
    await writeServiceState(workspaceRoot, state);
  };
  await persist();

  const client = new LarkCliMinutesClient(workspaceRoot);
  const processor = new LiveTranscriptProcessor(
    workspaceRoot,
    new CodexCliRunner(workspaceRoot),
    now,
    await configuredNotifier(workspaceRoot),
  );
  const plane = new ControlPlane(workspaceRoot, client, processor, { now });
  const count = (result: IngestResult): void => {
    if (result.outcome === 'processed') state.processedCount += 1;
    else if (result.outcome === 'transcript_pending') state.pendingCount += 1;
    else if (result.outcome === 'failed') state.failedCount += 1;
    void persist();
  };
  const minuteConsumer = new MinuteEventConsumer(workspaceRoot, plane, {
    onReady: () => {
      state.minuteConsumerReady = true;
      if (state.imConsumerReady) state.status = 'running';
      void persist();
    },
    onResult: count,
  });
  let stopping = false;
  const retryTimer = setInterval(() => {
    void plane.retryDue().then((results) => {
      results.forEach(count);
    });
  }, 30_000);
  const catchUpTimer = setInterval(() => {
    void plane.runDailyCatchUp(client).then((results) => {
      results.forEach(count);
    });
  }, 3_600_000);
  const heartbeatTimer = setInterval(() => {
    void persist();
  }, 30_000);

  const stop = (): void => {
    if (stopping) return;
    stopping = true;
    state.status = 'stopping';
    void persist();
    clearInterval(retryTimer);
    clearInterval(catchUpTimer);
    clearInterval(heartbeatTimer);
    minuteConsumer.stop();
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);

  try {
    await minuteConsumer.start();
    state.status = 'stopped';
    await persist();
  } catch {
    stop();
    state.status = 'failed';
    state.lastErrorCode = 'runtime_consumer_failed';
    await persist();
    throw new Error('runtime consumer failed');
  } finally {
    process.removeListener('SIGTERM', stop);
    process.removeListener('SIGINT', stop);
  }
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  try {
    await runRuntime(workspaceArgument(process.argv.slice(2)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'runtime failed';
    console.error(message);
    process.exitCode = 1;
  }
}
