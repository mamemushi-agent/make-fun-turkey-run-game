// Pardon Run — hand-in program for make.fun's turkey-run-game-01
// (Node 22, standard library only).
//
// The game itself is this repository's game/ folder: plain static files a
// desktop browser opens offline (game/index.html and its ES modules, no
// library, no network). This program hands it in: it copies game/ and
// screenshots/ from beside this file to the output directory and writes
// dossier.json there, the summary the judge reads, using the vendored
// make.fun library (kept byte-for-byte from the kit, as the rules ask).
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (from the kit's gate): text_max_bytes shapes the
// dossier text; the others refuse up front what the scorer would refuse —
// more than 4 screenshots or one over 256 KiB, more than 993 files or
// 48 MiB under game/, or a path under game/ over 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
