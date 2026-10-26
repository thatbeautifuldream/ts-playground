import { cp, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const source = dirname(require.resolve('typescript'));
await mkdir('public/typescript', { recursive: true });
await Promise.all((await readdir(source)).filter(name => /^lib\..*\.d\.ts$/.test(name)).map(name => cp(join(source, name), join('public/typescript', name))));
