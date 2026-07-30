#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const lockfiles = ['package-lock.json', 'workshop/package-lock.json'];
const allowed = new Set([
  '(MIT AND Zlib)',
  '(MIT OR GPL-3.0-or-later)',
  '(MPL-2.0 OR Apache-2.0)',
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC-BY-4.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MPL-2.0',
  'Python-2.0',
  'Unlicense',
]);
const reviewedMissingLicenses = new Map([
  ['workshop/package-lock.json:node_modules/khroma@2.1.0', 'MIT'],
  ['workshop/package-lock.json:node_modules/zigpty@0.2.1', 'MIT'],
]);
const totals = new Map();
const violations = [];
const results = [];

for (const lockfilePath of lockfiles) {
  const lockfile = JSON.parse(readFileSync(lockfilePath, 'utf8'));
  const counts = new Map();
  const reviewed = [];

  for (const [path, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (path === '') continue;
    const fallbackKey = `${lockfilePath}:${path}@${metadata.version ?? 'missing'}`;
    const license =
      typeof metadata.license === 'string'
        ? metadata.license
        : reviewedMissingLicenses.get(fallbackKey);
    if (typeof license !== 'string' || !allowed.has(license)) {
      violations.push({ lockfilePath, path, license: metadata.license ?? 'missing' });
      continue;
    }
    if (metadata.license === undefined) reviewed.push({ path, version: metadata.version, license });
    counts.set(license, (counts.get(license) ?? 0) + 1);
    totals.set(license, (totals.get(license) ?? 0) + 1);
  }

  results.push({
    lockfile: lockfilePath,
    packageEntries: [...counts.values()].reduce((sum, value) => sum + value, 0),
    licenses: Object.fromEntries(
      [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
    ),
    reviewedMissingLicenseMetadata: reviewed,
  });
}

if (violations.length > 0) {
  console.error('Dependency license audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation.lockfilePath}:${violation.path}: ${violation.license}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      result: 'passed',
      lockfiles: results,
      totalPackageEntries: [...totals.values()].reduce((sum, value) => sum + value, 0),
      totalLicenses: Object.fromEntries(
        [...totals.entries()].sort(([left], [right]) => left.localeCompare(right)),
      ),
    }),
  );
}
