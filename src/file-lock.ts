import { mkdir, open, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface LockOptions {
  retries?: number;
  retryDelayMs?: number;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function withFileLock<T>(
  lockPath: string,
  action: () => Promise<T>,
  options: LockOptions = {},
): Promise<T> {
  const retries = options.retries ?? 50;
  const retryDelayMs = options.retryDelayMs ?? 20;
  await mkdir(dirname(lockPath), { recursive: true });

  let handle;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      handle = await open(lockPath, 'wx', 0o600);
      break;
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      if (code !== 'EEXIST' || attempt === retries) throw error;
      await delay(retryDelayMs);
    }
  }

  if (handle === undefined) throw new Error('failed to acquire file lock');

  try {
    return await action();
  } finally {
    await handle.close();
    await rm(lockPath);
  }
}
