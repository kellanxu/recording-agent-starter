#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const lockfile = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const allowed = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'ISC',
  'MIT',
  'MPL-2.0',
  'Python-2.0',
]);
const counts = new Map();
const violations = [];

for (const [path, metadata] of Object.entries(lockfile.packages ?? {})) {
  if (path === '') continue;
  const license = metadata.license;
  if (typeof license !== 'string' || !allowed.has(license)) {
    violations.push({ path, license: license ?? 'missing' });
    continue;
  }
  counts.set(license, (counts.get(license) ?? 0) + 1);
}

if (violations.length > 0) {
  console.error('Dependency license audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.license}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      result: 'passed',
      packageEntries: [...counts.values()].reduce((sum, value) => sum + value, 0),
      licenses: Object.fromEntries(
        [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
      ),
    }),
  );
}
