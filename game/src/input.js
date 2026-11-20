// Keyboard and mouse capture for Neon Harbor.
// Held keys live in a set; one-shot actions are queued as flags the loop drains
// once, so a tap between frames is never lost and never fires twice.
export const ACT_ENTER = 1;
export const ACT_PAUSE = 2;
export const ACT_RELOAD = 4;
export const ACT_HELP = 8;
export const ACT_CONFIRM = 16;

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let mouseX = 0; let mouseY = 0; let mouseDown = false;
  const codeOf = (e) => e.code;
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    held.add(codeOf(e));
    if (e.code === 'KeyE' || e.code === 'KeyF') actions |= ACT_ENTER;
    if (e.code === 'Escape' || e.code === 'KeyP') actions |= ACT_PAUSE;
    if (e.code === 'KeyR') actions |= ACT_RELOAD;
    if (e.code === 'KeyH') actions |= ACT_HELP;
    if (e.code === 'Enter' || e.code === 'Space') actions |= ACT_CONFIRM;
  });
  window.addEventListener('keyup', (e) => { held.delete(codeOf(e)); });
  window.addEventListener('blur', () => { held.clear(); mouseDown = false; });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = (e.clientX - r.left) * (canvas.width / r.width);
    mouseY = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown = false; });
  canvas.addEventListener('click', () => { actions |= ACT_CONFIRM; });
  return {
    held,
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get mouseDown() { return mouseDown; },
    setMouse(x, y, down) { mouseX = x; mouseY = y; mouseDown = !!down; },
    down(...codes) { return codes.some((c) => held.has(c)); },
    axisX() { return (this.down('KeyD', 'ArrowRight') ? 1 : 0) - (this.down('KeyA', 'ArrowLeft') ? 1 : 0); },
    axisY() { return (this.down('KeyS', 'ArrowDown') ? 1 : 0) - (this.down('KeyW', 'ArrowUp') ? 1 : 0); },
    takeActions() { const a = actions; actions = 0; return a; },
    press(code) { held.add(code); },
    release(code) { held.delete(code); },
  };
}
