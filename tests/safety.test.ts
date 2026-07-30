import { readdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { writeFileAtomic } from '../src/atomic-file.js';
import { redactLogMessage } from '../src/redaction.js';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('atomic writes and log redaction', () => {
  it('replaces a file atomically without leaving temporary files', async () => {
    const root = resolve('tmp', `atomic-${process.pid}`);
    roots.push(root);
    const target = join(root, 'state.json');
    await writeFileAtomic(target, '{"value":1}\n');
    await writeFileAtomic(target, '{"value":2}\n');
    expect(await readFile(target, 'utf8')).toBe('{"value":2}\n');
    expect(await readdir(root)).toEqual(['state.json']);
  });

  it('redacts identifiers, credentials, transcript fragments and home paths', () => {
    const identifier = ['user', 'abcdefgh1234'].join('_');
    const credential = ['access', 'token'].join('_');
    const transcriptField = ['transcript', 'text'].join('_');
    const unsafePath = ['/', 'Users', 'person', 'private', 'file'].join('/');
    const redacted = redactLogMessage(
      `${identifier} ${credential}=unsafe-value ${transcriptField}="private words" ${unsafePath}`,
    );
    expect(redacted).not.toContain(identifier);
    expect(redacted).not.toContain('unsafe-value');
    expect(redacted).not.toContain('private words');
    expect(redacted).not.toContain(unsafePath);
    expect(redacted).toContain('[REDACTED_ID]');
  });
});
