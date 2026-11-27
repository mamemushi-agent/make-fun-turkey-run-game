// art.js — every character and prop in Pardon Run, drawn in canvas vector
// shapes. One job: the turkey, the farmer, and the things between them.
// All art is original, drawn from ellipses, arcs and polygons in an autumn
// palette; (x, y) is always the ground point under the character's feet.

export function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The hero. opts: runPhase (leg cycle), ducking, airborne, hurt (flash),
// hidden (inside a haystack, drawn faded), flap (wing up 0..1).
export function drawTurkey(ctx, x, y, opts = {}) {
  const phase = opts.runPhase || 0;
  const duck = opts.ducking ? 1 : 0;
  const hurt = opts.hurt ? 1 : 0;
  const bodyY = y - 46 + duck * 16;
  const bodyTilt = opts.airborne ? -0.12 : Math.sin(phase * 2) * 0.04;

  ctx.save();
  ctx.translate(x, 0);
  if (opts.hidden) ctx.globalAlpha = 0.45;

  // Legs: two orange sticks cycling as the turkey runs.
  ctx.strokeStyle = '#e07b24';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const legSwing = opts.airborne ? 10 : Math.sin(phase) * 16;
  ctx.beginPath();
  ctx.moveTo(-6, bodyY + 26);
  ctx.lineTo(-6 + legSwing, y - 2);
  ctx.moveTo(12, bodyY + 26);
  ctx.lineTo(12 - legSwing, y - 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(0, bodyY);
  ctx.rotate(bodyTilt);

  // Tail fan: five feathers fanned behind, in rust, gold and brown.
  const fan = ['#a34d1f', '#c96a24', '#e09a3a', '#c96a24', '#a34d1f'];
  for (let i = 0; i < 5; i++) {
    const a = -0.5 + i * 0.26;
    ctx.save();
    ctx.translate(-34, -6);
    ctx.rotate(a - 0.5);
    ctx.fillStyle = hurt ? '#d98c8c' : fan[i];
    ctx.beginPath();
    ctx.ellipse(-20, 0, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,200,.55)';
    ctx.beginPath();
    ctx.ellipse(-38, 0, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Plump body.
  ellipse(ctx, 0, 0, 44, 32, hurt ? '#c98a7a' : '#8a5a33');
  ellipse(ctx, -4, 6, 36, 24, hurt ? '#d69a86' : '#a06a3a');
  // Breast feathers.
  ellipse(ctx, 22, 4, 18, 20, '#e8d9b0');

  // Wing, flapping when airborne or dashing.
  const flap = opts.flap || 0;
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(-0.3 - flap * 0.7);
  ctx.fillStyle = '#6f4525';
  ctx.beginPath();
  ctx.ellipse(-8, 6, 22, 11, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck and head, stretched forward while ducking.
  const headX = 44 + duck * 14;
  const headY = -26 + duck * 14;
  ctx.strokeStyle = '#7d94a8';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(26, -12);
  ctx.quadraticCurveTo(38, -22, headX, headY);
  ctx.stroke();
  ellipse(ctx, headX + 6, headY - 4, 15, 12, '#93a9bc');
  // Wattle and snood, bright red.
  ellipse(ctx, headX + 10, headY + 6, 6, 10, '#d23b2e');
  ctx.fillStyle = '#d23b2e';
  ctx.beginPath();
  ctx.ellipse(headX + 16, headY - 12, 4, 8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2a71b';
  ctx.beginPath();
  ctx.moveTo(headX + 18, headY - 6);
  ctx.lineTo(headX + 32, headY - 2);
  ctx.lineTo(headX + 18, headY + 2);
  ctx.closePath();
  ctx.fill();
  // Eye — wide with alarm while the farmer is close.
  ellipse(ctx, headX + 8, headY - 7, opts.alarm ? 4.6 : 3.4, opts.alarm ? 4.6 : 3.4, '#1c1410');
  ellipse(ctx, headX + 9.5, headY - 8.5, 1.4, 1.4, '#ffffff');

  ctx.restore();
  ctx.restore();
}

// The pursuer. opts: runPhase, angry (face + speed lines), holdingKnife.
export function drawFarmer(ctx, x, y, opts = {}) {
  const phase = opts.runPhase || 0;
  const swing = Math.sin(phase) * 15;
  const bob = Math.abs(Math.sin(phase)) * 5;

  ctx.save();
  ctx.translate(x, y - bob);

  // Boots and legs in denim overalls.
  ctx.strokeStyle = '#33549e';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -52);
  ctx.lineTo(-4 + swing, -2);
  ctx.moveTo(10, -52);
  ctx.lineTo(10 - swing, -2);
  ctx.stroke();
  ctx.fillStyle = '#4a3220';
  roundedRect(ctx, -16 + swing, -8, 20, 8, 3); ctx.fill();
  roundedRect(ctx, 2 - swing, -8, 20, 8, 3); ctx.fill();

  // Torso: red plaid shirt under overall straps.
  ctx.fillStyle = '#b23a2e';
  roundedRect(ctx, -24, -118, 52, 70, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,220,.35)';
  ctx.lineWidth = 3;
  for (let i = -1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-24, -108 + i * 18); ctx.lineTo(28, -108 + i * 18); ctx.stroke();
  }
  ctx.fillStyle = '#33549e';
  roundedRect(ctx, -24, -84, 52, 38, 6); ctx.fill();
  roundedRect(ctx, -18, -118, 10, 38, 4); ctx.fill();
  roundedRect(ctx, 14, -118, 10, 38, 4); ctx.fill();
  // Belt buckle.
  ctx.fillStyle = '#f2c14e';
  roundedRect(ctx, -4, -52, 14, 9, 2); ctx.fill();

  // Arms pumping; the front hand grips a carving knife in later stages.
  ctx.strokeStyle = '#b23a2e';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-18, -108);
  ctx.lineTo(-30, -78 + swing * 0.7);
  ctx.moveTo(24, -108);
  ctx.lineTo(38, -80 - swing * 0.7);
  ctx.stroke();
  ellipse(ctx, -30, -76 + swing * 0.7, 7, 7, '#e8b58c');
  const handX = 38, handY = -78 - swing * 0.7;
  ellipse(ctx, handX, handY, 7, 7, '#e8b58c');
  if (opts.holdingKnife) drawKnifeShape(ctx, handX + 4, handY - 4, 0.5);

  // Head with a straw hat and a determined (or furious) face.
  ellipse(ctx, 2, -136, 17, 16, '#e8b58c');
  ctx.fillStyle = '#e8c25e';
  ctx.beginPath();
  ctx.ellipse(2, -148, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  roundedRect(ctx, -12, -164, 28, 14, 5); ctx.fill();
  ctx.fillStyle = '#1c1410';
  const brow = opts.angry ? 3 : 0;
  ellipse(ctx, -4, -138 + brow * 0.4, 2.4, 2.4, '#1c1410');
  ellipse(ctx, 9, -138 + brow * 0.4, 2.4, 2.4, '#1c1410');
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (opts.angry) {
    ctx.moveTo(-8, -146); ctx.lineTo(-1, -143);
    ctx.moveTo(13, -146); ctx.lineTo(6, -143);
    ctx.moveTo(-3, -126); ctx.lineTo(8, -126);
  } else {
    ctx.arc(2, -130, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();

  ctx.restore();
}

// The carving knife as a standalone shape, handle first.
export function drawKnifeShape(ctx, x, y, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#5d3d1c';
  roundedRect(ctx, -4, -4, 20, 8, 3); ctx.fill();
  ctx.fillStyle = '#cfd6dd';
  ctx.beginPath();
  ctx.moveTo(16, -6);
  ctx.lineTo(52, -3);
  ctx.quadraticCurveTo(58, 0, 52, 3);
  ctx.lineTo(16, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.fillRect(20, -3, 26, 2);
  ctx.restore();
}

// A thrown carving knife, spinning through the air at head height.
export function drawFlyingKnife(ctx, x, y, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  drawKnifeShape(ctx, -20, 0, 0);
  ctx.restore();
}

export function drawHayBale(ctx, x, y, w = 74, h = 52) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#d9a83f';
  roundedRect(ctx, 0, -h, w, h, 12); ctx.fill();
  ctx.strokeStyle = '#b9852c';
  ctx.lineWidth = 4;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((w / 4) * i, -h + 5);
    ctx.lineTo((w / 4) * i, -5);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a5a1d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, -h / 2); ctx.lineTo(w - 4, -h / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawFence(ctx, x, y, w = 96, h = 64) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#9c6b3d';
  for (let i = 0; i < 3; i++) {
    const px = 6 + i * (w / 3);
    ctx.beginPath();
    ctx.moveTo(px, -h);
    ctx.lineTo(px + 9, -h - 10);
    ctx.lineTo(px + 18, -h);
    ctx.lineTo(px + 18, 0);
    ctx.lineTo(px, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#8a5a2b';
  roundedRect(ctx, 0, -h + 12, w, 10, 3); ctx.fill();
  roundedRect(ctx, 0, -26, w, 10, 3); ctx.fill();
  ctx.restore();
}

// A hot oven with an open door and a glow — the kitchen's worst hazard.
export function drawOven(ctx, x, y, w = 92, h = 118) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#3f3a38';
  roundedRect(ctx, 0, -h, w, h, 8); ctx.fill();
  ctx.fillStyle = '#57504c';
  roundedRect(ctx, 6, -h + 6, w - 12, 26, 5); ctx.fill();
  // Hob rings.
  ctx.fillStyle = '#2c2826';
  ellipse(ctx, w * 0.3, -h + 19, 9, 5, '#2c2826');
  ellipse(ctx, w * 0.68, -h + 19, 9, 5, '#2c2826');
  // Glowing door window.
  const glow = ctx.createLinearGradient(0, -h + 44, 0, -16);
  glow.addColorStop(0, '#ff9d2e');
  glow.addColorStop(1, '#d23b2e');
  ctx.fillStyle = glow;
  roundedRect(ctx, 12, -h + 44, w - 24, h - 60, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,150,.75)';
  ctx.beginPath();
  ctx.ellipse(w / 2, -h + 74, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Handle.
  ctx.fillStyle = '#cfd6dd';
  roundedRect(ctx, 10, -h + 38, w - 20, 5, 2); ctx.fill();
  ctx.restore();
}

export function drawMudPuddle(ctx, x, y, w) {
  ctx.save();
  ctx.translate(x, y);
  const grad = ctx.createLinearGradient(0, -8, 0, 6);
  grad.addColorStop(0, '#5d4020');
  grad.addColorStop(1, '#3c2812');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(w / 2, 0, w / 2, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,235,200,.28)';
  ctx.beginPath();
  ctx.ellipse(w * 0.35, -2, w * 0.16, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A haystack big enough to hide in: passing through breaks the chase.
export function drawHaystack(ctx, x, y, w = 120, h = 104) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#c9932f';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w * 0.1, -h, w / 2, -h);
  ctx.quadraticCurveTo(w * 0.9, -h, w, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a87424';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const sx = 14 + i * (w - 28) / 4;
    ctx.beginPath();
    ctx.moveTo(sx, -8);
    ctx.quadraticCurveTo(sx + 6, -h * 0.55, sx + 2, -h * 0.86);
    ctx.stroke();
  }
  // The dark hollow a turkey can vanish into.
  ctx.fillStyle = 'rgba(70,45,10,.55)';
  ctx.beginPath();
  ctx.ellipse(w / 2, -4, 26, 15, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCorn(ctx, x, y, bob = 0) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(0.5);
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a83f';
  ctx.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(-8, i * 7); ctx.lineTo(8, i * 7); ctx.stroke();
  }
  ctx.fillStyle = '#5e8f3e';
  ctx.beginPath();
  ctx.ellipse(-8, 14, 10, 5, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPumpkinPickup(ctx, x, y, bob = 0) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#e07b24';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b85f16';
  ctx.lineWidth = 2;
  for (const off of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.ellipse(off, 0, 7, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#5e8f3e';
  roundedRect(ctx, -3, -20, 7, 8, 2); ctx.fill();
  ctx.restore();
}

// The forest gate at the end of the run: two pines and a wooden sign.
export function drawFreedomGate(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  for (const px of [-6, 128]) {
    ctx.fillStyle = '#4a3015';
    ctx.fillRect(px + 22, -46, 12, 46);
    ctx.fillStyle = '#3e6b34';
    for (let i = 0; i < 3; i++) {
      const w = 74 - i * 16;
      ctx.beginPath();
      ctx.moveTo(px + 28 - w / 2, -40 - i * 42);
      ctx.lineTo(px + 28 + w / 2, -40 - i * 42);
      ctx.lineTo(px + 28, -86 - i * 42);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = '#8a5a2b';
  roundedRect(ctx, 6, -168, 118, 34, 6); ctx.fill();
  ctx.fillStyle = '#f7e8c8';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM', 65, -145);
  ctx.restore();
}
