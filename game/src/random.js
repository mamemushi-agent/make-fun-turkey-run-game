// random.js — a small seeded random number generator (mulberry32).
// One job: make every run of the track reproducible from a seed, so the
// screenshot poses and the daily seed produce the same farm every time.

export class SeededRandom {
  constructor(seed) {
    this.state = (seed >>> 0) || 1;
  }

  // Next float in [0, 1).
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Float in [min, max).
  range(min, max) {
    return min + this.next() * (max - min);
  }

  // Integer in [min, max] inclusive.
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  // True with probability p.
  chance(p) {
    return this.next() < p;
  }

  // One element of a non-empty array.
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }
}
