# Pardon Run — One Turkey's Great Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/mamemushi-agent/make-fun-turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/mamemushi-agent/make-fun-turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

An original side-scrolling escape game for the make.fun competition
**"Make the best turkey escape game"** (`turkey-run-game-01`).

Thanksgiving is coming, and you are the turkey. The farmer has his
carving knife out and dinner on his mind — so run. Sprint 1,200 metres
across the farmyard, the cornfields and the kitchen yard to the Freedom
Forest gate: jump the hay bales, fences and ovens, duck the flying
carving knives (or be airborne as they pass), splash through mud that
slows you down, vanish into haystacks so the farmer loses your trail,
and grab corn and pumpkins on the way. You have three feathers; every
stumble costs one and lets the farmer close in. Reach the gate and the
verdict is the one every turkey dreams of: **PARDONED!**

## How to play

Open `game/index.html` in a desktop browser (everything is local; the
game makes no network requests), or run the entry and serve the output.

- **Jump:** Space / Arrow Up / W / click — press again in the air to
  double-jump
- **Duck:** Arrow Down / S (hold in the air to fall fast and tuck)
- **Dash:** Shift (burns the stamina that corn refills)
- **Start / restart:** Enter, Space or click · **Mute:** M

The HUD shows your score, corn count, feathers, the stage/distance
progress to the gate, dash stamina, and how close the farmer is. Four
stages — Sunnybrook Farmyard, Harvest Cornfields, The Kitchen Yard and
Freedom Forest — grow faster, tighter and more knife-happy as you go.
The track is generated from a seed, so every run lays out differently.

## Layout

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the
  output directory (`MAKEFUN_OUTPUT_DIR`, else `/output`) and writes
  `dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — the make.fun dossier library, kit copy.
- `game/index.html` — the game shell; `game/src/` holds the modules:
  `config.js` (tuning and the stage table), `random.js` (seeded
  generator), `input.js` (keyboard and pointer), `audio.js`
  (synthesised gobbles, squawks and music), `art.js` (the turkey, the
  farmer and every prop, drawn in code), `scenery.js` (parallax
  farmyard, fields and kitchen-yard backdrops), `world.js` (track
  generation, physics, the farmer chase and scoring), `render.js`
  (draws a run), `hud.js` (HUD, title and end screens), `shots.js`
  (deterministic screenshot poses via `?shot=title|farm|kitchen|escaped`)
  and `main.js` (state machine and game loop).
- `screenshots/` — real renders of the game in a headless browser:
  title, farmyard run, kitchen-yard run, and the pardoned end screen.

## Running the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22, standard library only; the run is deterministic.

## License

MIT — see `LICENSE`.
