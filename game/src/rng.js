// Small deterministic random helpers so seeded screenshot scenes always match.
// A mulberry-style generator: fast, tiny, and good enough for city dressing.
export function createRng(seed) {
  let state = (seed >>> 0) || 2654435769;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range(lo, hi) { return lo + next() * (hi - lo); },
    int(lo, hi) { return Math.floor(lo + next() * (hi - lo + 1)); },
    pick(list) { return list[Math.floor(next() * list.length) % list.length]; },
    chance(p) { return next() < p; },
  };
}
export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist(ax, ay, bx, by) { const dx = ax - bx; const dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
