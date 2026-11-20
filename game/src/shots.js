// Deterministic screenshot staging behind ?shot=start|city|chase|mission.
// Each scene arranges the real game state, steps the real update a few frames,
// renders once, then flags window.__shotReady so the capture tool can shoot it.
export function stageShot(state, name) {
  const p = state.player;
  state.audio.unlock = () => {};
  if (name === 'start') {
    state.screen = 'start';
    p.x = 740; p.y = 740;
    state.stepWorld(0.016);
    return true;
  }
  state.screen = 'playing';
  if (name === 'city') {
    p.x = 700; p.y = 640; p.angle = 0.4;
    state.mission.index = 0;
    state.stepWorld(0.016); state.stepWorld(0.016);
    return true;
  }
  if (name === 'chase') {
    const car = state.cars.find((c) => c.kind === 'parked') || state.cars[0];
    if (car) { car.x = 1120; car.y = 714; car.angle = 0; state.enterCarDirect(car); car.speed = 260; }
    state.police.setWanted(3);
    // Place two visible pursuers right behind the player.
    state.spawnCopAt(1010, 660); state.spawnCopAt(1000, 770);
    for (const cop of state.cops) { cop.angle = 0; cop.speed = 230; }
    state.mission.index = 1;
    state.mission.dialog = 'Marta: "That is the one. Garage, now - gently."';
    state.stepWorld(0.016); state.stepWorld(0.016);
    return true;
  }
  if (name === 'mission') {
    p.x = 1520; p.y = 1150; p.angle = -0.6;
    state.mission.index = 3;
    state.mission.collected = 1;
    state.mission.dialog = 'Case 2 of 3 is close. Keep moving, Reyes.';
    state.police.setWanted(2);
    state.spawnCopAt(1330, 1010);
    state.input.setMouse(900, 300, false);
    state.stepWorld(0.016); state.stepWorld(0.016);
    return true;
  }
  return false;
}
