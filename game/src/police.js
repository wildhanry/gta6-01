// Wanted level and the Port Solano police response.
// Crimes raise heat; heat decays when the player breaks line of sight and keeps
// distance. Cop cars spawn at the city edge of the action and chase; a cop that
// holds the player at low speed fills the bust meter until the player is busted.
import { WORLD_H } from './config.js';
import { makeCar } from './vehicles.js';
import { clamp, dist } from './rng.js';

const CRIME_HEAT = { steal: 1, hitPed: 1, hitCar: 0.5, hitCopCar: 1, shot: 0.5, shotPed: 1, missionCrime: 1 };

export function createPolice() {
  return {
    heat: 0, bust: 0, coolTimer: 0, sirenTimer: 0,
    get wanted() { return Math.max(0, Math.min(5, Math.floor(this.heat + 0.0001))); },
    reportCrime(kind, x, y) {
      const add = CRIME_HEAT[kind] ?? 0.5;
      this.heat = clamp(this.heat + add, 0, 5.6);
      this.coolTimer = 0;
      this.lastCrime = { x, y, kind };
    },
    setWanted(level) { this.heat = clamp(level, 0, 5.6); this.coolTimer = 0; },
    clearWanted() { this.heat = 0; this.bust = 0; },
  };
}
export function wantedStars(police) { return police.wanted; }

export function updatePolice(state, dt) {
  const pol = state.police;
  const p = state.player;
  const wanted = pol.wanted;
  // Cool-down: out of sight and far from cops, heat bleeds away in steps.
  let seen = false;
  for (const cop of state.cops) if (dist(cop.x, cop.y, p.x, p.y) < 330) seen = true;
  if (!seen && wanted > 0) {
    pol.coolTimer += dt;
    const need = 7 - wanted; // higher heat takes longer to shake
    if (pol.coolTimer > need) { pol.heat = Math.max(0, Math.floor(pol.heat) - 0.999); pol.coolTimer = 0; if (pol.heat < 1) pol.heat = 0; }
  } else pol.coolTimer = 0;
  // Spawn cops up to the wanted level, at road points away from the player.
  const wantCops = wanted === 0 ? 0 : wanted + 1;
  if (state.cops.length < wantCops) {
    pol.spawnTimer = (pol.spawnTimer || 0) - dt;
    if (pol.spawnTimer <= 0) {
      pol.spawnTimer = 1.6;
      const spots = [[340, 340], [1140, 340], [1940, 340], [340, 1140], [1140, 1140], [1940, 1540], [740, 740], [1540, 740]];
      let spot = spots[state.rng.int(0, spots.length - 1)];
      for (const s of spots) if (dist(s[0], s[1], p.x, p.y) > 420) { spot = s; break; }
      const cop = makeCar(spot[0], spot[1], 0, '#dfe7ff', 'cop');
      cop.speed = 0;
      state.cops.push(cop); state.cars.push(cop);
    }
  }
  // Despawn far cops when the heat is gone.
  if (wanted === 0) {
    for (const cop of state.cops.slice()) {
      if (dist(cop.x, cop.y, p.x, p.y) > 520) removeCop(state, cop);
    }
  }
  // Chase behaviour: aim at the player, ram at speed, crowd at low speed.
  let busting = false;
  for (const cop of state.cops) {
    if (cop.health <= 0) continue;
    const d = dist(cop.x, cop.y, p.x, p.y);
    const targetAngle = Math.atan2(p.y - cop.y, p.x - cop.x);
    let diff = targetAngle - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const topSpeed = 235 + wanted * 26;
    cop.angle += clamp(diff, -2.4 * dt, 2.4 * dt);
    const want = d > 46 ? topSpeed : 30;
    cop.speed += clamp(want - cop.speed, -300 * dt, 190 * dt);
    cop.x = clamp(cop.x + Math.cos(cop.angle) * cop.speed * dt, 26, 2360);
    cop.y = clamp(cop.y + Math.sin(cop.angle) * cop.speed * dt, 26, WORLD_H - 26);
    const pSpeed = p.inCar ? Math.abs(p.inCar.speed) : 0;
    if (d < 54 && pSpeed < 55) busting = true;
    if (d < 40 && Math.abs(cop.speed) > 150) { state.damagePlayer(4); cop.speed *= 0.5; }
  }
  if (busting && wanted > 0) {
    pol.bust += dt / 2.2;
    if (pol.bust >= 1) { doBust(state); return; }
  } else pol.bust = Math.max(0, pol.bust - dt * 0.7);
  if (wanted > 0) {
    pol.sirenTimer -= dt;
    if (pol.sirenTimer <= 0) { pol.sirenTimer = 0.9; state.audio.siren(); }
  }
}
function removeCop(state, cop) {
  state.cops = state.cops.filter((c) => c !== cop);
  state.cars = state.cars.filter((c) => c !== cop);
}
export function doBust(state) {
  const fine = Math.min(state.cash, 60 + state.police.wanted * 40);
  state.cash -= fine;
  state.screen = 'busted';
  state.lastFine = fine;
  state.police.clearWanted();
  state.audio.busted();
  state.audio.setEngine(false, 0);
}
export function respawnPlayer(state) {
  const p = state.player;
  if (p.inCar) { p.inCar.kind = 'parked'; p.inCar = null; }
  p.x = 340; p.y = 360; p.health = 100; p.alive = true;
  state.cops.slice().forEach((c) => removeCop(state, c));
  state.police.clearWanted();
  state.screen = 'playing';
}
