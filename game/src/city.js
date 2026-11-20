// Port Solano city layout: road grid, named building blocks, beach, palms and lamps.
// Buildings sit in the blocks between roads; each block holds one named building
// with a lit-window pattern so the skyline reads at a glance from above.
import { AVENUES_X, BEACH_X, BUILDING_NAMES, ROAD_W, STREETS_Y, WATER_X, WORLD_H, WORLD_W } from './config.js';
import { createRng } from './rng.js';

export function roadCenterLines() {
  return { vertical: AVENUES_X.slice(), horizontal: STREETS_Y.slice() };
}
export function isOnRoad(x, y) {
  for (const ax of AVENUES_X) if (Math.abs(x - ax) < ROAD_W / 2) return true;
  for (const sy of STREETS_Y) if (Math.abs(y - sy) < ROAD_W / 2) return true;
  return false;
}
export function isWater(x) { return x >= WATER_X; }
export function isBeach(x) { return x >= BEACH_X && x < WATER_X; }

export function buildCity(seed) {
  const rng = createRng(seed * 7919 + 13);
  const buildings = [];
  const xs = [40, ...AVENUES_X.map((a) => a + ROAD_W / 2 + 14), BEACH_X - 150];
  const ys = [40, ...STREETS_Y.map((s) => s + ROAD_W / 2 + 14)];
  const xEdges = [...AVENUES_X.map((a) => a - ROAD_W / 2 - 14), BEACH_X - 10];
  const yEdges = [...STREETS_Y.map((s) => s - ROAD_W / 2 - 14), WORLD_H - 40];
  let nameIdx = 0;
  for (let r = 0; r < ys.length; r++) {
    for (let c = 0; c < xs.length; c++) {
      const x0 = xs[c]; const y0 = ys[r];
      const x1 = xEdges[c] ?? (x0 + 180); const y1 = yEdges[r] ?? (y0 + 180);
      const w = x1 - x0; const h = y1 - y0;
      if (w < 90 || h < 90) continue;
      const inset = rng.int(6, 18);
      buildings.push({
        x: x0 + inset, y: y0 + inset, w: w - inset * 2, h: h - inset * 2,
        name: BUILDING_NAMES[nameIdx % BUILDING_NAMES.length],
        hue: rng.pick(['#4a3f66', '#54486e', '#3f4a6b', '#5d4660', '#46536b']),
        litSeed: rng.int(1, 99999), floors: rng.int(3, 7),
      });
      nameIdx++;
    }
  }
  const palms = [];
  for (let i = 0; i < 46; i++) {
    palms.push({ x: rng.range(BEACH_X + 8, WATER_X - 14), y: rng.range(30, WORLD_H - 30) });
  }
  for (let i = 0; i < 30; i++) {
    const onAve = rng.chance(0.5);
    if (onAve) palms.push({ x: rng.pick(AVENUES_X) + rng.pick([-1, 1]) * (ROAD_W / 2 + 12), y: rng.range(30, WORLD_H - 30) });
    else palms.push({ x: rng.range(30, BEACH_X - 20), y: rng.pick(STREETS_Y) + rng.pick([-1, 1]) * (ROAD_W / 2 + 12) });
  }
  const lamps = [];
  for (const ax of AVENUES_X) for (let y = 90; y < WORLD_H; y += 190) lamps.push({ x: ax - ROAD_W / 2 + 8, y });
  for (const sy of STREETS_Y) for (let x = 90; x < BEACH_X; x += 190) lamps.push({ x, y: sy - ROAD_W / 2 + 8 });
  return { buildings, palms, lamps, worldW: WORLD_W, worldH: WORLD_H };
}

export function buildingAt(city, x, y, pad) {
  const p = pad || 0;
  for (const b of city.buildings) {
    if (x > b.x - p && x < b.x + b.w + p && y > b.y - p && y < b.y + b.h + p) return b;
  }
  return null;
}
export function collidesBuilding(city, x, y, r) {
  return buildingAt(city, x, y, r) !== null;
}
// Push a circle out of any building it overlaps; returns corrected position.
export function resolveBuildingCollision(city, x, y, r) {
  const b = buildingAt(city, x, y, r);
  if (!b) return { x, y, hit: false };
  const left = x - (b.x - r); const right = (b.x + b.w + r) - x;
  const top = y - (b.y - r); const bottom = (b.y + b.h + r) - y;
  const m = Math.min(left, right, top, bottom);
  if (m === left) x = b.x - r; else if (m === right) x = b.x + b.w + r;
  else if (m === top) y = b.y - r; else y = b.y + b.h + r;
  return { x, y, hit: true };
}
export function nearestRoadPoint(x, y) {
  let best = { x, y, d: Infinity };
  for (const ax of AVENUES_X) { const d = Math.abs(x - ax); if (d < best.d) best = { x: ax, y, d }; }
  for (const sy of STREETS_Y) { const d = Math.abs(y - sy); if (d < best.d) best = { x, y: sy, d }; }
  return best;
}
