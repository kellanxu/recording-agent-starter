import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { writeFileAtomic } from './atomic-file.js';
import type { CodexRunnerInput, CodexRunnerOutput } from './codex-runner.js';
import { readMachineConfig } from './config.js';
import { withFileLock } from './file-lock.js';
import { renderMainRecord } from './record.js';

export interface RecordEntry {
  recordingId: string;
  sourceId: string;
  category: string;
  path: string;
  status: 'pending_confirmation' | 'revision_requested' | 'confirmed';
  createdAt: string;
  notification?: {
    status: 'reserved' | 'sent' | 'unknown';
    idempotencyKey: string;
    messageId?: string;
    sentAt?: string;
  };
}

interface RecordRegistry {
  schemaVersion: 1;
  nextNumber: number;
  records: Record<string, RecordEntry>;
  sources: Record<string, string>;
}

function emptyRegistry(): RecordRegistry {
  return { schemaVersion: 1, nextNumber: 2, records: {}, sources: {} };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export class RecordRepository {
  private readonly registryPath: string;
  private readonly lockPath: string;

  constructor(private readonly workspaceRoot: string) {
    this.registryPath = join(workspaceRoot, 'state', 'records.json');
    this.lockPath = join(workspaceRoot, 'state', 'records.lock');
  }

  async create(
    input: CodexRunnerInput,
    output: CodexRunnerOutput,
    createdAt: string,
  ): Promise<RecordEntry> {
    const config = await readMachineConfig(this.workspaceRoot);
    const entry = await withFileLock(this.lockPath, async () => {
      const registry = await this.readRegistry();
      const existingId = registry.sources[input.source.sourceId];
      if (existingId !== undefined) {
        const existing = registry.records[existingId];
        if (existing === undefined) throw new Error('record registry source index is inconsistent');
        return existing;
      }

      const recordingId = `R-${registry.nextNumber.toString().padStart(4, '0')}`;
      registry.nextNumber += 1;
      const path = join(config.libraryRoot, output.category, `${recordingId}.md`);
      const created: RecordEntry = {
        recordingId,
        sourceId: input.source.sourceId,
        category: output.category,
        path,
        status: 'pending_confirmation',
        createdAt,
      };
      registry.records[recordingId] = created;
      registry.sources[input.source.sourceId] = recordingId;
      await writeFileAtomic(this.registryPath, `${JSON.stringify(registry, null, 2)}\n`);
      return created;
    });

    if (!(await exists(entry.path))) {
      await writeFileAtomic(
        entry.path,
        renderMainRecord({ ...input, recordingId: entry.recordingId }, output, createdAt),
        0o600,
      );
    }
    return entry;
  }

  async get(recordingId: string): Promise<RecordEntry | undefined> {
    const registry = await this.readRegistry();
    return registry.records[recordingId];
  }

  async list(): Promise<RecordEntry[]> {
    const registry = await this.readRegistry();
    return Object.values(registry.records);
  }

  update(
    recordingId: string,
    mutate: (entry: RecordEntry) => void | Promise<void>,
  ): Promise<RecordEntry> {
    return withFileLock(this.lockPath, async () => {
      const registry = await this.readRegistry();
      const entry = registry.records[recordingId];
      if (entry === undefined) throw new Error('recording_id_not_found');
      await mutate(entry);
      await writeFileAtomic(this.registryPath, `${JSON.stringify(registry, null, 2)}\n`);
      return entry;
    });
  }

  private async readRegistry(): Promise<RecordRegistry> {
    try {
      const parsed = JSON.parse(await readFile(this.registryPath, 'utf8')) as RecordRegistry;
      if (
        parsed.schemaVersion !== 1 ||
        typeof parsed.nextNumber !== 'number' ||
        typeof parsed.records !== 'object' ||
        parsed.records === null ||
        typeof parsed.sources !== 'object' ||
        parsed.sources === null
      ) {
        throw new Error('record registry has missing or invalid fields');
      }
      return parsed;
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      if (code === 'ENOENT') return emptyRegistry();
      throw error;
    }
  }
}
