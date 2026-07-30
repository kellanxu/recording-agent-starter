import { access, mkdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeFileAtomic } from './atomic-file.js';
import { readMachineConfig } from './config.js';

const LINK_SCHEMA_VERSION = 1;
const SKILL_NAME = 'recording-agent-reply';

interface BridgeReplyLink {
  schemaVersion: 1;
  workspaceRoot: string;
  command: [string, string];
  linkedAt: string;
}

export interface BridgeReplyPaths {
  registryPath: string;
  skillPath: string;
  agentMetadataPath: string;
}

export interface BridgeReplyInstallOptions {
  recordingAgentHome?: string;
  codexHome?: string;
  sourceSkillRoot?: string;
}

function paths(options: BridgeReplyInstallOptions = {}): BridgeReplyPaths {
  const recordingAgentHome =
    options.recordingAgentHome ??
    process.env.RECORDING_AGENT_HOME ??
    join(homedir(), '.recording-agent');
  const codexHome = options.codexHome ?? process.env.CODEX_HOME ?? join(homedir(), '.codex');
  const skillRoot = join(codexHome, 'skills', SKILL_NAME);
  return {
    registryPath: join(recordingAgentHome, 'bridge.json'),
    skillPath: join(skillRoot, 'SKILL.md'),
    agentMetadataPath: join(skillRoot, 'agents', 'openai.yaml'),
  };
}

function sourceRoot(options: BridgeReplyInstallOptions): string {
  return (
    options.sourceSkillRoot ?? fileURLToPath(new URL(`../skills/${SKILL_NAME}`, import.meta.url))
  );
}

export async function linkBridgeReply(
  workspaceRoot: string,
  now: Date = new Date(),
  options: BridgeReplyInstallOptions = {},
): Promise<BridgeReplyPaths> {
  const config = await readMachineConfig(workspaceRoot);
  if (config.confirmationTarget === undefined) {
    throw new Error('confirmation target is not configured');
  }
  const destination = paths(options);
  const source = sourceRoot(options);
  const skill = await readFile(join(source, 'SKILL.md'), 'utf8');
  const agentMetadata = await readFile(join(source, 'agents', 'openai.yaml'), 'utf8');
  await Promise.all([
    mkdir(dirname(destination.skillPath), { recursive: true }),
    mkdir(dirname(destination.agentMetadataPath), { recursive: true }),
    mkdir(dirname(destination.registryPath), { recursive: true }),
  ]);
  await Promise.all([
    writeFileAtomic(destination.skillPath, skill, 0o644),
    writeFileAtomic(destination.agentMetadataPath, agentMetadata, 0o644),
    writeFileAtomic(
      destination.registryPath,
      `${JSON.stringify(
        {
          schemaVersion: LINK_SCHEMA_VERSION,
          workspaceRoot: config.workspaceRoot,
          command: [process.execPath, fileURLToPath(new URL('./cli.js', import.meta.url))],
          linkedAt: now.toISOString(),
        } satisfies BridgeReplyLink,
        null,
        2,
      )}\n`,
      0o600,
    ),
  ]);
  return destination;
}

export async function bridgeReplyLinked(
  workspaceRoot: string,
  options: BridgeReplyInstallOptions = {},
): Promise<boolean> {
  try {
    const destination = paths(options);
    const parsed = JSON.parse(
      await readFile(destination.registryPath, 'utf8'),
    ) as Partial<BridgeReplyLink>;
    if (
      parsed.schemaVersion !== LINK_SCHEMA_VERSION ||
      parsed.workspaceRoot !== workspaceRoot ||
      !Array.isArray(parsed.command) ||
      parsed.command.length !== 2 ||
      !parsed.command.every((value) => typeof value === 'string' && value.startsWith('/')) ||
      typeof parsed.linkedAt !== 'string'
    ) {
      return false;
    }
    await Promise.all([access(destination.skillPath), access(destination.agentMetadataPath)]);
    return true;
  } catch {
    return false;
  }
}
