import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { writeFileAtomic } from './atomic-file.js';

export interface ServiceState {
  schemaVersion: 1;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';
  pid: number;
  platform: NodeJS.Platform;
  startedAt: string;
  updatedAt: string;
  minuteConsumerReady: boolean;
  imConsumerReady: boolean;
  processedCount: number;
  pendingCount: number;
  failedCount: number;
  lastErrorCode?: string;
}

export function serviceStatePath(workspaceRoot: string): string {
  return join(workspaceRoot, 'state', 'service.json');
}

export async function writeServiceState(workspaceRoot: string, state: ServiceState): Promise<void> {
  await writeFileAtomic(serviceStatePath(workspaceRoot), `${JSON.stringify(state, null, 2)}\n`);
}

export async function readServiceState(workspaceRoot: string): Promise<ServiceState | undefined> {
  try {
    const parsed = JSON.parse(
      await readFile(serviceStatePath(workspaceRoot), 'utf8'),
    ) as ServiceState;
    if (
      parsed.schemaVersion !== 1 ||
      typeof parsed.pid !== 'number' ||
      typeof parsed.status !== 'string' ||
      typeof parsed.updatedAt !== 'string'
    ) {
      throw new Error('service state has missing or invalid fields');
    }
    return parsed;
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT') return undefined;
    throw error;
  }
}

export function publicServiceStatus(state: ServiceState | undefined): Record<string, unknown> {
  if (state === undefined) return { status: 'not_started' };
  return {
    status: state.status,
    pid: state.pid,
    platform: state.platform,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
    consumers: {
      minutes: state.minuteConsumerReady,
      confirmations: state.imConsumerReady,
    },
    counts: {
      processed: state.processedCount,
      pending: state.pendingCount,
      failed: state.failedCount,
    },
    ...(state.lastErrorCode === undefined ? {} : { lastErrorCode: state.lastErrorCode }),
  };
}
