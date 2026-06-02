import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matches } from '../src/data/mockData';

const out = join(dirname(fileURLToPath(import.meta.url)), 'seed-data.json');
writeFileSync(out, JSON.stringify(matches, null, 2));
console.log(`Wrote ${matches.length} matches to ${out}`);
