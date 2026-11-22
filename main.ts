// Emberfall Duel — hand-in program (Node 22, standard library only).
// The game itself lives in game/ as plain static files that a desktop
// browser opens offline. This program's one job is to hand the entry in:
// copy game/ and screenshots/ from beside this file into the output
// directory and write dossier.json there with the vendored make.fun
// library, so the grader sees exactly the bytes this repository holds.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier limits mirror the sealed scorer's caps, so this program
// refuses to write an entry the scorer would refuse: at most 4
// screenshots of at most 256 KiB each, at most 993 files and 48 MiB
// under game/, no game/ path over 1000 bytes, dossier text capped at
// 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
