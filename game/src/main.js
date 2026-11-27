// main.js — boots Pardon Run and runs its frame loop.
// One job: own the state machine (title → running → caught/escaped),
// feed input and time into the world, and paint each frame.

import { VIEW_W, VIEW_H, GROUND_Y, GOAL_DISTANCE, PX_PER_METRE } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { World } from './world.js';
import { drawRun } from './render.js';
import { drawScenery } from './scenery.js';
import { drawTurkey, drawFarmer } from './art.js';
import { drawHUD, drawTitleScreen, drawEndScreen } from './hud.js';
import { readShotRequest } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sound = new SoundBank();
const shot = readShotRequest();

let screen = 'title';           // title | playing | over
let world = new World(7);
world.pose('farm');             // the title screen's backdrop chase

function startRun() {
  const seed = 1 + Math.floor(Math.random() * 99999);
  world = new World(shot ? shot.seed : seed);
  screen = 'playing';
  sound.wake();
  sound.startMusic();
}

function frame(nowMs) {
  const timeSec = nowMs / 1000;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  if (shot) {
    drawShotFrame();
  } else if (screen === 'title') {
    drawTitleFrame(timeSec);
    if (input.confirmPressed()) startRun();
  } else if (screen === 'playing') {
    stepWorld();
    drawRun(ctx, world, timeSec);
    drawHUD(ctx, world, sound.muted);
    if (world.state !== 'running') screen = 'over';
  } else {
    drawRun(ctx, world, timeSec);
    drawEndScreen(ctx, world, world.state === 'escaped', timeSec);
    if (input.confirmPressed()) startRun();
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

// Advance the simulation in small fixed steps so physics is stable
// whatever the display's refresh rate.
let lastStepMs = performance.now();
function stepWorld() {
  const now = performance.now();
  let elapsed = Math.min(0.1, (now - lastStepMs) / 1000);
  lastStepMs = now;
  while (elapsed > 0) {
    const dt = Math.min(elapsed, 1 / 120);
    world.update(dt, input, sound);
    elapsed -= dt;
    if (world.state !== 'running') break;
  }
}

// The title frame: a quiet farmyard backdrop, the words of the game, and
// the chase itself posed in the foreground at the bottom of the screen.
function drawTitleFrame(timeSec) {
  drawScenery(ctx, world.stage, world.scrollX, timeSec);
  drawTitleScreen(ctx, world, timeSec);
  drawFarmer(ctx, 96, GROUND_Y, { runPhase: timeSec * 10, holdingKnife: false });
  drawTurkey(ctx, 240, GROUND_Y, { runPhase: timeSec * 12 });
}

// Screenshot mode: pose one scene and hold it perfectly still.
function drawShotFrame() {
  const poseTime = 1.35;
  if (shot.shot === 'title') {
    if (!shot.posed) { world = new World(shot.seed); world.pose('farm'); shot.posed = true; }
    drawTitleFrame(poseTime);
  } else if (shot.shot === 'farm') {
    if (!shot.posed) { world = new World(shot.seed); world.pose('farm'); shot.posed = true; }
    drawRun(ctx, world, poseTime);
    drawHUD(ctx, world, false);
  } else if (shot.shot === 'kitchen') {
    if (!shot.posed) { world = new World(shot.seed); world.pose('kitchen'); shot.posed = true; }
    drawRun(ctx, world, poseTime);
    drawHUD(ctx, world, false);
  } else if (shot.shot === 'escaped') {
    if (!shot.posed) {
      world = new World(shot.seed);
      world.pose('farm');
      world.obstacles = [];
      world.pickups = [];
      world.scrollX = GOAL_DISTANCE * PX_PER_METRE - 1080;
      world.distance = Math.floor(world.scrollX / PX_PER_METRE);
      world.score = 12480;
      world.cornCount = 23;
      world.turkey.y = 26;               // a happy hop at the gate
      world.state = 'escaped';
      shot.posed = true;
    }
    drawRun(ctx, world, poseTime);
    drawEndScreen(ctx, world, true, poseTime);
  }
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM') sound.toggleMute();
  sound.wake();
});
canvas.addEventListener('pointerdown', () => sound.wake());

requestAnimationFrame(frame);
