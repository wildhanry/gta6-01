// Cars of Port Solano: parked cars waiting to be stolen, AI traffic looping the
// road grid, and the driving model for whichever car the player is sitting in.
import { AVENUES_X, CAR_COLORS, STREETS_Y, WORLD_H, WORLD_W } from './config.js';
import { isOnRoad, resolveBuildingCollision } from './city.js';
import { clamp, createRng, dist } from './rng.js';

let nextCarId = 1;
export function makeCar(x, y, angle, color, kind) {
  return {
    id: nextCarId++, x, y, angle, speed: 0, w: 44, h: 22, color,
    kind: kind || 'civil', driver: true, health: 100, steer: 0,
    route: null, waitTimer: 0, honked: false,
  };
}
export function spawnCars(city, seed) {
  const rng = createRng(seed * 104729 + 3);
  const cars = [];
  // Parked cars hug the kerbs of avenues and streets.
  for (let i = 0; i < 16; i++) {
    const onAve = rng.chance(0.55);
    let x; let y; let angle;
    if (onAve) { const ax = rng.pick(AVENUES_X); x = ax + rng.pick([-1, 1]) * 44; y = rng.range(80, WORLD_H - 80); angle = Math.PI / 2; }
    else { const sy = rng.pick(STREETS_Y); y = sy + rng.pick([-1, 1]) * 44; x = rng.range(80, 1980); angle = 0; }
    cars.push(makeCar(x, y, angle, rng.pick(CAR_COLORS), 'parked'));
  }
  // Moving traffic picks a road and follows it, turning at junctions.
  for (let i = 0; i < 10; i++) {
    const vertical = rng.chance(0.5);
    let car;
    if (vertical) { const ax = rng.pick(AVENUES_X); car = makeCar(ax + 26, rng.range(80, WORLD_H - 80), Math.PI / 2, rng.pick(CAR_COLORS), 'traffic'); }
    else { const sy = rng.pick(STREETS_Y); car = makeCar(rng.range(80, 1980), sy + 26, 0, rng.pick(CAR_COLORS), 'traffic'); }
    car.speed = rng.range(90, 150);
    car.route = { vertical, dir: rng.pick([-1, 1]) };
    cars.push(car);
  }
  void city;
  return cars;
}
function laneOffset(route) { return route.dir > 0 ? 26 : -26; }
export function updateTraffic(state, dt) {
  for (const car of state.cars) {
    if (car.kind !== 'traffic' || car === state.player.inCar) continue;
    if (car.health <= 0) continue;
    // Simple courtesy stop: brake when something is close ahead.
    let blocked = false;
    const fx = car.x + Math.cos(car.angle) * 52; const fy = car.y + Math.sin(car.angle) * 52;
    for (const other of state.cars) {
      if (other === car) continue;
      if (dist(fx, fy, other.x, other.y) < 34) { blocked = true; break; }
    }
    if (!state.player.inCar && dist(fx, fy, state.player.x, state.player.y) < 30) blocked = true;
    const target = blocked ? 0 : 132;
    car.speed += clamp(target - car.speed, -260 * dt, 120 * dt);
    if (Math.abs(car.speed) < 2 && blocked) continue;
    const route = car.route || { vertical: true, dir: 1 };
    let nx = car.x + Math.cos(car.angle) * car.speed * dt;
    let ny = car.y + Math.sin(car.angle) * car.speed * dt;
    // At a junction, sometimes turn onto the crossing road.
    const nearAve = AVENUES_X.find((a) => Math.abs(car.x - a) < 10);
    const nearSt = STREETS_Y.find((s) => Math.abs(car.y - s) < 10);
    if (route.vertical && nearSt !== undefined && state.rng.chance(0.006)) {
      route.vertical = false; route.dir = state.rng.pick([-1, 1]);
      car.angle = route.dir > 0 ? 0 : Math.PI; car.y = nearSt + laneOffset(route);
    } else if (!route.vertical && nearAve !== undefined && state.rng.chance(0.006)) {
      route.vertical = true; route.dir = state.rng.pick([-1, 1]);
      car.angle = route.dir > 0 ? Math.PI / 2 : -Math.PI / 2; car.x = nearAve + laneOffset(route);
    }
    if (nx < 50 || nx > 2010 || ny < 50 || ny > WORLD_H - 50) {
      route.dir *= -1;
      car.angle += Math.PI;
      if (route.vertical) car.x += laneOffset(route) * 2 * (route.dir > 0 ? 1 : -1) * 0 + (route.dir > 0 ? 0 : 0);
      nx = clamp(nx, 50, 2010); ny = clamp(ny, 50, WORLD_H - 50);
    }
    car.x = nx; car.y = ny;
  }
}
export function driveCar(state, dt) {
  const car = state.player.inCar;
  if (!car) return;
  const input = state.input;
  const accel = input.down('KeyW', 'ArrowUp') ? 340 : 0;
  const brake = input.down('KeyS', 'ArrowDown') ? 420 : 0;
  const hand = input.down('Space');
  car.speed += accel * dt;
  if (brake) car.speed -= (car.speed > 4 ? brake : 190) * dt;
  car.speed -= car.speed * (hand ? 2.4 : 0.55) * dt;
  if (!accel && !brake) car.speed -= car.speed * 0.4 * dt;
  car.speed = clamp(car.speed, -130, 430);
  if (Math.abs(car.speed) < 3 && !accel && !brake) car.speed = 0;
  const steerIn = (input.down('KeyA', 'ArrowLeft') ? -1 : 0) + (input.down('KeyD', 'ArrowRight') ? 1 : 0);
  car.steer = steerIn;
  if (steerIn !== 0 && car.speed !== 0) {
    car.angle += steerIn * 1.9 * dt * clamp(car.speed / 160, -1, 1) * (car.speed < 0 ? -1 : 1);
  }
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const fixed = resolveBuildingCollision(state.city, clamp(nx, 30, WORLD_W - 30), clamp(ny, 30, WORLD_H - 30), 20);
  if (fixed.hit && Math.abs(car.speed) > 120) {
    state.fx.push({ x: car.x, y: car.y, life: 0.5, kind: 'smoke', size: 16 });
    state.audio.crash();
    car.health -= 12;
    if (car.kind === 'cop') state.police.reportCrime('hitCopCar', car.x, car.y);
  }
  if (fixed.hit) car.speed *= 0.35;
  car.x = fixed.x; car.y = fixed.y;
  state.player.x = car.x; state.player.y = car.y; state.player.angle = car.angle;
  state.audio.setEngine(true, car.speed / 430);
  checkCarCollisions(state, car, dt);
}
function checkCarCollisions(state, car, dt) {
  void dt;
  for (const other of state.cars) {
    if (other === car) continue;
    if (dist(car.x, car.y, other.x, other.y) < 40) {
      other.health -= Math.abs(car.speed) * 0.06;
      if (Math.abs(car.speed) > 60) {
        state.fx.push({ x: other.x, y: other.y, life: 0.4, kind: 'spark', size: 12 });
        state.audio.crash();
        if (other.kind === 'cop') state.police.reportCrime('hitCopCar', other.x, other.y);
        else state.police.reportCrime('hitCar', other.x, other.y);
        car.speed *= 0.55;
        other.x += Math.cos(car.angle) * 10; other.y += Math.sin(car.angle) * 10;
      }
    }
  }
  if (Math.abs(car.speed) > 90) {
    for (const ped of state.peds) {
      if (ped.down) continue;
      if (dist(car.x, car.y, ped.x, ped.y) < 26) {
        state.knockPed(ped, true);
        state.fx.push({ x: ped.x, y: ped.y, life: 0.4, kind: 'spark', size: 10 });
      }
    }
  }
}
export function nearestStealableCar(state, range) {
  let best = null; let bestD = range || 46;
  for (const car of state.cars) {
    if (car.health <= 0) continue;
    const d = dist(state.player.x, state.player.y, car.x, car.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}
export function enterCar(state, car) {
  state.player.inCar = car;
  car.driver = true;
  if (car.kind === 'parked' || car.kind === 'traffic') {
    const wasKind = car.kind;
    car.kind = 'player';
    // A theft seen by anyone nearby is a crime; a quiet one still risks a call-in.
    state.police.reportCrime('steal', car.x, car.y);
    state.stats.carsStolen++;
    void wasKind;
  }
  state.audio.click();
}
export function exitCar(state) {
  const car = state.player.inCar;
  if (!car) return;
  state.player.inCar = null;
  state.player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 30;
  state.player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 30;
  const fixed = resolveBuildingCollision(state.city, state.player.x, state.player.y, state.player.r);
  state.player.x = fixed.x; state.player.y = fixed.y;
  if (car.kind === 'player') car.kind = 'parked';
  car.speed = 0;
  state.audio.setEngine(false, 0);
}
export function isOnAnyRoad(x, y) { return isOnRoad(x, y); }
