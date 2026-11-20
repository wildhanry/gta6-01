// Procedural WebAudio sounds for Neon Harbor: no audio files at all.
// Short oscillator and noise blips stand in for shots, pickups, sirens and UI.
export function createAudio() {
  let ctx = null;
  let engineOsc = null; let engineGain = null;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch { ctx = null; }
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, vol) {
    const c = ensure(); if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol || 0.12;
    src.connect(g); g.connect(c.destination); src.start();
  }
  return {
    unlock() { ensure(); },
    click() { tone(660, 0.06, 'square', 0.05); },
    shoot() { noise(0.09, 0.16); tone(180, 0.07, 'sawtooth', 0.06, 60); },
    reload() { tone(320, 0.05, 'square', 0.06); setTimeout(() => tone(440, 0.05, 'square', 0.06), 90); },
    pickup() { tone(523, 0.08, 'sine', 0.09); setTimeout(() => tone(784, 0.12, 'sine', 0.09), 70); },
    cash() { tone(880, 0.07, 'triangle', 0.1); setTimeout(() => tone(1174, 0.1, 'triangle', 0.1), 60); },
    crash() { noise(0.22, 0.2); tone(90, 0.2, 'sawtooth', 0.08, 40); },
    siren() { tone(720, 0.16, 'triangle', 0.045, 980); },
    busted() { tone(392, 0.16, 'square', 0.08); setTimeout(() => tone(262, 0.3, 'square', 0.08), 150); },
    wasted() { tone(220, 0.5, 'sawtooth', 0.08, 55); },
    missionDone() { tone(523, 0.1, 'triangle', 0.1); setTimeout(() => tone(659, 0.1, 'triangle', 0.1), 100); setTimeout(() => tone(784, 0.18, 'triangle', 0.1), 200); },
    setEngine(on, speedRatio) {
      const c = ensure(); if (!c) return;
      if (on && !engineOsc) {
        engineOsc = c.createOscillator(); engineGain = c.createGain();
        engineOsc.type = 'sawtooth'; engineGain.gain.value = 0.02;
        engineOsc.connect(engineGain); engineGain.connect(c.destination); engineOsc.start();
      }
      if (engineOsc) {
        engineOsc.frequency.value = 55 + Math.abs(speedRatio || 0) * 130;
        if (!on) { try { engineOsc.stop(); } catch { /* already stopped */ } engineOsc = null; engineGain = null; }
      }
    },
  };
}
