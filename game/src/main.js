// Neon Harbor boot and game loop for Port Solano.
// Fixed-step simulation (1/60 s) is kept apart from rendering: the loop banks
// elapsed time, steps the world in equal slices, then paints one frame.
// Screens: start, playing, paused, busted, wasted. ?shot= stages a scene.
import { STEP } from './config.js';
import { createRng } from './rng.js';
import { buildCity } from './city.js';
import { ACT_CONFIRM, ACT_ENTER, ACT_HELP, ACT_PAUSE, ACT_RELOAD, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createPlayer, damagePlayer, knockDownPed, movePlayer, spawnPedestrians, updatePedestrians } from './entities.js';
import { driveCar, enterCar, exitCar, makeCar, nearestStealableCar, spawnCars, updateTraffic } from './vehicles.js';
import { createPolice, respawnPlayer, updatePolice } from './police.js';
import { createWeapon, tryReload, updateCombat } from './combat.js';
import { createMissionState, startMission, updateMissions } from './missions.js';
import { createRenderer, clampCamera } from './render.js';
import { clearSave, defaultSave, hasSave, loadSave, writeSave } from './save.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261120;

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const input = createInput(canvas);
const audio = createAudio();
const city = buildCity(seed);
const saved = loadSave();

const state = {
  seed, rng: createRng(seed), city, input, audio,
  screen: shotName ? 'playing' : 'start',
  time: 0, cash: saved ? saved.cash : defaultSave().cash,
  player: createPlayer(saved ? saved.x : 340, saved ? saved.y : 360),
  peds: spawnPedestrians(city, seed, 34),
  cars: [], cops: [], bullets: [], fx: [],
  police: createPolice(), weapon: createWeapon(),
  mission: createMissionState(),
  camera: { x: 0, y: 0 }, prompt: '', showHelp: false,
  hasSaveData: hasSave(), lastFine: 0,
  missionsDone: saved ? saved.missionsDone : 0,
  missionIndex: saved ? saved.missionIndex : 0,
  taxiFares: saved ? saved.taxiFares : 0, trialsWon: saved ? saved.trialsWon : 0,
  stats: { carsStolen: 0, pedsDown: 0, shotsFired: 0 },
  damagePlayer(amount) { damagePlayer(state, amount); },
  knockPed(ped, byPlayer) { knockDownPed(state, ped, byPlayer); },
  saveNow() { writeSave(state); state.hasSaveData = true; },
  spawnMissionCar(x, y, color) {
    const car = makeCar(x, y, 0, color, 'mission');
    state.cars.push(car);
    return car;
  },
  spawnCopAt(x, y) {
    const cop = makeCar(x, y, 0, '#dfe7ff', 'cop');
    state.cops.push(cop); state.cars.push(cop);
    return cop;
  },
  enterCarDirect(car) {
    state.player.inCar = car; car.kind = 'player'; car.driver = true;
    state.player.x = car.x; state.player.y = car.y;
  },
  stepWorld(dt) { stepWorld(dt); },
};
state.cars = spawnCars(city, seed);
state.mission.index = state.missionIndex;
if (state.missionIndex >= 5) state.mission.finished = true;

function stepWorld(dt) {
  state.time += dt;
  if (state.screen !== 'playing') return;
  const actions = input.takeActions();
  if (actions & ACT_PAUSE) { state.screen = 'paused'; return; }
  if (actions & ACT_HELP) state.showHelp = !state.showHelp;
  if (actions & ACT_RELOAD) tryReload(state);
  if (actions & ACT_ENTER) {
    if (state.player.inCar) exitCar(state);
    else {
      const car = nearestStealableCar(state);
      if (car) enterCar(state, car);
    }
  }
  movePlayer(state, dt);
  if (state.player.inCar) driveCar(state, dt);
  else audio.setEngine(false, 0);
  updateTraffic(state, dt);
  updatePedestrians(state, dt);
  updateMissions(state, dt);
  updatePolice(state, dt);
  updateCombat(state, dt);
  if (!state.player.inCar) {
    state.prompt = nearestStealableCar(state) ? 'Press E to enter car' : '';
  } else state.prompt = 'Press E to exit - Space handbrake';
  clampCamera(state);
}
function handleMenuKeys() {
  const actions = input.takeActions();
  if (state.screen === 'start') {
    if (input.down('KeyN')) { clearSave(); resetRun(defaultSave()); startPlay(); return; }
    if (input.down('KeyX')) { clearSave(); state.hasSaveData = false; }
    if ((actions & ACT_CONFIRM) || input.mouseDown) { audio.unlock(); audio.click(); startPlay(); }
    return;
  }
  if (state.screen === 'paused') {
    if ((actions & ACT_PAUSE) || (actions & ACT_CONFIRM)) state.screen = 'playing';
    if (actions & ACT_HELP) state.showHelp = !state.showHelp;
    return;
  }
  if (state.screen === 'busted' || state.screen === 'wasted') {
    if (actions & ACT_CONFIRM) {
      if (state.screen === 'wasted') state.cash = Math.max(0, state.cash - 80);
      respawnPlayer(state);
      state.saveNow();
    }
  }
}
function resetRun(save) {
  state.cash = save.cash; state.missionsDone = 0;
  state.player.x = save.x; state.player.y = save.y;
  state.player.health = 100; state.player.alive = true; state.player.inCar = null;
  state.mission = createMissionState();
  state.police.clearWanted();
}
function startPlay() {
  state.screen = 'playing';
  if (!state.mission.started) {
    state.mission.started = true;
    startMission(state, state.mission.index);
  }
  clampCamera(state);
}

const renderer = createRenderer(canvas);
// Test and staging surface: the harness drives the same functions a player hits.
window.__game = { state, enterCar, exitCar, nearestStealableCar, startMission, respawnPlayer, stageShot };

if (shotName) {
  const ok = stageShot(state, shotName);
  clampCamera(state);
  renderer.draw(state);
  requestAnimationFrame(() => { renderer.draw(state); window.__shotReady = ok; });
  if (statusEl) statusEl.textContent = 'Neon Harbor screenshot scene: ' + shotName;
} else {
  let last = performance.now();
  let bank = 0;
  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (state.screen === 'playing') {
      bank += elapsed;
      while (bank >= STEP) { stepWorld(STEP); bank -= STEP; if (state.screen !== 'playing') { bank = 0; break; } }
    } else {
      handleMenuKeys();
      state.time += elapsed;
      clampCamera(state);
    }
    renderer.draw(state);
    if (statusEl) statusEl.textContent = 'Neon Harbor - cash $' + Math.floor(state.cash) + ', wanted ' + state.police.wanted;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
