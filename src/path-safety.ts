import { homedir, tmpdir } from 'node:os';
import { isAbsolute, parse, relative, resolve } from 'node:path';

export type PathPurpose = 'workspace' | 'library';

function isInside(candidate: string, parent: string): boolean {
  const relation = relative(parent, candidate);
  return relation !== '' && !relation.startsWith('..') && !isAbsolute(relation);
}

export function validateSafeDirectory(input: string, purpose: PathPurpose): string {
  if (!isAbsolute(input)) {
    throw new Error(`${purpose} path must be absolute`);
  }

  const candidate = resolve(input);
  const root = parse(candidate).root;
  const home = resolve(homedir());
  const temporaryRoot = resolve(tmpdir());

  if (candidate === root) {
    throw new Error(`${purpose} path must not be the filesystem root`);
  }

  if (candidate === home) {
    throw new Error(`${purpose} path must not be the user home root`);
  }

  if (candidate === temporaryRoot || isInside(candidate, temporaryRoot)) {
    throw new Error(`${purpose} path must not be inside the temporary directory`);
  }

  return candidate;
}
