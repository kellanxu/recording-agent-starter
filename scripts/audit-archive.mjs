#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { extname, resolve } from 'node:path';

const archiveArgument = process.argv[2];
if (archiveArgument === undefined) {
  console.error('Usage: node scripts/audit-archive.mjs <archive.zip>');
  process.exit(2);
}
const archivePath = resolve(archiveArgument);
const entries = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const forbiddenExtensions = new Set(['.m4a', '.mp3', '.mp4', '.qta', '.wav']);
const textExtensions = new Set(['', '.css', '.html', '.js', '.json', '.map', '.md', '.txt']);
const rules = [
  { name: 'private home path', pattern: /\/Users\/(?!example(?:\/|$))[^/\s]+\/[^\s"'`]*/giu },
  {
    name: 'Feishu identifier',
    pattern: /\b(?:app|chat|open|user)_[a-z0-9]{12,}\b/giu,
  },
  {
    name: 'credential assignment',
    pattern:
      /\b(?:app_secret|client_secret|access_token|refresh_token|tenant_access_token)\s*[:=]\s*["']?(?!REDACTED|YOUR_|<)[a-z0-9._-]{8,}/giu,
  },
  {
    name: 'Feishu Minutes URL',
    pattern: /https?:\/\/[^\s"'`]*(?:feishu|larksuite)[^\s"'`]*\/minutes\/[^\s"'`]*/giu,
  },
];
const findings = [];

for (const entry of entries) {
  if (
    entry.startsWith('/') ||
    entry.split('/').includes('..') ||
    !entry.startsWith('recording-agent-starter/')
  ) {
    findings.push(`${entry} [unsafe archive path]`);
    continue;
  }
  const extension = extname(entry).toLowerCase();
  if (
    forbiddenExtensions.has(extension) ||
    /(?:^|\/)(?:\.env|credentials?)(?:\/|$)/iu.test(entry)
  ) {
    findings.push(`${entry} [forbidden packaged file]`);
  }
  if (entry.endsWith('/') || !textExtensions.has(extension)) continue;
  const content = execFileSync('unzip', ['-p', archivePath, entry], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) findings.push(`${entry} [${rule.name}]`);
  }
}

if (findings.length > 0) {
  console.error('Archive audit failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Archive audit passed (${entries.length} entries checked).`);
}
