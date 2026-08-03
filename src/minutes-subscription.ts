import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { writeFileAtomic } from './atomic-file.js';
import { bridgeProfileEnvironment } from './bridge-profile.js';
import { readMachineConfig } from './config.js';
import { MINUTE_GENERATED_EVENT } from './minute-event.js';

const execFileAsync = promisify(execFile);
const SUBSCRIPTION_PATH = '/open-apis/minutes/v1/minutes/subscription';

interface SubscriptionReceipt {
  schemaVersion: 1;
  eventType: typeof MINUTE_GENERATED_EVENT;
  bridgeProfile: string;
  subscribedAt: string;
}

export function subscriptionReceiptPath(workspaceRoot: string): string {
  return join(workspaceRoot, 'state', 'minutes-subscription.json');
}

export interface SubscribeMinutesOptions {
  executable?: string;
  runCommand?: (
    command: string,
    args: readonly string[],
    options: { cwd: string; encoding: 'utf8'; env: NodeJS.ProcessEnv },
  ) => Promise<{ stdout: string; stderr: string }>;
  now?: () => Date;
}

export async function subscribeMinutesEvent(
  workspaceRoot: string,
  options: SubscribeMinutesOptions = {},
): Promise<SubscriptionReceipt & { changed: boolean }> {
  const config = await readMachineConfig(workspaceRoot);
  if (await minutesSubscriptionReady(workspaceRoot)) {
    const receipt = JSON.parse(
      await readFile(subscriptionReceiptPath(workspaceRoot), 'utf8'),
    ) as SubscriptionReceipt;
    return { ...receipt, changed: false };
  }
  const runCommand =
    options.runCommand ??
    ((command, args, commandOptions) => execFileAsync(command, args, commandOptions));
  const { stdout } = await runCommand(
    options.executable ?? 'lark-cli',
    [
      'api',
      'POST',
      SUBSCRIPTION_PATH,
      '--data',
      JSON.stringify({ event_type: MINUTE_GENERATED_EVENT }),
      '--as',
      'user',
      '--format',
      'json',
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      env: bridgeProfileEnvironment(config.bridgeProfile, process.env, undefined, 'user'),
    },
  );
  const envelope = JSON.parse(stdout) as { ok?: boolean };
  if (envelope.ok !== true) throw new Error('Minutes event subscription was not acknowledged');
  const receipt: SubscriptionReceipt = {
    schemaVersion: 1,
    eventType: MINUTE_GENERATED_EVENT,
    bridgeProfile: config.bridgeProfile,
    subscribedAt: (options.now ?? (() => new Date()))().toISOString(),
  };
  await writeFileAtomic(
    subscriptionReceiptPath(workspaceRoot),
    `${JSON.stringify(receipt, null, 2)}\n`,
  );
  return { ...receipt, changed: true };
}

export async function minutesSubscriptionReady(workspaceRoot: string): Promise<boolean> {
  try {
    const config = await readMachineConfig(workspaceRoot);
    const receipt = JSON.parse(
      await readFile(subscriptionReceiptPath(workspaceRoot), 'utf8'),
    ) as Partial<SubscriptionReceipt>;
    return (
      receipt.schemaVersion === 1 &&
      receipt.eventType === MINUTE_GENERATED_EVENT &&
      receipt.bridgeProfile === config.bridgeProfile &&
      typeof receipt.subscribedAt === 'string'
    );
  } catch {
    return false;
  }
}
