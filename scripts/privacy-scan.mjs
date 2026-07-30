#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const textExtensions = new Set([
  '',
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.sh',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

const rules = [
  {
    name: 'private home or KE Nexus path',
    pattern:
      /\/Users\/(?!example(?:\/|$)|YOUR_NAME(?:\/|$)|username(?:\/|$))[^/\s"'`]+\/(?:Library\/Mobile Documents\/iCloud~md~obsidian|Obsidian|-KE-Nexus|ke_project)\b/giu,
  },
  {
    name: 'Feishu app, chat, open or user identifier',
    pattern: /\b(?:app|chat|open|user)_[a-z0-9]{12,}\b/giu,
  },
  {
    name: 'credential-like assignment',
    pattern:
      /\b(?:app_secret|client_secret|access_token|refresh_token|tenant_access_token)\s*[:=]\s*["']?(?!REDACTED|YOUR_|<)[a-z0-9._-]{8,}/giu,
  },
  {
    name: 'Feishu Minutes URL',
    pattern: /https?:\/\/[^\s"'`]*(?:feishu|larksuite)[^\s"'`]*\/minutes\/[^\s"'`]*/giu,
  },
  {
    name: 'recording or transcript payload marker',
    pattern: /\b(?:transcript_text|transcript_body|raw_transcript)\s*[:=]\s*["'][^"']{20,}/giu,
  },
];

const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);

const findings = [];

for (const file of tracked) {
  if (!textExtensions.has(extname(file).toLowerCase())) continue;

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of content.matchAll(rule.pattern)) {
      const line = content.slice(0, match.index).split('\n').length;
      findings.push(`${file}:${line} [${rule.name}]`);
    }
  }
}

if (findings.length > 0) {
  console.error('Privacy scan failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Privacy scan passed (${tracked.length} repository files checked).`);
}
