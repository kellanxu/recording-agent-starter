#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const archiveArgument = process.argv[2];
if (archiveArgument === undefined) {
  console.error('Usage: node scripts/verify-release.mjs <archive.zip>');
  process.exit(2);
}

const archivePath = resolve(archiveArgument);
const checksumPath = `${archivePath}.sha256`;
const repositoryRoot = process.cwd();
const temporaryParent = join(repositoryRoot, 'tmp');
mkdirSync(temporaryParent, { recursive: true });
const verificationRoot = mkdtempSync(join(temporaryParent, 'release-verify-'));

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function countMarkdownFiles(directory) {
  let count = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) count += countMarkdownFiles(path);
    else if (entry.isFile() && entry.name.endsWith('.md')) count += 1;
  }
  return count;
}

try {
  const checksumLine = readFileSync(checksumPath, 'utf8').trim();
  const [expectedDigest, expectedName] = checksumLine.split(/\s{2,}/u);
  if (expectedDigest === undefined || expectedName !== basename(archivePath)) {
    throw new Error('checksum file does not identify the adjacent archive');
  }
  const actualDigest = run('shasum', ['-a', '256', archivePath], repositoryRoot).split(/\s+/u)[0];
  if (actualDigest !== expectedDigest) throw new Error('SHA-256 mismatch');

  run('unzip', ['-q', archivePath, '-d', verificationRoot], repositoryRoot);
  const packageRoot = join(verificationRoot, 'recording-agent-starter');
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'RELEASE_MANIFEST.json'), 'utf8'));
  const expectedCommit = run('git', ['rev-parse', 'HEAD'], repositoryRoot);
  if (manifest.commit !== expectedCommit || manifest.version !== '0.1.0') {
    throw new Error('release manifest does not match HEAD and v0.1.0');
  }

  run(
    'npm',
    ['install', '--omit=dev', '--ignore-scripts', '--package-lock=false', '--audit=true'],
    packageRoot,
  );
  const dependencyTree = JSON.parse(
    run('npm', ['ls', '--omit=dev', '--depth=0', '--json'], packageRoot),
  );
  if (Object.keys(dependencyTree.dependencies ?? {}).length !== 0) {
    throw new Error('release package unexpectedly installed production dependencies');
  }

  const cliPath = join(packageRoot, 'dist', 'cli.js');
  const version = run(process.execPath, [cliPath, '--version'], packageRoot);
  if (version !== '0.1.0') throw new Error(`unexpected CLI version: ${version}`);
  const help = run(process.execPath, [cliPath, '--help'], packageRoot);
  if (!help.includes('Run doctor --live in your own environment')) {
    throw new Error('packaged CLI help does not contain the v0.1.0 live verification boundary');
  }

  const workspace = join(verificationRoot, 'starter-workspace');
  const library = join(verificationRoot, 'markdown-library');
  run(
    process.execPath,
    [
      cliPath,
      'init',
      '--workspace',
      workspace,
      '--source',
      '公开安全样本',
      '--categories',
      '工作,学习',
      '--library',
      library,
      '--retention',
      '保留证据、结论和人工意见',
    ],
    packageRoot,
  );
  const doctor = run(process.execPath, [cliPath, 'doctor', '--workspace', workspace], packageRoot);
  if (!doctor.includes('Doctor result: YELLOW')) {
    throw new Error('isolated offline doctor did not preserve the expected YELLOW boundary');
  }
  const firstSample = run(
    process.execPath,
    [cliPath, 'sample', '--workspace', workspace],
    packageRoot,
  );
  const secondSample = run(
    process.execPath,
    [cliPath, 'sample', '--workspace', workspace],
    packageRoot,
  );
  if (
    !firstSample.includes('created one main record') ||
    !secondSample.includes('no duplicate was created') ||
    countMarkdownFiles(library) !== 1
  ) {
    throw new Error('isolated sample idempotency verification failed');
  }

  console.log(
    JSON.stringify({
      result: 'passed',
      archive: basename(archivePath),
      sha256: actualDigest,
      commit: expectedCommit,
      version,
      productionDependencies: 0,
      doctor: 'YELLOW',
      markdownRecordsAfterTwoSamples: 1,
    }),
  );
} finally {
  rmSync(verificationRoot, { recursive: true, force: true });
  try {
    const remaining = readdirSync(temporaryParent);
    if (remaining.length === 0) rmSync(temporaryParent, { recursive: true, force: true });
  } catch {
    // The repository may already have a shared ignored tmp directory.
  }
}
