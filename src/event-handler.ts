import { bridgeProfileEnvironment } from './bridge-profile.js';
import { CodexCliRunner } from './codex-cli-runner.js';
import { configuredNotifier } from './confirmation-notifier.js';
import { ControlPlane, type IngestResult } from './control-plane.js';
import { readMachineConfig } from './config.js';
import { LarkCliMinutesClient } from './lark-minutes-client.js';
import { LiveTranscriptProcessor } from './live-processor.js';

export async function ingestBridgeEvent(
  workspaceRoot: string,
  rawEvent: unknown,
  now: () => Date = () => new Date(),
): Promise<IngestResult> {
  const config = await readMachineConfig(workspaceRoot);
  const client = new LarkCliMinutesClient(workspaceRoot, {
    now,
    env: bridgeProfileEnvironment(config.bridgeProfile, process.env, undefined, 'user'),
  });
  const processor = new LiveTranscriptProcessor(
    workspaceRoot,
    new CodexCliRunner(workspaceRoot),
    now,
    await configuredNotifier(workspaceRoot),
  );
  return new ControlPlane(workspaceRoot, client, processor, { now }).ingestRaw(rawEvent);
}
