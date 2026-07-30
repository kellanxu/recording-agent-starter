import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function stopVerifiedForegroundProcess(
  pid: number,
  workspaceRoot: string,
): Promise<boolean> {
  if (!Number.isInteger(pid) || pid <= 1 || pid === process.pid) return false;
  try {
    const { stdout } = await execFileAsync('ps', ['-p', String(pid), '-o', 'command='], {
      encoding: 'utf8',
    });
    if (!stdout.includes('runtime') || !stdout.includes(workspaceRoot)) return false;
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}
