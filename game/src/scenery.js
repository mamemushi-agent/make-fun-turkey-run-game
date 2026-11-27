// scenery.js — the scrolling autumn world behind the chase.
// One job: paint sky, hills, landmarks and ground for the current stage,
// with parallax layers keyed to the camera so the farm rolls past.

import { VIEW_W, VIEW_H, GROUND_Y, STAGES } from './config.js';

// Deterministic pseudo-random from a tile index, so the scenery is the
// same on every visit without storing anything.
function tileRand(tile, salt) {
  let t = (tile * 374761393 + salt * 668265263) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
}

function pineTree(ctx, x, y, h, color) {
  ctx.fillStyle = '#4a3015';
  ctx.fillRect(x - 4, y - h * 0.24, 8, h * 0.24);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const w = h * 0.52 * (1 - i * 0.22);
    const base = y - h * 0.18 - i * h * 0.24;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, base);
    ctx.lineTo(x + w / 2, base);
    ctx.lineTo(x, base - h * 0.34);
    ctx.closePath();
    ctx.fill();
  }
}

function roundTree(ctx, x, y, h, colors) {
  ctx.fillStyle = '#5d3d1c';
  ctx.fillRect(x - 5, y - h * 0.42, 10, h * 0.42);
  const blobs = [[0, -h * 0.62, h * 0.30], [-h * 0.2, -h * 0.48, h * 0.22], [h * 0.2, -h * 0.5, h * 0.24]];
  blobs.forEach(([bx, by, r], i) => {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x + bx, y + by, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBarn(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#a33327';
  ctx.fillRect(-70, -110, 140, 110);
  ctx.fillStyle = '#7e271d';
  ctx.beginPath();
  ctx.moveTo(-84, -110);
  ctx.lineTo(0, -168);
  ctx.lineTo(84, -110);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f3e6cf';
  ctx.fillRect(-22, -74, 44, 74);
  ctx.strokeStyle = '#7e271d';
  ctx.lineWidth = 5;
  ctx.strokeRect(-22, -74, 44, 74);
  ctx.beginPath();
  ctx.moveTo(-22, -74); ctx.lineTo(22, 0);
  ctx.moveTo(22, -74); ctx.lineTo(-22, 0);
  ctx.stroke();
  ctx.fillStyle = '#f3e6cf';
  ctx.fillRect(-14, -140, 28, 26);
  ctx.restore();
}

function drawFarmhouse(ctx, x, y, smokePhase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#efe3cc';
  ctx.fillRect(-80, -96, 160, 96);
  ctx.fillStyle = '#6b4a2a';
  ctx.beginPath();
  ctx.moveTo(-96, -96);
  ctx.lineTo(0, -152);
  ctx.lineTo(96, -96);
  ctx.closePath();
  ctx.fill();
  // Chimney with drifting smoke — this house has an oven inside.
  ctx.fillStyle = '#8a7360';
  ctx.fillRect(44, -148, 22, 44);
  ctx.fillStyle = 'rgba(240,240,240,.5)';
  for (let i = 0; i < 3; i++) {
    const sy = -160 - ((smokePhase * 14 + i * 26) % 70);
    const sx = 55 + Math.sin(smokePhase * 0.7 + i) * 8 + (i * 5);
    ctx.beginPath();
    ctx.arc(sx, sy, 8 + i * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#5d3d1c';
  ctx.fillRect(-16, -58, 32, 58);
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(-62, -76, 26, 24);
  ctx.fillRect(38, -76, 26, 24);
  ctx.restore();
}

function drawSilo(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#b9bfc4';
  ctx.fillRect(-24, -170, 48, 170);
  ctx.fillStyle = '#9aa1a7';
  ctx.beginPath();
  ctx.arc(0, -170, 24, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,95,100,.5)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(-24, -170 + i * 34); ctx.lineTo(24, -170 + i * 34); ctx.stroke();
  }
  ctx.restore();
}

// Paint the whole backdrop. cameraX is the world scroll in pixels.
export function drawScenery(ctx, stage, cameraX, timeSec) {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, stage.sky[0]);
  sky.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y + 4);

  // Low sun and a few slow clouds.
  ctx.fillStyle = 'rgba(255,244,200,.9)';
  ctx.beginPath();
  ctx.arc(1090, 108, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,250,235,.75)';
  const cloudOff = (cameraX * 0.05) % 700;
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 460 + 140 - cloudOff) % (VIEW_W + 320) + VIEW_W + 320) % (VIEW_W + 320) - 160;
    const cy = 66 + i * 44;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 17, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 38, cy + 5, 42, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far hills (slowest parallax).
  ctx.fillStyle = stage.hill;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  const hillOff = (cameraX * 0.18) % 560;
  for (let x = -560; x < VIEW_W + 560; x += 560) {
    ctx.quadraticCurveTo(x + 280 - hillOff, GROUND_Y - 190, x + 560 - hillOff, GROUND_Y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Landmark layer: what stands on the horizon depends on the stage.
  const midOff = cameraX * 0.42;
  ctx.fillStyle = stage.far;
  ctx.fillRect(0, GROUND_Y - 26, VIEW_W, 26);
  const tileW = 620;
  const firstTile = Math.floor(midOff / tileW);
  for (let t = firstTile - 1; t < firstTile + 3; t++) {
    const x = t * tileW - midOff;
    const r = tileRand(t, 7);
    if (stage.id === 'farmyard') {
      if (r < 0.45) drawBarn(ctx, x + 200, GROUND_Y - 20, 0.9 + r * 0.3);
      else if (r < 0.7) drawSilo(ctx, x + 260, GROUND_Y - 20);
      else roundTree(ctx, x + 200, GROUND_Y - 20, 130, ['#c96a24', '#e09a3a', '#a34d1f']);
    } else if (stage.id === 'cornfields') {
      if (r < 0.6) roundTree(ctx, x + 180, GROUND_Y - 20, 150, ['#d98e2e', '#b96f35', '#e0aa3a']);
      else drawBarn(ctx, x + 240, GROUND_Y - 20, 0.75);
    } else if (stage.id === 'kitchen') {
      if (r < 0.55) drawFarmhouse(ctx, x + 260, GROUND_Y - 20, timeSec + t);
      else roundTree(ctx, x + 180, GROUND_Y - 20, 120, ['#b96f35', '#96552a', '#c97e2e']);
    } else {
      pineTree(ctx, x + 120, GROUND_Y - 20, 190, '#3e6b34');
      pineTree(ctx, x + 330, GROUND_Y - 20, 150, '#35592c');
      if (r < 0.5) pineTree(ctx, x + 500, GROUND_Y - 20, 215, '#3e6b34');
    }
  }

  // Ground band with a scrolling texture of tufts, stones and stubble.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.groundDark;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 7);
  const gOff = cameraX % 90;
  ctx.strokeStyle = 'rgba(0,0,0,.18)';
  ctx.lineWidth = 2;
  for (let x = -90; x < VIEW_W + 90; x += 90) {
    const gx = x - gOff;
    const r = tileRand(Math.round((x + cameraX) / 90), 3);
    ctx.beginPath();
    ctx.moveTo(gx + 12, GROUND_Y + 26 + r * 50);
    ctx.lineTo(gx + 30 + r * 30, GROUND_Y + 26 + r * 50);
    ctx.stroke();
    if (stage.id === 'cornfields' || stage.id === 'farmyard') {
      ctx.strokeStyle = 'rgba(240,200,90,.5)';
      ctx.beginPath();
      ctx.moveTo(gx + 52, GROUND_Y + 12);
      ctx.lineTo(gx + 52, GROUND_Y + 2);
      ctx.moveTo(gx + 46, GROUND_Y + 8);
      ctx.lineTo(gx + 58, GROUND_Y + 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.18)';
    }
  }
}

export { STAGES };
