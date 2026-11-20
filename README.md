# Neon Harbor

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/wildhanry/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/wildhanry/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Neon Harbor** is an original top-down open-world crime game set in the fictional sunset city of **Port Solano**. You play **Reyes**, a courier who owes the Copperline gang for a lost parcel and takes one last chain of five jobs to clear the debt: deliver a package to the pier, steal and deliver a gold coupe, run down the gang's fleeing runner, collect three scattered cases under police heat, and break away to the breakwater safehouse.

Everything in the game is original to this project — the city, people, cars, names, story, art and procedural sounds were all created for this entry. No assets from any commercial game are used.

## What is in the city

- A drivable, walkable city grid with named buildings, lit windows, palm trees, street lamps, a beach and the sea
- AI traffic that loops the road network and brakes for obstacles, plus pedestrians strolling the sidewalks
- Cars you can steal (walk up, press E) and drive, with a speedometer and damage smoke
- A 1–5 star wanted system: witnessed crimes raise heat, Port Solano PD cars chase you, and being pinned at low speed fills the bust meter
- Pistol combat with mouse aim, ammo and reload; pedestrians flee from gunfire
- Five chained story missions with world markers, dialogue and cash rewards, then free roam with taxi fares and checkpoint time trials
- A full HUD: cash, health, wanted stars, mission objective, dialogue strip and a live minimap
- Start screen with the story and controls, pause, help overlay, busted/wasted screens
- Automatic saving to localStorage (cash, mission progress, position), with continue and reset

## Run it

Hand the game in (copies `game/` and `screenshots/` and writes `dossier.json`):

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Play it locally:

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The game is plain static files under `game/` and makes no network requests while playing.

## Controls

- **WASD / Arrow keys** — walk or drive
- **E / F** — enter or leave a car
- **Mouse** — aim, **Click** — shoot, **R** — reload
- **Space** — handbrake, **Shift** — run
- **Esc / P** — pause, **H** — help
- On the start screen: **Enter / Click** — start or continue, **N** — new game, **X** — reset save

## Layout

- `main.ts` — the hand-in program (Node 22, standard library only)
- `game/` — the playable game: `index.html` plus one module per job under `game/src/` (city, vehicles, police, combat, missions, HUD/minimap, save, render, audio)
- `screenshots/` — real renders of the game taken from its deterministic screenshot scenes
- `vendor/makefun-game.ts` — the make.fun dossier library, unmodified

## Entered on make.fun

This game was built for the make.fun **gta6-01 "Make GTA 6"** competition: https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01

Try make.fun yourself: https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-01
