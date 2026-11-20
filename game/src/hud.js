// Heads-up display for Neon Harbor: cash, health, wanted stars, mission banner,
// speedometer, dialogue strip, bust meter and the minimap in the corner.
import { AVENUES_X, BEACH_X, COLORS, STREETS_Y, VIEW_H, VIEW_W, WORLD_H, WORLD_W } from './config.js';
import { currentMission, missionMarker, objectiveText } from './missions.js';
import { clamp } from './rng.js';

export function drawMinimap(ctx, state, mx, my, size) {
  const s = size / WORLD_W;
  ctx.save();
  ctx.fillStyle = '#14102a';
  ctx.fillRect(mx, my, size, size * (WORLD_H / WORLD_W));
  const mh = size * (WORLD_H / WORLD_W);
  ctx.fillStyle = '#1d6f8e';
  ctx.fillRect(mx + BEACH_X * s, my, (WORLD_W - BEACH_X) * s, mh);
  ctx.fillStyle = '#2e6e5e';
  ctx.fillRect(mx, my, BEACH_X * s, mh);
  ctx.strokeStyle = '#55506e'; ctx.lineWidth = 3;
  for (const ax of AVENUES_X) { ctx.beginPath(); ctx.moveTo(mx + ax * s, my); ctx.lineTo(mx + ax * s, my + mh); ctx.stroke(); }
  for (const sy of STREETS_Y) { ctx.beginPath(); ctx.moveTo(mx, my + sy * s); ctx.lineTo(mx + BEACH_X * s, my + sy * s); ctx.stroke(); }
  ctx.fillStyle = 'rgba(90,80,120,0.8)';
  for (const b of state.city.buildings) ctx.fillRect(mx + b.x * s, my + b.y * s, Math.max(2, b.w * s), Math.max(2, b.h * s));
  const dot = (x, y, color, r) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mx + x * s, my + y * s, r, 0, Math.PI * 2); ctx.fill(); };
  for (const car of state.cars) if (car.kind === 'traffic') dot(car.x, car.y, '#cfd3dc', 2);
  for (const cop of state.cops) dot(cop.x, cop.y, '#3a86ff', 3.4);
  const marker = missionMarker(state);
  if (marker) {
    const pulse = 3.4 + Math.sin(state.time * 5) * 1.2;
    dot(marker.x, marker.y, COLORS.neonGold, pulse + 1.6);
  }
  const p = state.player;
  ctx.save();
  ctx.translate(mx + p.x * s, my + p.y * s);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -3.6); ctx.lineTo(-4, 3.6); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, size, mh);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('PORT SOLANO', mx + 5, my + 12);
  ctx.restore();
}

export function drawHud(ctx, state) {
  const p = state.player;
  // Cash and health, top left.
  ctx.fillStyle = 'rgba(10,8,24,0.62)';
  ctx.fillRect(14, 12, 252, 64);
  ctx.fillStyle = COLORS.neonGold;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('$' + Math.floor(state.cash), 24, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px system-ui, sans-serif';
  const m = currentMission(state);
  ctx.fillText(m ? m.title : 'Free Roam', 24, 60);
  // Health bar.
  ctx.fillStyle = '#3a1030'; ctx.fillRect(120, 24, 132, 13);
  ctx.fillStyle = p.health > 30 ? '#06d6a0' : '#ef476f';
  ctx.fillRect(120, 24, 132 * clamp(p.health / 100, 0, 1), 13);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('HEALTH', 120, 52);
  // Ammo, bottom left.
  ctx.fillStyle = 'rgba(10,8,24,0.62)';
  ctx.fillRect(14, VIEW_H - 52, 168, 38);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 17px system-ui, sans-serif';
  const w = state.weapon;
  ctx.fillText(w.reloading > 0 ? 'RELOADING' : 'PISTOL ' + w.ammo + ' / ' + w.reserve, 24, VIEW_H - 27);
  // Wanted stars, top right above minimap.
  const wanted = state.police.wanted;
  ctx.font = '26px system-ui, sans-serif';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < wanted ? COLORS.neonGold : 'rgba(255,255,255,0.22)';
    ctx.fillText('★', VIEW_W - 268 + i * 30, 38);
  }
  if (state.police.bust > 0.02) {
    ctx.fillStyle = 'rgba(10,8,24,0.62)'; ctx.fillRect(VIEW_W - 268, 46, 140, 12);
    ctx.fillStyle = '#ef476f'; ctx.fillRect(VIEW_W - 268, 46, 140 * clamp(state.police.bust, 0, 1), 12);
    ctx.fillStyle = '#fff'; ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('BUSTED METER', VIEW_W - 268, 70);
  }
  drawMinimap(ctx, state, VIEW_W - 196, 52, 182);
  // Objective strip, top centre.
  ctx.fillStyle = 'rgba(10,8,24,0.66)';
  const obj = objectiveText(state);
  ctx.font = 'bold 15px system-ui, sans-serif';
  const tw = ctx.measureText(obj).width;
  ctx.fillRect((VIEW_W - tw) / 2 - 14, 12, tw + 28, 30);
  ctx.fillStyle = COLORS.neonCyan;
  ctx.fillText(obj, (VIEW_W - tw) / 2, 33);
  // Mission banner.
  if (state.mission.bannerTimer > 0 && state.mission.banner) {
    ctx.font = 'bold 30px system-ui, sans-serif';
    const bw = ctx.measureText(state.mission.banner).width;
    ctx.fillStyle = 'rgba(10,8,24,0.7)';
    ctx.fillRect((VIEW_W - bw) / 2 - 20, 120, bw + 40, 48);
    ctx.fillStyle = COLORS.neonGold;
    ctx.fillText(state.mission.banner, (VIEW_W - bw) / 2, 154);
  }
  // Dialogue strip, bottom centre.
  if (state.mission.dialog) {
    ctx.font = '14px system-ui, sans-serif';
    const dw = Math.min(760, ctx.measureText(state.mission.dialog).width + 28);
    ctx.fillStyle = 'rgba(10,8,24,0.72)';
    ctx.fillRect((VIEW_W - dw) / 2, VIEW_H - 96, dw, 30);
    ctx.fillStyle = '#ffe8f3';
    ctx.fillText(state.mission.dialog, (VIEW_W - dw) / 2 + 14, VIEW_H - 76);
  }
  // Speedometer while driving.
  if (p.inCar) {
    const kmh = Math.round(Math.abs(p.inCar.speed) * 0.36);
    ctx.fillStyle = 'rgba(10,8,24,0.62)';
    ctx.fillRect(VIEW_W - 196, VIEW_H - 96, 182, 56);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(kmh + '', VIEW_W - 150, VIEW_H - 60);
    ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('km/h', VIEW_W - 96, VIEW_H - 60);
    ctx.fillStyle = p.inCar.health > 40 ? '#06d6a0' : '#ef476f';
    ctx.fillRect(VIEW_W - 186, VIEW_H - 52, 162 * clamp(p.inCar.health / 100, 0, 1), 5);
  }
  // Context prompt.
  if (state.prompt) {
    ctx.font = 'bold 16px system-ui, sans-serif';
    const pw = ctx.measureText(state.prompt).width;
    ctx.fillStyle = 'rgba(10,8,24,0.75)';
    ctx.fillRect((VIEW_W - pw) / 2 - 12, VIEW_H - 150, pw + 24, 30);
    ctx.fillStyle = COLORS.neonGold;
    ctx.fillText(state.prompt, (VIEW_W - pw) / 2, VIEW_H - 129);
  }
}
