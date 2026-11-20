// localStorage persistence for Neon Harbor: cash, finished missions and position.
// Loading is defensive: a missing or damaged record simply starts a fresh game.
import { SAVE_KEY } from './config.js';

export function defaultSave() {
  return { cash: 120, missionIndex: 0, missionsDone: 0, x: 340, y: 360, taxiFares: 0, trialsWon: 0 };
}
export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const base = defaultSave();
    for (const k of Object.keys(base)) {
      if (typeof data[k] === 'number' && Number.isFinite(data[k])) base[k] = data[k];
    }
    return base;
  } catch { return null; }
}
export function hasSave() {
  try { return window.localStorage.getItem(SAVE_KEY) !== null; } catch { return false; }
}
export function writeSave(state) {
  try {
    const rec = {
      cash: Math.round(state.cash), missionIndex: state.mission ? state.mission.index : state.missionIndex,
      missionsDone: state.missionsDone, x: Math.round(state.player.x),
      y: Math.round(state.player.y), taxiFares: state.taxiFares || 0,
      trialsWon: state.trialsWon || 0,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(rec));
    return true;
  } catch { return false; }
}
export function clearSave() {
  try { window.localStorage.removeItem(SAVE_KEY); } catch { /* storage unavailable */ }
}
