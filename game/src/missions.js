// Story missions for Neon Harbor: Reyes the courier versus the Copperline gang.
// Five chained jobs with world markers, objective banners and cash rewards, then
// free roam with two repeatable side activities (taxi fares and checkpoint runs).
import { dist } from './rng.js';

export const STORY_INTRO = 'Port Solano, sunset. Reyes, a bike courier who owes the Copperline gang for a lost parcel, takes one last chain of jobs to clear the debt before the gang takes the harbour.';
export const MISSIONS = [
  {
    id: 'm1', title: 'M1 - Pier Pressure', reward: 150,
    brief: 'Marta at the diner: "Take this package to the pier, Reyes. No questions."',
    objective: 'Deliver the package to the pier marker',
    type: 'goto', target: { x: 2100, y: 340 }, radius: 56,
  },
  {
    id: 'm2', title: 'M2 - Borrowed Wheels', reward: 220,
    brief: 'Marta: "Copperline left a gold coupe by Vista Tower. Borrow it. Bring it to my garage."',
    objective: 'Steal the gold coupe and deliver it to the garage',
    type: 'stealDeliver', carAt: { x: 1140, y: 760 }, target: { x: 420, y: 1180 }, radius: 64,
  },
  {
    id: 'm3', title: 'M3 - Copperline Chase', reward: 300,
    brief: 'Marta: "Their runner is bolting north with the ledger. Stop that car!"',
    objective: 'Chase down and stop the Copperline runner',
    type: 'chase', carAt: { x: 1540, y: 340 }, radius: 60,
  },
  {
    id: 'm4', title: 'M4 - Three Cases', reward: 380,
    brief: 'Marta: "Three cases, three rooftops of trouble. Grab them all - the law will notice."',
    objective: 'Collect all 3 cases', type: 'collect',
    points: [{ x: 740, y: 1180 }, { x: 1540, y: 1180 }, { x: 1140, y: 420 }], radius: 40,
  },
  {
    id: 'm5', title: 'M5 - Breakwater Run', reward: 500,
    brief: 'Marta: "Debt is paid when you reach the breakwater safehouse. Every cop in Solano disagrees."',
    objective: 'Lose the heat and reach the safehouse', type: 'escape',
    target: { x: 2100, y: 1560 }, radius: 64, wantedLevel: 3,
  },
];

export function createMissionState() {
  return {
    index: 0, phase: 'brief', banner: '', bannerTimer: 0, dialog: '',
    targetCar: null, collected: 0, side: null, sideTimer: 0, finished: false,
  };
}
export function currentMission(state) {
  return MISSIONS[state.mission.index] || null;
}
export function missionMarker(state) {
  const m = currentMission(state);
  const ms = state.mission;
  if (!m) return sideMarker(state);
  if (m.type === 'goto' || m.type === 'escape') return { x: m.target.x, y: m.target.y, label: 'Objective' };
  if (m.type === 'stealDeliver') {
    if (ms.phase === 'toCar' && ms.targetCar) return { x: ms.targetCar.x, y: ms.targetCar.y, label: 'Target car' };
    return { x: m.target.x, y: m.target.y, label: 'Garage' };
  }
  if (m.type === 'chase' && ms.targetCar) return { x: ms.targetCar.x, y: ms.targetCar.y, label: 'Runner' };
  if (m.type === 'collect') {
    const pt = m.points[ms.collected];
    if (pt) return { x: pt.x, y: pt.y, label: 'Case ' + (ms.collected + 1) };
  }
  return null;
}
function sideMarker(state) {
  const s = state.mission.side;
  if (!s) return null;
  return { x: s.x, y: s.y, label: s.kind === 'taxi' ? 'Fare drop' : 'Checkpoint' };
}
export function startMission(state, index) {
  const ms = state.mission;
  ms.index = index; ms.collected = 0; ms.targetCar = null;
  const m = MISSIONS[index];
  if (!m) { ms.finished = true; ms.dialog = 'Debt cleared. Port Solano is yours, Reyes. Free roam: grab taxi fares or run checkpoints.'; return; }
  ms.phase = m.type === 'stealDeliver' ? 'toCar' : 'active';
  ms.dialog = m.brief; ms.banner = m.title; ms.bannerTimer = 4;
  if (m.type === 'stealDeliver' || m.type === 'chase') {
    const car = state.spawnMissionCar(m.carAt.x, m.carAt.y, m.type === 'stealDeliver' ? '#ffd166' : '#c1121f');
    ms.targetCar = car;
    if (m.type === 'chase') { car.kind = 'runner'; car.route = { vertical: false, dir: 1 }; car.speed = 120; car.angle = 0; }
  }
  if (m.type === 'escape') state.police.setWanted(m.wantedLevel);
}
export function completeMission(state) {
  const m = currentMission(state);
  if (!m) return;
  state.cash += m.reward;
  state.missionsDone++;
  state.audio.missionDone(); state.audio.cash();
  state.mission.banner = m.title + ' complete  +$' + m.reward;
  state.mission.bannerTimer = 4;
  state.mission.dialog = 'Paid $' + m.reward + '. ';
  startMission(state, state.mission.index + 1);
  state.saveNow();
}
export function updateMissions(state, dt) {
  const ms = state.mission;
  if (ms.bannerTimer > 0) ms.bannerTimer -= dt;
  const p = state.player;
  updateSide(state, dt);
  const m = currentMission(state);
  if (!m || state.screen !== 'playing') return;
  if (m.type === 'goto') {
    if (dist(p.x, p.y, m.target.x, m.target.y) < m.radius) completeMission(state);
  } else if (m.type === 'stealDeliver') {
    if (ms.phase === 'toCar') {
      if (p.inCar === ms.targetCar) { ms.phase = 'deliver'; ms.dialog = 'Marta: "That is the one. Garage, now - gently."'; }
    } else if (ms.phase === 'deliver') {
      if (p.inCar === ms.targetCar && dist(p.x, p.y, m.target.x, m.target.y) < m.radius) completeMission(state);
    }
  } else if (m.type === 'chase') {
    const car = ms.targetCar;
    if (car) {
      if (car.kind === 'runner') {
        // Runner flees along streets; player contact at speed slows it down.
        if (dist(car.x, car.y, p.x, p.y) < 300) {
          car.speed = Math.min(215, car.speed + 40 * dt);
          if (car.x > 1980) { car.route.dir = -1; car.angle = Math.PI; }
          if (car.x < 120) { car.route.dir = 1; car.angle = 0; }
          car.x += Math.cos(car.angle) * car.speed * dt;
        }
        if (p.inCar && dist(p.x, p.y, car.x, car.y) < 42 && Math.abs(p.inCar.speed) > 90) {
          car.health -= 55 * dt;
          state.fx.push({ x: car.x, y: car.y, life: 0.3, kind: 'smoke', size: 12 });
        }
        if (car.health <= 35) { car.speed = 0; car.kind = 'stopped'; ms.dialog = 'Runner stopped. Ledger recovered.'; completeMission(state); }
      }
    }
  } else if (m.type === 'collect') {
    const pt = m.points[ms.collected];
    if (pt && dist(p.x, p.y, pt.x, pt.y) < m.radius) {
      ms.collected++; state.audio.pickup();
      state.police.reportCrime('missionCrime', p.x, p.y);
      ms.dialog = 'Case ' + ms.collected + ' of 3 secured.';
      if (ms.collected >= m.points.length) completeMission(state);
    }
  } else if (m.type === 'escape') {
    if (state.police.wanted === 0 && dist(p.x, p.y, m.target.x, m.target.y) < m.radius) completeMission(state);
    else if (state.police.wanted === 0) ms.dialog = 'Heat is off. Get to the safehouse marker.';
  }
}
// Side activities after (or between) story jobs.
export function startSideActivity(state) {
  const ms = state.mission;
  if (ms.side) return;
  const spots = [{ x: 740, y: 340 }, { x: 1540, y: 740 }, { x: 420, y: 1540 }, { x: 1900, y: 1140 }, { x: 1140, y: 1560 }];
  const spot = spots[state.rng.int(0, spots.length - 1)];
  const kind = state.rng.chance(0.5) ? 'taxi' : 'trial';
  ms.side = { kind, x: spot.x, y: spot.y, time: kind === 'trial' ? 45 : 90 };
  ms.dialog = kind === 'taxi' ? 'A fare waves you down: reach the drop-off for cash.' : 'Checkpoint run: reach the marker before the clock dies.';
}
function updateSide(state, dt) {
  const ms = state.mission;
  const s = ms.side;
  if (!s) { if (ms.finished && state.screen === 'playing' && state.rng.chance(0.0016)) startSideActivity(state); return; }
  s.time -= dt;
  if (s.time <= 0) { ms.side = null; ms.dialog = 'Side job expired.'; return; }
  const p = state.player;
  if (dist(p.x, p.y, s.x, s.y) < 52) {
    const pay = s.kind === 'taxi' ? 60 : 90;
    state.cash += pay; state.audio.cash();
    if (s.kind === 'taxi') state.taxiFares++; else state.trialsWon++;
    ms.dialog = (s.kind === 'taxi' ? 'Fare paid' : 'Checkpoint cleared') + ': +$' + pay + '.';
    ms.side = null;
    state.saveNow();
  }
}
export function objectiveText(state) {
  const m = currentMission(state);
  const ms = state.mission;
  if (m) {
    if (m.type === 'collect') return m.objective + ' (' + ms.collected + '/3)';
    if (m.type === 'stealDeliver' && ms.phase === 'toCar') return 'Steal the gold coupe near Vista Tower';
    return m.objective;
  }
  if (ms.side) return ms.side.kind === 'taxi' ? 'Taxi: reach the fare drop-off' : 'Time trial: reach the checkpoint';
  return 'Free roam - Port Solano is yours';
}
