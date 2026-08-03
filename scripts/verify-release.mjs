#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

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
const isolatedHome = join(verificationRoot, 'home');
mkdirSync(isolatedHome, { recursive: true });

const isolatedEnvironment = {
  ...process.env,
  HOME: isolatedHome,
  XDG_CONFIG_HOME: join(isolatedHome, '.config'),
  CODEX_HOME: join(isolatedHome, '.codex'),
  RECORDING_AGENT_HOME: join(isolatedHome, '.recording-agent'),
  LARK_CHANNEL_HOME: join(isolatedHome, '.lark-channel'),
  LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
  LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
};
delete isolatedEnvironment.LARK_CHANNEL_CONFIG;
delete isolatedEnvironment.LARK_CHANNEL_PROFILE;
delete isolatedEnvironment.LARKSUITE_CLI_CONFIG_DIR;

function run(command, args, cwd, env = process.env) {
  return execFileSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function runResult(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error !== undefined) throw result.error;
  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function markdownFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function waitFor(predicate, description, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(50);
  }
  throw new Error(`timed out waiting for ${description}`);
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
  const repositoryPackage = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'));
  const developmentArchive = basename(archivePath).includes('-dev.zip');
  const expectedCommit = developmentArchive
    ? run('git', ['rev-parse', 'HEAD'], repositoryRoot)
    : run('git', ['rev-list', '-n', '1', `v${manifest.version}`], repositoryRoot);
  if (manifest.commit !== expectedCommit || manifest.version !== repositoryPackage.version) {
    throw new Error(
      developmentArchive
        ? 'candidate manifest does not match the current repository'
        : `release manifest does not match the v${manifest.version} tag`,
    );
  }

  run(
    'npm',
    ['install', '--omit=dev', '--ignore-scripts', '--package-lock=false', '--audit=true'],
    packageRoot,
    isolatedEnvironment,
  );
  const dependencyTree = JSON.parse(
    run('npm', ['ls', '--omit=dev', '--depth=0', '--json'], packageRoot, isolatedEnvironment),
  );
  if (Object.keys(dependencyTree.dependencies ?? {}).length !== 0) {
    throw new Error('release package unexpectedly installed production dependencies');
  }

  const cliPath = join(packageRoot, 'dist', 'cli.js');
  const version = run(process.execPath, [cliPath, '--version'], packageRoot, isolatedEnvironment);
  if (version !== manifest.version) throw new Error(`unexpected CLI version: ${version}`);
  const help = run(process.execPath, [cliPath, '--help'], packageRoot, isolatedEnvironment);
  if (
    !help.includes('one Feishu app and one Bridge connection') ||
    !help.includes('Run doctor --live in your own environment')
  ) {
    throw new Error('packaged CLI help does not contain the single-connection safety boundary');
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
      '--bridge-profile',
      'PersonalAgent',
      '--confirmation-chat-id',
      'sandbox-private-target',
      '--confirmation-identity',
      'bot',
    ],
    packageRoot,
    isolatedEnvironment,
  );
  run(
    process.execPath,
    [cliPath, 'bridge-link', '--workspace', workspace],
    packageRoot,
    isolatedEnvironment,
  );
  const doctor = run(
    process.execPath,
    [cliPath, 'doctor', '--workspace', workspace],
    packageRoot,
    isolatedEnvironment,
  );
  if (!doctor.includes('Doctor result: YELLOW')) {
    throw new Error('isolated offline doctor did not preserve the expected YELLOW boundary');
  }
  const firstSample = run(
    process.execPath,
    [cliPath, 'sample', '--workspace', workspace],
    packageRoot,
    isolatedEnvironment,
  );
  const firstFiles = markdownFiles(library);
  if (firstFiles.length !== 1) throw new Error('first sample did not create exactly one record');
  const firstDigest = digest(firstFiles[0]);
  const secondSample = run(
    process.execPath,
    [cliPath, 'sample', '--workspace', workspace],
    packageRoot,
    isolatedEnvironment,
  );
  const secondFiles = markdownFiles(library);
  if (
    !firstSample.includes('created one main record') ||
    !secondSample.includes('no duplicate was created') ||
    secondFiles.length !== 1 ||
    digest(secondFiles[0]) !== firstDigest
  ) {
    throw new Error('isolated sample idempotency verification failed');
  }

  const stoppedStart = runResult(
    process.execPath,
    [cliPath, 'start', '--workspace', workspace],
    packageRoot,
    isolatedEnvironment,
  );
  if (
    stoppedStart.status !== 2 ||
    !stoppedStart.stderr.includes('Start stopped before external changes')
  ) {
    throw new Error('start did not stop before unapproved external writes');
  }
  if (existsSync(join(isolatedHome, 'Library', 'LaunchAgents'))) {
    throw new Error('start created a LaunchAgent before external writes were approved');
  }

  const liveDoctor = runResult(
    process.execPath,
    [cliPath, 'doctor', '--workspace', workspace, '--live'],
    packageRoot,
    isolatedEnvironment,
  );
  if (liveDoctor.status !== 1 || !liveDoctor.stdout.includes('Doctor result: RED')) {
    throw new Error('clean machine live doctor did not stop at missing personal authorization');
  }
  for (const expectedDiagnostic of [
    'RED bridge-profile',
    'RED feishu-user-auth',
    'RED feishu-bridge-bot-auth',
  ]) {
    if (!liveDoctor.stdout.includes(expectedDiagnostic)) {
      throw new Error(`clean machine live doctor did not report ${expectedDiagnostic}`);
    }
  }

  const fakeBin = join(verificationRoot, 'fake-bin');
  const callLog = join(verificationRoot, 'hook-lark-calls.log');
  mkdirSync(fakeBin, { recursive: true });
  const fakeLark = join(fakeBin, 'lark-cli');
  writeFileSync(
    fakeLark,
    `#!/usr/bin/env node
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
appendFileSync(${JSON.stringify(callLog)}, process.argv.slice(2, 4).join(' ') + '\\n');
if (process.argv[2] === 'minutes') {
  mkdirSync(join(process.cwd(), 'runtime', 'minutes'), { recursive: true });
  writeFileSync(join(process.cwd(), 'runtime', 'minutes', 'safe.txt'), '安全逐字稿。');
  process.stdout.write(JSON.stringify({ ok: true, data: { minutes: [{ title: '安全录音', artifacts: { transcript_file: 'runtime/minutes/safe.txt' } }] } }));
} else if (process.argv[2] === 'im') {
  process.stdout.write(JSON.stringify({ ok: true, data: { message_id: 'safe-message-id' } }));
} else {
  process.exitCode = 1;
}
`,
    'utf8',
  );
  const fakeCodex = join(fakeBin, 'codex');
  writeFileSync(
    fakeCodex,
    `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const output = args[args.indexOf('--output-last-message') + 1];
writeFileSync(output, JSON.stringify({ schemaVersion: 1, title: '安全整理', category: '工作', summary: '安全总结', evidence: ['安全证据'], candidateActions: [{ action: '人工确认' }] }));
process.stdin.resume();
process.stdin.on('end', () => process.exit(0));
`,
    'utf8',
  );
  chmodSync(fakeLark, 0o700);
  chmodSync(fakeCodex, 0o700);

  const registryPath = join(isolatedEnvironment.RECORDING_AGENT_HOME, 'bridge.json');
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  writeFileSync(registryPath, `${JSON.stringify({ ...registry, eventEnabled: true }, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  const previousPath = process.env.PATH;
  const previousRecordingAgentHome = process.env.RECORDING_AGENT_HOME;
  process.env.PATH = `${fakeBin}:${previousPath ?? ''}`;
  process.env.RECORDING_AGENT_HOME = isolatedEnvironment.RECORDING_AGENT_HOME;
  try {
    const hook = await import(pathToFileURL(join(packageRoot, 'dist', 'bridge-hook-runtime.js')));
    const safeEvent = {
      type: 'minutes.minute.generated_v1',
      event_id: 'safe-packaged-hook-event',
      timestamp: '1785379200000',
      minute_token: 'obcnsafepackagedhook',
      title: '安全录音',
    };
    if (hook.dispatchBridgeMinutesEvent(safeEvent) !== true) {
      throw new Error('packaged Bridge Hook did not dispatch the safe event');
    }
    const controlPath = join(workspace, 'state', 'control.json');
    await waitFor(() => {
      if (!existsSync(controlPath)) return false;
      const state = JSON.parse(readFileSync(controlPath, 'utf8'));
      return state.events?.['safe-packaged-hook-event']?.status === 'processed';
    }, 'the packaged hook child to process one event');
    if (hook.dispatchBridgeMinutesEvent(safeEvent) !== true) {
      throw new Error('packaged Bridge Hook did not dispatch the replay');
    }
    const hookStdout = join(workspace, 'logs', 'hook-child.stdout.log');
    await waitFor(
      () => existsSync(hookStdout) && readFileSync(hookStdout, 'utf8').includes('duplicate_event'),
      'the packaged hook replay to deduplicate',
    );
    const larkCalls = readFileSync(callLog, 'utf8').trim().split('\n');
    if (larkCalls.length !== 2) {
      throw new Error('packaged Hook replay called a provider or sender more than once');
    }
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    if (previousRecordingAgentHome === undefined) delete process.env.RECORDING_AGENT_HOME;
    else process.env.RECORDING_AGENT_HOME = previousRecordingAgentHome;
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
      bridgeReplyLink: 'installed in isolated home',
      markdownRecordsAfterTwoSamples: 1,
      sampleDigestStable: true,
      unapprovedExternalStart: 'stopped',
      launchAgentCreatedBeforeApproval: false,
      liveDoctorWithoutPersonalAuthorization: 'RED',
      packagedHookProcess: 'processed once',
      packagedHookReplay: 'deduplicated',
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
