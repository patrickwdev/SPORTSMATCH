import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const args = ['MLB', ...process.argv.slice(2)];
spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), 'sync-espn.mjs'), ...args], {
  stdio: 'inherit',
});
