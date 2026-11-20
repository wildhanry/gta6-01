// Pistol combat for Neon Harbor: click to fire toward the cursor, R reloads.
// Bullets are short-lived tracers; hits wound pedestrians and damage cars, and
// every shot is a crime the police can hear across a few blocks.
import { dist } from './rng.js';
import { scarePeds } from './entities.js';

export function createWeapon() {
  return { ammo: 12, reserve: 60, magSize: 12, cooldown: 0, reloading: 0 };
}
export function tryReload(state) {
  const w = state.weapon;
  if (w.reloading > 0 || w.ammo >= w.magSize || w.reserve <= 0) return;
  w.reloading = 0.9;
  state.audio.reload();
}
export function updateCombat(state, dt) {
  const w = state.weapon;
  const p = state.player;
  w.cooldown = Math.max(0, w.cooldown - dt);
  if (w.reloading > 0) {
    w.reloading -= dt;
    if (w.reloading <= 0) {
      const take = Math.min(w.magSize - w.ammo, w.reserve);
      w.ammo += take; w.reserve -= take;
    }
  }
  if (state.input.mouseDown && !p.inCar && p.alive && state.screen === 'playing') {
    if (w.cooldown <= 0 && w.reloading <= 0) {
      if (w.ammo > 0) fireBullet(state);
      else { tryReload(state); w.cooldown = 0.3; }
    }
  }
  // Move bullets and resolve hits.
  for (const b of state.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.hit) continue;
    for (const ped of state.peds) {
      if (ped.down) continue;
      if (dist(b.x, b.y, ped.x, ped.y) < 12) {
        b.hit = true; ped.health -= 34;
        state.fx.push({ x: ped.x, y: ped.y, life: 0.3, kind: 'spark', size: 9 });
        if (ped.health <= 0) state.knockPed(ped, true);
        else { ped.state = 'flee'; ped.fleeX = p.x; ped.fleeY = p.y; ped.timer = 2.5; state.police.reportCrime('shotPed', ped.x, ped.y); }
        break;
      }
    }
    if (b.hit) continue;
    for (const car of state.cars) {
      if (car === p.inCar) continue;
      if (Math.abs(b.x - car.x) < 26 && Math.abs(b.y - car.y) < 16) {
        b.hit = true; car.health -= 16;
        state.fx.push({ x: b.x, y: b.y, life: 0.25, kind: 'spark', size: 8 });
        if (car.kind === 'cop') state.police.reportCrime('hitCopCar', car.x, car.y);
        break;
      }
    }
  }
  state.bullets = state.bullets.filter((b) => b.life > 0 && !b.hit);
  // Particles fade.
  for (const f of state.fx) f.life -= dt;
  state.fx = state.fx.filter((f) => f.life > 0);
}
function fireBullet(state) {
  const w = state.weapon;
  const p = state.player;
  const cam = state.camera;
  const wx = cam.x + state.input.mouseX; const wy = cam.y + state.input.mouseY;
  const ang = Math.atan2(wy - p.y, wx - p.x) + state.rng.range(-0.03, 0.03);
  const speed = 780;
  state.bullets.push({ x: p.x, y: p.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 0.55, hit: false });
  state.fx.push({ x: p.x + Math.cos(ang) * 16, y: p.y + Math.sin(ang) * 16, life: 0.08, kind: 'muzzle', size: 10 });
  w.ammo--; w.cooldown = 0.19;
  p.angle = ang;
  state.audio.shoot();
  state.police.reportCrime('shot', p.x, p.y);
  scarePeds(state, p.x, p.y, 190);
  state.stats.shotsFired++;
}
