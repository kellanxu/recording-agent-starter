#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const releaseDirectory = resolve('release');
mkdirSync(releaseDirectory, { recursive: true });
const buildDirectory = mkdtempSync(join(releaseDirectory, '.candidate-'));
const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const finalRelease = process.argv.includes('--final');
const archiveName = `${packageJson.name}-${packageJson.version}${finalRelease ? '' : '-dev'}.zip`;
const archivePath = join(releaseDirectory, archiveName);
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

if (finalRelease) {
  const worktreeStatus = execFileSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  }).trim();
  if (worktreeStatus !== '') {
    throw new Error('final release requires a clean worktree');
  }
}

try {
  const packResult = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', buildDirectory], {
      encoding: 'utf8',
    }),
  );
  const tarballName = packResult[0]?.filename;
  if (typeof tarballName !== 'string') throw new Error('npm pack did not return a tarball name');
  const tarballPath = join(buildDirectory, tarballName);
  execFileSync('tar', ['-xzf', tarballPath, '-C', buildDirectory]);
  const packageDirectory = join(buildDirectory, 'recording-agent-starter');
  renameSync(join(buildDirectory, 'package'), packageDirectory);
  writeFileSync(
    join(packageDirectory, 'RELEASE_MANIFEST.json'),
    `${JSON.stringify(
      {
        name: packageJson.name,
        version: packageJson.version,
        commit,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  rmSync(archivePath, { force: true });
  execFileSync('zip', ['-q', '-r', archivePath, 'recording-agent-starter'], {
    cwd: buildDirectory,
  });

  const digest = createHash('sha256').update(readFileSync(archivePath)).digest('hex');
  writeFileSync(`${archivePath}.sha256`, `${digest}  ${archiveName}\n`, 'utf8');
  console.log(
    JSON.stringify({
      archive: archivePath,
      sha256File: `${archivePath}.sha256`,
      version: packageJson.version,
      commit,
      release: finalRelease,
    }),
  );
} finally {
  rmSync(buildDirectory, { recursive: true, force: true });
}
