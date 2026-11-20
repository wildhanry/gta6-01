// Canvas rendering for Neon Harbor: sunset city, lit windows, palms, cars,
// people, particles, then the HUD and the full-screen states on top.
import { AVENUES_X, BEACH_X, COLORS, ROAD_W, STREETS_Y, VIEW_H, VIEW_W, WATER_X, WORLD_H, WORLD_W } from './config.js';
import { drawHud } from './hud.js';
import { STORY_INTRO, missionMarker } from './missions.js';
import { clamp } from './rng.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W; canvas.height = VIEW_H;
  function draw(state) {
    ctx.fillStyle = COLORS.night;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (state.screen === 'start') { drawWorld(ctx, state); drawStart(ctx, state); return; }
    drawWorld(ctx, state);
    drawHud(ctx, state);
    if (state.screen === 'paused') drawPanel(ctx, 'PAUSED', 'Esc or P to resume - H for help');
    if (state.showHelp) drawHelp(ctx);
    if (state.screen === 'busted') drawPanel(ctx, 'BUSTED', 'The Solano PD took $' + (state.lastFine || 0) + '. Press Enter to walk free.');
    if (state.screen === 'wasted') drawPanel(ctx, 'WASTED', 'Reyes wakes at Harbor Clinic, $80 lighter. Press Enter.');
    if (state.screen === 'help') drawHelp(ctx);
  }
  return { draw, ctx };
}

function drawWorld(ctx, state) {
  const cam = state.camera;
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  // Ground: grass blocks, sand, sea.
  ctx.fillStyle = COLORS.grass; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = COLORS.sand; ctx.fillRect(BEACH_X, 0, WATER_X - BEACH_X, WORLD_H);
  const grad = ctx.createLinearGradient(WATER_X, 0, WORLD_W, 0);
  grad.addColorStop(0, COLORS.water); grad.addColorStop(1, COLORS.waterDeep);
  ctx.fillStyle = grad; ctx.fillRect(WATER_X, 0, WORLD_W - WATER_X, WORLD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
  for (let y = 60; y < WORLD_H; y += 90) {
    ctx.beginPath();
    ctx.moveTo(WATER_X + 14 + Math.sin(state.time + y) * 6, y);
    ctx.lineTo(WORLD_W - 30, y + 12);
    ctx.stroke();
  }
  // Sidewalks then roads.
  ctx.fillStyle = COLORS.sidewalk;
  for (const ax of AVENUES_X) ctx.fillRect(ax - ROAD_W / 2 - 12, 0, ROAD_W + 24, WORLD_H);
  for (const sy of STREETS_Y) ctx.fillRect(0, sy - ROAD_W / 2 - 12, BEACH_X, ROAD_W + 24);
  ctx.fillStyle = COLORS.road;
  for (const ax of AVENUES_X) ctx.fillRect(ax - ROAD_W / 2, 0, ROAD_W, WORLD_H);
  for (const sy of STREETS_Y) ctx.fillRect(0, sy - ROAD_W / 2, BEACH_X, ROAD_W);
  ctx.strokeStyle = COLORS.lane; ctx.lineWidth = 3; ctx.setLineDash([26, 22]);
  for (const ax of AVENUES_X) { ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, WORLD_H); ctx.stroke(); }
  for (const sy of STREETS_Y) { ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(BEACH_X, sy); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.strokeStyle = COLORS.roadEdge; ctx.lineWidth = 2;
  for (const ax of AVENUES_X) { ctx.strokeRect(ax - ROAD_W / 2, -4, ROAD_W, WORLD_H + 8); }
  // Buildings with lit windows and name signs.
  ctx.font = '11px system-ui, sans-serif';
  for (const b of state.city.buildings) {
    if (!visible(cam, b.x, b.y, b.w, b.h)) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
    ctx.fillStyle = b.hue; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = COLORS.neonPink; ctx.globalAlpha = 0.5; ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.globalAlpha = 1;
    drawWindows(ctx, b, state.time);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(b.name, b.x + 8, b.y + 16);
  }
  // Palms and lamps.
  for (const palm of state.city.palms) {
    if (!visible(cam, palm.x - 16, palm.y - 16, 32, 32)) continue;
    ctx.strokeStyle = '#6a4a2f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(palm.x, palm.y); ctx.lineTo(palm.x + 3, palm.y - 12); ctx.stroke();
    ctx.strokeStyle = '#2fa36b'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      ctx.beginPath(); ctx.moveTo(palm.x + 3, palm.y - 12);
      ctx.lineTo(palm.x + 3 + Math.cos(a) * 15, palm.y - 12 + Math.sin(a) * 8 - 3); ctx.stroke();
    }
  }
  ctx.fillStyle = COLORS.neonGold;
  for (const lamp of state.city.lamps) {
    if (!visible(cam, lamp.x - 8, lamp.y - 8, 16, 16)) continue;
    ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Mission marker beam.
  const marker = missionMarker(state);
  if (marker && state.screen !== 'start') {
    const pulse = 14 + Math.sin(state.time * 4) * 4;
    ctx.fillStyle = 'rgba(255,209,102,0.2)';
    ctx.fillRect(marker.x - 10, marker.y - 320, 20, 320);
    ctx.strokeStyle = COLORS.neonGold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(marker.x, marker.y, pulse + 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COLORS.neonGold; ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(marker.label, marker.x - 24, marker.y - 26);
  }
  // Cars, people, bullets, particles.
  for (const car of state.cars) drawCar(ctx, car, state);
  for (const ped of state.peds) drawPed(ctx, ped);
  if (!state.player.inCar && state.player.alive) drawPlayer(ctx, state);
  ctx.fillStyle = '#ffe66d';
  for (const b of state.bullets) ctx.fillRect(b.x - 3, b.y - 1.5, 6, 3);
  for (const f of state.fx) {
    if (f.kind === 'smoke') { ctx.fillStyle = 'rgba(160,160,175,0.5)'; ctx.beginPath(); ctx.arc(f.x, f.y - (0.5 - f.life) * 22, f.size, 0, Math.PI * 2); ctx.fill(); }
    else if (f.kind === 'muzzle') { ctx.fillStyle = 'rgba(255,180,60,0.9)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.size * f.life * 8, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(255,220,120,0.85)'; ctx.fillRect(f.x - f.size / 2, f.y - 2, f.size, 4); }
  }
  ctx.restore();
  // Sunset vignette.
  const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 320, VIEW_W / 2, VIEW_H / 2, 820);
  vg.addColorStop(0, 'rgba(255,120,80,0)');
  vg.addColorStop(1, 'rgba(30,8,50,0.42)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
function visible(cam, x, y, w, h) {
  return x + w > cam.x - 40 && y + h > cam.y - 40 && x < cam.x + VIEW_W + 40 && y < cam.y + VIEW_H + 40;
}
function drawWindows(ctx, b, time) {
  const cols = Math.max(2, Math.floor(b.w / 26));
  const rows = Math.max(2, Math.floor(b.h / 24));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = Math.sin(b.litSeed + r * 37.7 + c * 91.3) * 43758.5;
      const lit = (n - Math.floor(n)) > 0.42;
      ctx.fillStyle = lit ? 'rgba(255,209,102,0.92)' : 'rgba(20,16,40,0.85)';
      ctx.fillRect(b.x + 10 + c * 24, b.y + 24 + r * 22, 13, 12);
    }
  }
  void time;
}
function drawCar(ctx, car, state) {
  ctx.save();
  ctx.translate(car.x, car.y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-car.w / 2 + 3, -car.h / 2 + 5, car.w, car.h);
  ctx.fillStyle = car.color; ctx.fillRect(-car.w / 2, -car.h / 2, car.w, car.h);
  ctx.fillStyle = 'rgba(15,20,40,0.9)'; ctx.fillRect(-8, -car.h / 2 + 3, 17, car.h - 6);
  ctx.fillStyle = 'rgba(180,230,255,0.85)'; ctx.fillRect(11, -car.h / 2 + 3, 7, car.h - 6);
  ctx.fillStyle = '#111'; ctx.fillRect(-car.w / 2 + 3, -car.h / 2 - 2, 10, 5); ctx.fillRect(-car.w / 2 + 3, car.h / 2 - 3, 10, 5);
  ctx.fillRect(car.w / 2 - 13, -car.h / 2 - 2, 10, 5); ctx.fillRect(car.w / 2 - 13, car.h / 2 - 3, 10, 5);
  if (car.kind === 'cop') {
    ctx.fillStyle = '#12235e'; ctx.fillRect(-car.w / 2, -car.h / 2, car.w, 6);
    ctx.fillStyle = '#12235e'; ctx.fillRect(-car.w / 2, car.h / 2 - 6, car.w, 6);
    const flash = Math.floor(state.time * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ff3b30' : '#3a86ff';
    ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillText('PD', -6, 3);
  }
  if (car.health < 45) { ctx.fillStyle = 'rgba(120,120,130,0.55)'; ctx.beginPath(); ctx.arc(6, 0, 10 + Math.sin(state.time * 9) * 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function drawPed(ctx, ped) {
  ctx.save(); ctx.translate(ped.x, ped.y);
  if (ped.down) {
    ctx.fillStyle = ped.color; ctx.fillRect(-11, -4, 22, 8);
    ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.arc(13, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); return;
  }
  const bob = Math.sin(ped.walkPhase) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(0, 3, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ped.color; ctx.fillRect(-5, -5 + bob * 0.3, 10, 11);
  ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.arc(0, -9 + bob * 0.3, 5.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawPlayer(ctx, state) {
  const p = state.player;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(0, 4, 10, 0, Math.PI * 2); ctx.fill();
  const bob = Math.sin(p.walkPhase) * 2;
  ctx.fillStyle = COLORS.player; ctx.fillRect(-6, -6 + bob * 0.3, 12, 13);
  ctx.fillStyle = '#8a4b2a'; ctx.beginPath(); ctx.arc(0, -10 + bob * 0.3, 6, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(p.angle);
  ctx.fillStyle = '#22242e'; ctx.fillRect(8, -2, 13, 4);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('REYES', p.x - 16, p.y - 22);
}
function drawPanel(ctx, title, sub) {
  ctx.fillStyle = 'rgba(8,6,20,0.72)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = title === 'WASTED' ? '#ef476f' : COLORS.neonGold;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 20);
  ctx.fillStyle = '#fff'; ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(sub, VIEW_W / 2, VIEW_H / 2 + 26);
  ctx.textAlign = 'left';
}
function drawStart(ctx, state) {
  ctx.fillStyle = 'rgba(16,8,34,0.55)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.neonPink; ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.fillText('NEON HARBOR', VIEW_W / 2, 150);
  ctx.fillStyle = COLORS.neonCyan; ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('An original open-world caper in Port Solano', VIEW_W / 2, 188);
  ctx.fillStyle = '#ffe8f3'; ctx.font = '16px system-ui, sans-serif';
  wrapText(ctx, STORY_INTRO, VIEW_W / 2, 232, 760, 22);
  ctx.fillStyle = 'rgba(10,8,24,0.8)'; ctx.fillRect(VIEW_W / 2 - 330, 320, 660, 168);
  ctx.fillStyle = '#fff'; ctx.font = '15px system-ui, sans-serif';
  const lines = [
    'WASD / Arrows - walk or drive      E / F - enter or leave a car',
    'Mouse - aim, Click - shoot         R - reload    Space - handbrake',
    'Shift - run    Esc / P - pause     H - help',
    'Steal cars, finish 5 story jobs, dodge the Solano PD.',
    'Progress saves automatically on this device.',
  ];
  lines.forEach((ln, i) => ctx.fillText(ln, VIEW_W / 2, 352 + i * 26));
  ctx.fillStyle = COLORS.neonGold; ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(state.hasSaveData ? 'CLICK or ENTER - Continue      N - New Game' : 'CLICK or ENTER - Start', VIEW_W / 2, 548);
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('All people, places and cars are fictional and original to this game.', VIEW_W / 2, 586);
  ctx.textAlign = 'left';
}
function drawHelp(ctx) {
  ctx.fillStyle = 'rgba(8,6,20,0.86)'; ctx.fillRect(180, 90, VIEW_W - 360, VIEW_H - 180);
  ctx.strokeStyle = COLORS.neonCyan; ctx.strokeRect(180, 90, VIEW_W - 360, VIEW_H - 180);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('HELP - PORT SOLANO SURVIVAL', 220, 140);
  ctx.font = '16px system-ui, sans-serif';
  const lines = [
    'Walk: WASD or arrow keys. Hold Shift to run.',
    'Cars: walk up to any car and press E to get in (stealing raises heat).',
    'Drive: W accelerate, S brake/reverse, A/D steer, Space handbrake.',
    'Combat: aim with the mouse, click to shoot, R reloads the pistol.',
    'Wanted: stars fill as crimes are witnessed. Break away to cool down.',
    'Busted: if police pin you at low speed the meter fills - keep moving!',
    'Missions: follow the gold marker and the minimap blip.',
    'Save: cash, mission progress and position save automatically.',
    'Reset save: press X on the start screen.',
  ];
  lines.forEach((ln, i) => ctx.fillText(ln, 220, 186 + i * 34));
  ctx.fillStyle = COLORS.neonGold;
  ctx.fillText('Press H or Esc to close.', 220, 186 + lines.length * 34 + 16);
}
function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = ''; let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, cx, yy); line = word; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
}
export function clampCamera(state) {
  const p = state.player;
  state.camera.x = clamp(p.x - VIEW_W / 2, 0, Math.max(0, WORLD_W - VIEW_W));
  state.camera.y = clamp(p.y - VIEW_H / 2, 0, Math.max(0, WORLD_H - VIEW_H));
}
