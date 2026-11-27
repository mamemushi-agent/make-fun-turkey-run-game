// world.js — the run itself: track generation, turkey physics, the
// farmer's chase, collisions and scoring. One job: simulate one run of
// Pardon Run deterministically from a seed and the player's input.

import {
  GROUND_Y, GRAVITY, JUMP_VELOCITY, DOUBLE_JUMP_VELOCITY, FAST_FALL,
  GOAL_DISTANCE, START_FEATHERS, TURKEY_X, CRUISE_SPEED, DASH_SPEED,
  MUD_SPEED, PX_PER_METRE, FARMER_CATCH_GAP, FARMER_START_GAP,
  FARMER_MAX_GAP, CORN_SCORE, PUMPKIN_SCORE, NEAR_MISS_SCORE,
  stageAt, stageIndexAt,
} from './config.js';
import { SeededRandom } from './random.js';

// Obstacle footprints: width, and height above the ground in px. A jump
// clears about 190 px, so everything here is clearable; the oven is the
// tall one and wants a full, well-timed hop.
const OBSTACLES = {
  bale: { w: 74, h: 52 },
  fence: { w: 96, h: 64 },
  oven: { w: 92, h: 100 },
  mud: { w: 170, h: 0 },
  haystack: { w: 120, h: 104 },
};
const KNIFE_BOTTOM = 70;   // a thrown knife flies at standing-head height
const KNIFE_TOP = 96;
const KNIFE_SPEED = 600;   // world px/s, faster than the turkey runs

export class World {
  constructor(seed = 1) {
    this.rng = new SeededRandom(seed);
    this.reset();
  }

  reset() {
    this.state = 'running';       // running | caught | escaped
    this.scrollX = 0;             // world px scrolled past the camera
    this.distance = 0;            // metres run
    this.score = 0;
    this.feathers = START_FEATHERS;
    this.cornCount = 0;
    this.stamina = 40;
    this.speed = CRUISE_SPEED;
    this.timeAlive = 0;
    this.stageIndex = 0;
    this.bannerTimer = 3.2;       // opening stage banner
    this.bannerText = '';

    this.turkey = {
      y: 0, vy: 0, jumps: 0, ducking: false,
      hurtTimer: 0, hiddenTimer: 0, invulnTimer: 0, inMud: false,
    };
    this.gap = FARMER_START_GAP;  // px between farmer and turkey
    this.farmerPhase = 0;
    this.runPhase = 0;
    this.knifeTimer = 4;

    this.obstacles = [];
    this.pickups = [];
    this.particles = [];
    this.texts = [];
    this.nextSpawnX = 900;
    this.nextHaystackAt = this.rng.range(700, 1100); // in metres*PX below
    this.nextHaystackX = this.nextHaystackAt * PX_PER_METRE;
    this.shake = 0;
    this.generateAhead();
  }

  get stage() { return stageAt(this.distance); }
  get turkeyWorldX() { return this.scrollX + TURKEY_X; }

  // --- track generation -------------------------------------------------

  generateAhead() {
    const horizon = this.scrollX + 2400;
    while (this.nextSpawnX < horizon) {
      const d = this.nextSpawnX / PX_PER_METRE;
      const stage = stageAt(d);
      const roll = this.rng.next();

      if (this.nextSpawnX >= this.nextHaystackX) {
        this.obstacles.push({ kind: 'haystack', x: this.nextSpawnX, ...OBSTACLES.haystack, resolved: true });
        this.nextSpawnX += 340;
        this.nextHaystackX += this.rng.range(2600, 4200);
        continue;
      }
      if (roll < 0.16) {
        // A little harvest to grab, on the ground or in a jump arc.
        const arc = this.rng.chance(0.5);
        const n = this.rng.int(3, 5);
        for (let i = 0; i < n; i++) {
          const lift = arc ? Math.sin((i / (n - 1)) * Math.PI) * 120 : 0;
          this.pickups.push({
            kind: this.rng.chance(0.14) ? 'pumpkin' : 'corn',
            x: this.nextSpawnX + i * 52, lift: 44 + lift, taken: false,
            bob: this.rng.range(0, Math.PI * 2),
          });
        }
        this.nextSpawnX += n * 52 + this.rng.range(200, 380);
        continue;
      }
      if (roll < 0.30 && d > 60) {
        this.obstacles.push({ kind: 'mud', x: this.nextSpawnX, ...OBSTACLES.mud, resolved: false });
        this.nextSpawnX += OBSTACLES.mud.w + this.rng.range(300, 520);
        continue;
      }
      // A jumpable hazard, weighted by stage.
      const kinds = stage.id === 'kitchen'
        ? ['bale', 'fence', 'oven', 'oven', 'fence']
        : stage.id === 'forest'
          ? ['bale', 'fence', 'fence']
          : ['bale', 'bale', 'fence'];
      const kind = this.rng.pick(kinds);
      this.obstacles.push({ kind, x: this.nextSpawnX, ...OBSTACLES[kind], resolved: false });
      // Spacing stays fair all run: even at full late-run tightness there
      // is always room to land from one jump and take off for the next.
      const tightness = Math.min(1, d / GOAL_DISTANCE);
      this.nextSpawnX += this.rng.range(540 - tightness * 110, 740 - tightness * 120);
    }
    // Drop what is far behind.
    const cut = this.scrollX - 500;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > cut);
    this.pickups = this.pickups.filter((p) => p.x > cut && !p.taken);
  }

  // --- helpers ------------------------------------------------------------

  addText(x, y, text, color = '#fff3d6') {
    this.texts.push({ x, y, text, color, life: 1.1 });
  }

  burst(x, y, n, color, spread = 130, up = 160) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: this.rng.range(-spread, spread),
        vy: this.rng.range(-up, up * 0.3),
        life: this.rng.range(0.3, 0.7), maxLife: 0.7,
        color, size: this.rng.range(2.5, 5.5),
      });
    }
  }

  // Ducking tucks the turkey's head down — on the ground, and also in
  // the air, where a tuck plus the fast fall slips under a knife.
  turkeyHeight() { return this.turkey.ducking ? 56 : 92; }

  // --- the simulation -----------------------------------------------------

  update(dt, input, sound) {
    if (this.state !== 'running') return;
    const t = this.turkey;
    this.timeAlive += dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (t.hurtTimer > 0) t.hurtTimer -= dt;
    if (t.invulnTimer > 0) t.invulnTimer -= dt;
    if (t.hiddenTimer > 0) t.hiddenTimer -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);

    // Stage changes get a banner.
    const idx = stageIndexAt(this.distance);
    if (idx !== this.stageIndex) {
      this.stageIndex = idx;
      this.bannerText = this.stage.name;
      this.bannerTimer = 2.6;
      sound.gobble();
    }

    // --- turkey movement ---
    t.ducking = input.duckHeld();
    if (input.jumpPressed()) {
      if (t.y === 0) {
        t.vy = JUMP_VELOCITY; t.jumps = 1; sound.jump();
        this.burst(this.turkeyWorldX, 4, 5, '#caa06a', 70, 60);
      } else if (t.jumps < 2) {
        t.vy = DOUBLE_JUMP_VELOCITY; t.jumps = 2; sound.doubleJump();
        this.burst(this.turkeyWorldX, t.y + 6, 6, '#f7e8c8', 80, 40);
      }
    }
    const gravity = GRAVITY + (t.ducking && t.y > 0 ? FAST_FALL : 0);
    if (t.y > 0 || t.vy > 0) {
      t.vy -= gravity * dt;
      t.y += t.vy * dt;
      if (t.y <= 0) { t.y = 0; t.vy = 0; t.jumps = 0; }
    }

    // --- speed: mud, dash, cruise ---
    const wx = this.turkeyWorldX;
    t.inMud = this.obstacles.some(
      (o) => o.kind === 'mud' && wx > o.x - 10 && wx < o.x + o.w - 20 && t.y === 0,
    );
    const dashing = input.dashHeld() && this.stamina > 1 && !t.inMud;
    if (dashing) this.stamina = Math.max(0, this.stamina - 42 * dt);
    let target = t.inMud ? MUD_SPEED : dashing ? DASH_SPEED : CRUISE_SPEED;
    if (t.inMud && Math.random() < dt * 6) sound.splash();
    this.speed += (target - this.speed) * Math.min(1, dt * 5);
    this.scrollX += this.speed * dt;
    this.distance = this.scrollX / PX_PER_METRE;
    this.score += this.speed * dt * 0.06;
    this.runPhase += dt * (this.speed / 26);
    this.farmerPhase += dt * 11;

    // --- the farmer ---
    // He runs a touch slower than a clean cruise, so good running gains
    // ground; mud, stumbles and his late-run second wind give it back.
    const stage = this.stage;
    let farmerSpeed = this.speed * 0.88 + 8 * stage.surge
      + Math.min(12, this.timeAlive * 0.18) + (t.inMud ? 22 : 0);
    if (t.hiddenTimer > 0) farmerSpeed *= 0.45;         // he lost the trail
    this.gap += (this.speed - farmerSpeed) * dt;
    if (dashing) this.gap += 26 * dt;
    this.gap = Math.max(0, Math.min(FARMER_MAX_GAP, this.gap));
    if (this.gap <= FARMER_CATCH_GAP && t.invulnTimer <= 0) {
      this.farmerGrabs(sound);
      if (this.state !== 'running') return;
    }

    // Thrown knives in the later stages. The farmer is no fool: he never
    // throws while his own fence or oven is right in front of the turkey,
    // so a knife never arrives in the same breath as a forced jump.
    if (stage.knifeEvery > 0) {
      this.knifeTimer -= dt;
      if (this.knifeTimer <= 0) {
        const blocked = this.obstacles.some(
          (o) => !o.flying && o.kind !== 'mud' && o.kind !== 'haystack'
            && o.x > wx + 30 && o.x < wx + 340,
        );
        if (blocked) {
          this.knifeTimer = 0.7;
        } else {
          this.knifeTimer = stage.knifeEvery * this.rng.range(0.8, 1.25);
          this.obstacles.push({
            kind: 'knife', x: wx - this.gap + 30, w: 54, h: KNIFE_TOP - KNIFE_BOTTOM,
            resolved: false, spin: 0, flying: true,
          });
          sound.knifeWhoosh();
        }
      }
    }

    this.resolveObstacles(dt, sound);
    this.resolvePickups(sound);
    this.updateFx(dt);
    this.generateAhead();

    if (this.distance >= GOAL_DISTANCE) {
      this.state = 'escaped';
      this.score += 500 + this.feathers * 150 + Math.round(this.stamina);
      sound.stopMusic();
      sound.winJingle();
    }
  }

  farmerGrabs(sound) {
    this.feathers -= 1;
    this.shake = 9;
    sound.thud();
    sound.squawk();
    this.burst(this.turkeyWorldX, 60, 14, '#e8d9b0', 190, 220);
    if (this.feathers <= 0) {
      this.state = 'caught';
      sound.stopMusic();
      sound.loseJingle();
      return;
    }
    this.addText(this.turkeyWorldX, 170, 'CAUGHT! He drops you…', '#ffd2c2');
    this.gap = 400;
    this.turkey.invulnTimer = 1.6;
  }

  resolveObstacles(dt, sound) {
    const t = this.turkey;
    const wx = this.turkeyWorldX;
    const tBottom = t.y;
    const tTop = t.y + this.turkeyHeight();
    const tLeft = wx - 30, tRight = wx + 36;

    for (const o of this.obstacles) {
      if (o.flying) {
        o.x += KNIFE_SPEED * dt;
        o.spin += dt * 11;
        if (o.x > wx + 620) o.resolved = true;
      }
      const oLeft = o.x, oRight = o.x + o.w;
      const overlapX = tRight > oLeft + 6 && tLeft < oRight - 6;
      if (!overlapX) {
        // Clearing a hazard cleanly, close enough to feel it: near miss.
        if (!o.resolved && !o.flying && o.kind !== 'mud' && o.kind !== 'haystack'
          && oRight < tLeft && oRight > tLeft - 26 && tBottom > 0 && tBottom < o.h + 44) {
          o.resolved = true;
          this.score += NEAR_MISS_SCORE;
          this.addText(wx, tTop + 36, `NEAR MISS +${NEAR_MISS_SCORE}`, '#ffe9a8');
        }
        continue;
      }
      if (o.kind === 'haystack') {
        if (t.hiddenTimer <= 0 && t.y === 0) {
          t.hiddenTimer = 1.15;
          this.gap = Math.min(FARMER_MAX_GAP, this.gap + 95);
          this.addText(wx, 190, 'HIDDEN!', '#cfe8b0');
          sound.hiddenChime();
        }
        o.resolved = true;
        continue;
      }
      if (o.kind === 'mud' || o.resolved) continue;

      const oBottom = o.flying ? KNIFE_BOTTOM : 0;
      // Ground hazards forgive a graze: their top 8 px are safe to clip
      // on the way over, so a jump that nearly clears still clears.
      const oTop = o.flying ? KNIFE_TOP : o.h - 8;
      // A thrown knife threatens a turkey standing on the ground: duck
      // under it, or be airborne as it passes — either answer works, so
      // a jump over a fence never has to fear the knife crossing at
      // that moment. (Fully grounded means y and vy both zero, so the
      // first frame of a jump already counts as airborne.)
      if (o.flying && !(t.y === 0 && t.vy === 0)) continue;
      if (tBottom < oTop && tTop > oBottom) {
        o.resolved = true;
        if (t.invulnTimer > 0) continue;
        this.stumble(sound, o.flying ? 'Sliced by a knife!' : 'Tripped!');
      }
    }
    this.obstacles = this.obstacles.filter((o) => !(o.flying && o.resolved && o.x > wx + 620));
  }

  stumble(sound, label) {
    const t = this.turkey;
    this.feathers -= 1;
    t.hurtTimer = 0.5;
    t.invulnTimer = 1.4;
    this.shake = 8;
    this.gap = Math.max(120, this.gap - 150);   // the farmer surges forward
    this.addText(this.turkeyWorldX, 190, label, '#ffd2c2');
    this.burst(this.turkeyWorldX, 60, 12, '#e8d9b0', 170, 200);
    sound.thud();
    sound.squawk();
    if (this.feathers <= 0) {
      this.state = 'caught';
      sound.stopMusic();
      sound.loseJingle();
    }
  }

  resolvePickups(sound) {
    const wx = this.turkeyWorldX;
    const midY = this.turkey.y + 44;
    for (const p of this.pickups) {
      if (p.taken) continue;
      if (Math.abs(p.x - wx) < 52 && Math.abs(p.lift - midY) < 62) {
        p.taken = true;
        if (p.kind === 'corn') {
          this.cornCount += 1;
          this.stamina = Math.min(100, this.stamina + 26);
          this.score += CORN_SCORE;
          this.addText(p.x, p.lift + 56, `+${CORN_SCORE}`, '#ffe9a8');
          sound.corn();
        } else {
          this.stamina = Math.min(100, this.stamina + 55);
          this.score += PUMPKIN_SCORE;
          this.addText(p.x, p.lift + 56, `+${PUMPKIN_SCORE}`, '#ffb35c');
          sound.pumpkin();
        }
        this.burst(p.x, p.lift, 7, '#f2c14e', 90, 90);
      }
    }
  }

  updateFx(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 300 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.y += 34 * dt;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  // --- screenshot poses -----------------------------------------------------
  // Hand-arranged deterministic scenes for the maker's screenshots. The
  // world is rebuilt from a fixed seed, then the actors are placed.

  pose(scene) {
    this.reset();
    this.bannerTimer = 0;
    if (scene === 'farm') {
      this.scrollX = 120 * PX_PER_METRE;
      this.distance = 120;
      this.score = 1450;
      this.cornCount = 6;
      this.stamina = 64;
      this.obstacles = [
        { kind: 'fence', x: this.scrollX + 250, ...OBSTACLES.fence, resolved: false },
        { kind: 'bale', x: this.scrollX + TURKEY_X - 10, ...OBSTACLES.bale, resolved: false },
        { kind: 'haystack', x: this.scrollX + 1010, ...OBSTACLES.haystack, resolved: true },
      ];
      this.pickups = [0, 1, 2].map((i) => ({
        kind: 'corn', x: this.scrollX + 660 + i * 54, lift: 150 - Math.abs(i - 1) * 34,
        taken: false, bob: i,
      }));
      this.turkey.y = 96;
      this.turkey.vy = 120;
      this.gap = 300;
      this.runPhase = 2.2;
      this.farmerPhase = 4.1;
    } else if (scene === 'kitchen') {
      this.scrollX = 800 * PX_PER_METRE;
      this.distance = 800;
      this.score = 6925;
      this.cornCount = 17;
      this.feathers = 2;
      this.stamina = 38;
      this.stageIndex = 2;
      this.obstacles = [
        { kind: 'oven', x: this.scrollX + 800, ...OBSTACLES.oven, resolved: false },
        { kind: 'knife', x: this.scrollX + 590, w: 54, h: KNIFE_TOP - KNIFE_BOTTOM, resolved: false, spin: 1.2, flying: true },
        { kind: 'mud', x: this.scrollX + 130, ...OBSTACLES.mud, resolved: false },
      ];
      this.pickups = [{ kind: 'pumpkin', x: this.scrollX + 950, lift: 60, taken: false, bob: 1 }];
      this.turkey.ducking = true;
      this.gap = 215;
      this.runPhase = 5.4;
      this.farmerPhase = 2.6;
    }
    // A pose is a still life: push the generator far past the camera so
    // nothing unposed wanders into the frame.
    this.nextSpawnX = this.scrollX + 6000;
    this.nextHaystackX = this.scrollX + 9000;
  }
}

export { GROUND_Y };
