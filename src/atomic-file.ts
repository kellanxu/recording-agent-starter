import { chmod, mkdir, open, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';

export async function writeFileAtomic(
  targetPath: string,
  content: string,
  mode = 0o600,
): Promise<void> {
  const parent = dirname(targetPath);
  await mkdir(parent, { recursive: true });

  const temporaryPath = `${targetPath}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await open(temporaryPath, 'wx', mode);

  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
    await handle.close();
    await rename(temporaryPath, targetPath);
    await chmod(targetPath, mode);
  } catch (error) {
    await handle.close().catch(() => undefined);
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}
