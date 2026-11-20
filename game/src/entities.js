// People of Port Solano: the player courier Reyes and the sidewalk pedestrians.
// Pedestrians stroll along block edges, flee from gunfire and crashes, and can be
// knocked down (which the police notice). The player walks, runs and takes damage.
import { PED_COLORS, PED_SPEED, PLAYER_RUN, PLAYER_SPEED, WORLD_H, WORLD_W } from './config.js';
import { collidesBuilding, resolveBuildingCollision } from './city.js';
import { clamp, createRng, dist } from './rng.js';

export function createPlayer(x, y) {
  return {
    x, y, vx: 0, vy: 0, r: 11, angle: -Math.PI / 2, health: 100,
    inCar: null, alive: true, walkPhase: 0, name: 'Reyes',
  };
}
export function movePlayer(state, dt) {
  const p = state.player;
  if (p.inCar || !p.alive) return;
  const input = state.input;
  const run = input.down('ShiftLeft', 'ShiftRight');
  const speed = run ? PLAYER_RUN : PLAYER_SPEED;
  let mx = input.axisX(); let my = input.axisY();
  const len = Math.sqrt(mx * mx + my * my) || 1;
  if (mx !== 0 || my !== 0) {
    mx /= len; my /= len;
    p.angle = Math.atan2(my, mx);
    p.walkPhase += dt * (run ? 13 : 9);
  }
  const nx = clamp(p.x + mx * speed * dt, 14, WORLD_W - 14);
  const ny = clamp(p.y + my * speed * dt, 14, WORLD_H - 14);
  const fixed = resolveBuildingCollision(state.city, nx, ny, p.r);
  p.x = fixed.x; p.y = fixed.y;
  // The sea is a wall for walkers: Reyes will not wade past the shoreline.
  if (p.x > 2160) p.x = 2160;
}
export function damagePlayer(state, amount) {
  const p = state.player;
  if (!p.alive) return;
  p.health -= amount;
  if (p.health <= 0) { p.health = 0; p.alive = false; state.screen = 'wasted'; state.audio.wasted(); }
}
export function spawnPedestrians(city, seed, count) {
  const rng = createRng(seed * 331 + 7);
  const peds = [];
  for (let i = 0; i < count; i++) {
    let x = 0; let y = 0; let tries = 0;
    do { x = rng.range(60, 2000); y = rng.range(60, WORLD_H - 60); tries++; }
    while (collidesBuilding(city, x, y, 12) && tries < 12);
    peds.push({
      x, y, r: 9, angle: rng.range(0, Math.PI * 2), speed: PED_SPEED * rng.range(0.7, 1.2),
      color: rng.pick(PED_COLORS), health: 30, state: 'walk', fleeX: 0, fleeY: 0,
      timer: rng.range(1, 4), down: false, walkPhase: rng.range(0, 6),
    });
  }
  return peds;
}
export function updatePedestrians(state, dt) {
  const p = state.player;
  for (const ped of state.peds) {
    if (ped.down) continue;
    ped.walkPhase += dt * 7;
    let mx = Math.cos(ped.angle); let my = Math.sin(ped.angle);
    if (ped.state === 'flee') {
      const d = dist(ped.x, ped.y, ped.fleeX, ped.fleeY) || 1;
      mx = (ped.x - ped.fleeX) / d; my = (ped.y - ped.fleeY) / d;
      ped.timer -= dt;
      if (ped.timer <= 0) ped.state = 'walk';
    } else {
      ped.timer -= dt;
      if (ped.timer <= 0) { ped.angle += state.rng.range(-1.4, 1.4); ped.timer = state.rng.range(1.5, 4); }
    }
    const sp = ped.state === 'flee' ? ped.speed * 2.1 : ped.speed;
    let nx = ped.x + mx * sp * dt; let ny = ped.y + my * sp * dt;
    if (nx < 20 || nx > 2050 || ny < 20 || ny > WORLD_H - 20) { ped.angle += Math.PI; continue; }
    const fixed = resolveBuildingCollision(state.city, nx, ny, ped.r);
    if (fixed.hit) ped.angle += Math.PI * 0.6 + state.rng.range(-0.3, 0.3);
    ped.x = fixed.x; ped.y = fixed.y;
    void p;
  }
}
export function scarePeds(state, x, y, radius) {
  for (const ped of state.peds) {
    if (ped.down) continue;
    if (dist(ped.x, ped.y, x, y) < radius) {
      ped.state = 'flee'; ped.fleeX = x; ped.fleeY = y; ped.timer = 2.4;
    }
  }
}
export function knockDownPed(state, ped, byPlayerAction) {
  if (ped.down) return;
  ped.down = true; ped.health = 0;
  state.stats.pedsDown++;
  if (byPlayerAction) state.police.reportCrime('hitPed', ped.x, ped.y);
}
