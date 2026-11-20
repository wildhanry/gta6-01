// Neon Harbor hand-in program (Node 22, standard library only).
// What it does, in order:
//   1. Resolve the output folder: MAKEFUN_OUTPUT_DIR when set, else /output.
//   2. Copy the static game (game/) and the screenshots (screenshots/) across.
//   3. Ask the vendored make.fun library to build dossier.json from the copies,
//      using exactly the scorer caps for this competition, and write it out.
// The game itself needs no build step: game/index.html plus its ES modules run
// straight from those files in a desktop browser, fully offline.
// Local check:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dossier caps mirror the gate for gta6-01: the text budget shapes the
// dossier bytes; the rest make this program refuse anything the scorer would.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(fromName: string, toName: string): void {
  const from = join(repoRoot, fromName);
  const to = join(outputDir, toName);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree('game', 'game');
copyTree('screenshots', 'screenshots');

const dossierBytes = buildDossier(outputDir, DOSSIER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
