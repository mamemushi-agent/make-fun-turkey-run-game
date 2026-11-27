// render.js — one frame of the run, painted in layers.
// One job: turn the world state into pixels — scenery, props, pickups,
// the farmer, the turkey, and the little bursts of feathers and dust.

import { GROUND_Y, TURKEY_X } from './config.js';
import { drawScenery } from './scenery.js';
import {
  drawTurkey, drawFarmer, drawHayBale, drawFence, drawOven, drawMudPuddle,
  drawHaystack, drawCorn, drawPumpkinPickup, drawFlyingKnife, drawFreedomGate,
} from './art.js';
import { GOAL_DISTANCE, PX_PER_METRE } from './config.js';

function drawObstacle(ctx, o, screenX) {
  switch (o.kind) {
    case 'bale': drawHayBale(ctx, screenX, GROUND_Y, o.w, o.h); break;
    case 'fence': drawFence(ctx, screenX, GROUND_Y, o.w, o.h); break;
    case 'oven': drawOven(ctx, screenX, GROUND_Y, o.w, o.h); break;
    case 'mud': drawMudPuddle(ctx, screenX, GROUND_Y + 8, o.w); break;
    case 'haystack': drawHaystack(ctx, screenX, GROUND_Y, o.w, o.h); break;
    case 'knife': drawFlyingKnife(ctx, screenX + o.w / 2, GROUND_Y - 79, o.spin || 0); break;
  }
}

export function drawRun(ctx, world, timeSec) {
  const camX = world.scrollX;
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }

  drawScenery(ctx, world.stage, camX, timeSec);

  // The forest gate appears as the finish approaches.
  const gateX = GOAL_DISTANCE * PX_PER_METRE - camX;
  if (gateX > -260 && gateX < 1500) drawFreedomGate(ctx, gateX, GROUND_Y);

  for (const o of world.obstacles) {
    const sx = o.x - camX;
    if (sx < -240 || sx > 1420) continue;
    drawObstacle(ctx, o, sx);
  }
  for (const p of world.pickups) {
    if (p.taken) continue;
    const sx = p.x - camX;
    if (sx < -60 || sx > 1340) continue;
    const bob = Math.sin(timeSec * 3 + p.bob) * 5;
    if (p.kind === 'corn') drawCorn(ctx, sx, GROUND_Y - p.lift, bob);
    else drawPumpkinPickup(ctx, sx, GROUND_Y - p.lift, bob);
  }

  // The farmer, closing in from the left.
  const farmerX = TURKEY_X - world.gap;
  const close = world.gap < 240;
  if (farmerX > -140) {
    drawFarmer(ctx, farmerX, GROUND_Y, {
      runPhase: world.farmerPhase,
      angry: close,
      holdingKnife: world.stage.knifeEvery > 0,
    });
    if (close) {
      ctx.fillStyle = '#d23b2e';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', farmerX + 4, GROUND_Y - 196 - Math.abs(Math.sin(timeSec * 6)) * 8);
    }
  }

  // The turkey, blinking while untouchable after a stumble.
  const t = world.turkey;
  const blink = t.invulnTimer > 0 && Math.floor(timeSec * 14) % 2 === 0;
  if (!blink) {
    drawTurkey(ctx, TURKEY_X, GROUND_Y - t.y, {
      runPhase: world.runPhase,
      ducking: t.ducking && t.y === 0,
      airborne: t.y > 0,
      hurt: t.hurtTimer > 0,
      hidden: t.hiddenTimer > 0,
      flap: t.y > 0 ? 0.8 : 0,
      alarm: close,
    });
  }

  // Particles (feathers, dust, sparkles) and floating score notes.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - camX, GROUND_Y - p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const note of world.texts) {
    ctx.globalAlpha = Math.min(1, note.life * 1.6);
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillStyle = note.color;
    ctx.strokeStyle = 'rgba(60,30,5,.8)';
    ctx.lineWidth = 4;
    const sx = note.x - camX;
    ctx.strokeText(note.text, sx, GROUND_Y - note.y);
    ctx.fillText(note.text, sx, GROUND_Y - note.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
