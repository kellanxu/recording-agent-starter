#!/usr/bin/env node

import { rmSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const dist = resolve('dist');
if (basename(dist) !== 'dist') throw new Error('refusing to clean an unexpected directory');
rmSync(dist, { recursive: true, force: true });
