// hud.js — everything drawn over the run: the HUD, the title screen and
// the two end screens. One job: tell the player the score, the distance,
// the feathers left and how close the farmer is — at a glance.

import { VIEW_W, GOAL_DISTANCE, STAGES } from './config.js';
import { roundedRect } from './art.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(43,24,8,.72)';
  roundedRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,227,170,.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function featherIcon(ctx, x, y, lost) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.5);
  ctx.fillStyle = lost ? 'rgba(120,110,100,.5)' : '#e09a3a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = lost ? 'rgba(90,80,70,.5)' : '#a34d1f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, -14);
  ctx.stroke();
  ctx.restore();
}

// The in-run overlay: score, distance-to-freedom bar, feathers, corn,
// stamina and the farmer meter.
export function drawHUD(ctx, world, muted) {
  panel(ctx, 18, 16, 300, 64);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${Math.floor(world.score)}`, 36, 58);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#f7e8c8';
  ctx.fillText(`🌽 ${world.cornCount}`, 232, 58);

  // Feathers = lives.
  panel(ctx, 332, 16, 132, 64);
  for (let i = 0; i < 3; i++) {
    featherIcon(ctx, 366 + i * 38, 48, i >= world.feathers);
  }

  // Distance to freedom, with stage ticks.
  panel(ctx, 478, 16, 560, 64);
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillStyle = '#f7e8c8';
  ctx.textAlign = 'center';
  ctx.fillText(`${world.stage.name} — ${Math.floor(world.distance)}m / ${GOAL_DISTANCE}m`, 758, 40);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  roundedRect(ctx, 496, 50, 524, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#8fc45a';
  roundedRect(ctx, 496, 50, Math.max(14, 524 * Math.min(1, world.distance / GOAL_DISTANCE)), 14, 7);
  ctx.fill();
  ctx.fillStyle = '#f7e8c8';
  for (const s of STAGES) {
    if (s.until === Infinity) continue;
    const tx = 496 + 524 * (s.until / GOAL_DISTANCE);
    ctx.fillRect(tx - 1, 47, 2, 20);
  }

  // Corn-power stamina for dashing.
  panel(ctx, 1052, 16, 210, 64);
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = '#f7e8c8';
  ctx.textAlign = 'left';
  ctx.fillText('DASH ➤', 1066, 40);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  roundedRect(ctx, 1066, 48, 182, 13, 6);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  roundedRect(ctx, 1066, 48, Math.max(0, 182 * world.stamina / 100), 13, 6);
  ctx.fill();

  // Farmer proximity: the bar that makes hearts pound.
  const danger = 1 - Math.min(1, Math.max(0, (world.gap - 64) / 500));
  panel(ctx, 18, 92, 300, 40);
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = danger > 0.66 ? '#ff9a8a' : '#f7e8c8';
  ctx.fillText('🧑‍🌾 FARMER', 32, 118);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  roundedRect(ctx, 128, 104, 172, 14, 7);
  ctx.fill();
  ctx.fillStyle = danger > 0.66 ? '#d23b2e' : danger > 0.35 ? '#e07b24' : '#8fc45a';
  roundedRect(ctx, 128, 104, 172 * danger, 14, 7);
  ctx.fill();

  if (muted) {
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = 'rgba(255,240,210,.75)';
    ctx.textAlign = 'right';
    ctx.fillText('M — sound off', VIEW_W - 20, 122);
  }

  // Stage banner.
  if (world.bannerTimer > 0) {
    ctx.globalAlpha = Math.min(1, world.bannerTimer);
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3d6';
    ctx.strokeStyle = 'rgba(60,30,5,.85)';
    ctx.lineWidth = 7;
    const label = world.bannerText || world.stage.name;
    ctx.strokeText(label, VIEW_W / 2, 168);
    ctx.fillText(label, VIEW_W / 2, 168);
    ctx.globalAlpha = 1;
  }
}

function bigTitle(ctx, lines, y, size = 74) {
  ctx.textAlign = 'center';
  lines.forEach(([text, color], i) => {
    ctx.font = `bold ${size}px Georgia, serif`;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(60,30,5,.9)';
    ctx.lineWidth = 9;
    const yy = y + i * (size + 12);
    ctx.strokeText(text, VIEW_W / 2, yy);
    ctx.fillText(text, VIEW_W / 2, yy);
  });
}

// The title screen: the chase posed behind the name of the game.
export function drawTitleScreen(ctx, world, timeSec) {
  ctx.fillStyle = 'rgba(43,24,8,.38)';
  ctx.fillRect(0, 0, VIEW_W, 720);
  bigTitle(ctx, [['PARDON RUN', '#ffd98a'], ["One Turkey's Great Escape", '#f7e8c8']], 148, 72);
  ctx.font = '23px Georgia, serif';
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'center';
  ctx.fillText('Thanksgiving is coming — and you are NOT on the menu.', VIEW_W / 2, 316);
  ctx.fillText('Outrun the farmer for 1,200 metres to reach the forest gate and earn your pardon!', VIEW_W / 2, 350);

  panel(ctx, 340, 386, 600, 148);
  ctx.font = '21px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('SPACE / ↑ / CLICK — jump (twice for a double jump)', VIEW_W / 2, 424);
  ctx.fillText('↓ — duck the flying carving knives', VIEW_W / 2, 460);
  ctx.fillText('➤ / SHIFT — dash on corn power · hide in haystacks', VIEW_W / 2, 496);

  const pulse = 0.75 + Math.sin(timeSec * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillStyle = '#ffd98a';
  ctx.fillText('Press SPACE or click to run!', VIEW_W / 2, 592);
  ctx.globalAlpha = 1;
}

// End screens: the pardon, or the pot.
export function drawEndScreen(ctx, world, escaped, timeSec) {
  ctx.fillStyle = escaped ? 'rgba(30,50,16,.45)' : 'rgba(60,16,8,.5)';
  ctx.fillRect(0, 0, VIEW_W, 720);
  if (escaped) {
    bigTitle(ctx, [['PARDONED!', '#b7e39a'], ['You outran Thanksgiving.', '#f7e8c8']], 150, 76);
  } else {
    bigTitle(ctx, [['CAUGHT!', '#ff9a8a'], ['The farmer finally got his dinner…', '#f7e8c8']], 150, 76);
  }
  panel(ctx, 415, 330, 450, 168);
  ctx.font = '24px Georgia, serif';
  ctx.fillStyle = '#f7e8c8';
  ctx.textAlign = 'center';
  ctx.fillText(`Final score  ${Math.floor(world.score)}`, VIEW_W / 2, 380);
  ctx.fillText(`Distance  ${Math.floor(world.distance)} m of ${GOAL_DISTANCE} m`, VIEW_W / 2, 422);
  ctx.fillText(`Corn gathered  ${world.cornCount} 🌽`, VIEW_W / 2, 464);

  const pulse = 0.75 + Math.sin(timeSec * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillStyle = '#ffd98a';
  ctx.fillText('Press SPACE or click to run again', VIEW_W / 2, 566);
  ctx.globalAlpha = 1;
}
