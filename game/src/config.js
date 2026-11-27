// config.js — every tuning number and the stage table for Pardon Run.
// One job: hold the constants the rest of the game reads, so the feel of
// the run can be tuned in a single place.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 604;          // y of the dirt line the runners stand on
export const GRAVITY = 2500;          // px per second squared
export const JUMP_VELOCITY = 980;     // first hop off the ground
export const DOUBLE_JUMP_VELOCITY = 860;
export const FAST_FALL = 3400;        // extra gravity while ducking mid-air

export const GOAL_DISTANCE = 1200;    // metres to the forest gate = freedom
export const START_FEATHERS = 3;      // hits the turkey can take
export const TURKEY_X = 430;          // the turkey's fixed screen x

export const CRUISE_SPEED = 355;      // px/s the world scrolls at a clean run
export const DASH_SPEED = 560;        // px/s while dashing on corn power
export const MUD_SPEED = 190;         // px/s while splashing through mud
export const PX_PER_METRE = 46;       // scroll pixels that make one metre

export const FARMER_CATCH_GAP = 64;   // px behind the turkey: grabbing range
export const FARMER_START_GAP = 330;  // px behind at the start of a run
export const FARMER_MAX_GAP = 900;    // farthest the farmer can fall back

export const CORN_SCORE = 50;
export const PUMPKIN_SCORE = 150;
export const NEAR_MISS_SCORE = 25;

// The run crosses four stages; each one changes the scenery, the obstacle
// mix and the farmer's temper. `until` is the distance in metres where the
// next stage begins.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'Sunnybrook Farmyard',
    until: 300,
    sky: ['#ffd98a', '#ffb35c'],
    hill: '#d98e4a',
    far: '#b96f35',
    ground: '#8a5a2b',
    groundDark: '#744a21',
    knifeEvery: 0,                    // the farmer does not throw knives yet
    surge: 0.85,
  },
  {
    id: 'cornfields',
    name: 'Harvest Cornfields',
    until: 650,
    sky: ['#ffc978', '#ff9d4d'],
    hill: '#cf8438',
    far: '#a8622a',
    ground: '#7d4f22',
    groundDark: '#65401b',
    knifeEvery: 8.5,
    surge: 1.0,
  },
  {
    id: 'kitchen',
    name: 'The Kitchen Yard',
    until: 950,
    sky: ['#f7a95c', '#e07f3e'],
    hill: '#b96f35',
    far: '#8f4f24',
    ground: '#6e4520',
    groundDark: '#59371a',
    knifeEvery: 6.2,
    surge: 1.15,
  },
  {
    id: 'forest',
    name: 'Freedom Forest',
    until: Infinity,
    sky: ['#f2b25c', '#dd8a44'],
    hill: '#9c6a30',
    far: '#6f4a20',
    ground: '#5d3d1c',
    groundDark: '#4a3015',
    knifeEvery: 7.2,
    surge: 1.25,
  },
];

export function stageAt(distance) {
  for (const stage of STAGES) {
    if (distance < stage.until) return stage;
  }
  return STAGES[STAGES.length - 1];
}

export function stageIndexAt(distance) {
  for (let i = 0; i < STAGES.length; i++) {
    if (distance < STAGES[i].until) return i;
  }
  return STAGES.length - 1;
}
