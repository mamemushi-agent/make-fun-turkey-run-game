// audio.js — every sound in Pardon Run, synthesised with WebAudio.
// One job: gobbles, thuds, jingles and a small plucked-string music loop,
// with no audio files. The context wakes on the first user gesture.

const SCALE = [0, 3, 5, 7, 10, 12, 15, 12, 10, 7, 5, 3]; // minor pentatonic walk
const ROOT = 196; // G3

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.step = 0;
  }

  wake() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    this.ctx = new AudioCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  // One short tone with an envelope; the building block of every effect.
  tone(freq, dur, type = 'square', vol = 0.2, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // A burst of filtered noise — footsteps, splashes, crashes.
  noise(dur, vol = 0.2, freq = 900, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  jump() { this.tone(320, 0.16, 'square', 0.14, 660); }
  doubleJump() { this.tone(520, 0.16, 'square', 0.14, 920); }
  gobble() {
    // A wobbly little gobble: three fast descending chirps.
    for (let i = 0; i < 3; i++) {
      this.tone(880 - i * 120, 0.07, 'sawtooth', 0.10, 420, i * 0.07);
    }
  }
  corn() {
    this.tone(740, 0.08, 'triangle', 0.18);
    this.tone(1180, 0.12, 'triangle', 0.16, null, 0.06);
  }
  pumpkin() {
    this.tone(520, 0.09, 'triangle', 0.18);
    this.tone(780, 0.09, 'triangle', 0.18, null, 0.07);
    this.tone(1240, 0.16, 'triangle', 0.16, null, 0.14);
  }
  thud() {
    this.noise(0.18, 0.3, 500);
    this.tone(140, 0.22, 'sine', 0.3, 60);
  }
  squawk() {
    this.tone(1200, 0.2, 'sawtooth', 0.16, 300);
    this.tone(900, 0.24, 'sawtooth', 0.12, 240, 0.08);
  }
  knifeWhoosh() { this.noise(0.14, 0.12, 3200); }
  splash() { this.noise(0.25, 0.16, 700); }
  hiddenChime() { this.tone(980, 0.2, 'sine', 0.10, 1320); }
  winJingle() {
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.18, null, i * 0.13));
  }
  loseJingle() {
    const notes = [392, 370, 349, 311];
    notes.forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.18, null, i * 0.17));
  }

  // A gentle plucked loop while the run is on; stops on the end screens.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const tick = () => {
      if (!this.muted) {
        const semis = SCALE[this.step % SCALE.length];
        const freq = ROOT * Math.pow(2, semis / 12);
        this.tone(freq, 0.24, 'triangle', 0.07);
        if (this.step % 4 === 0) this.tone(ROOT / 2, 0.4, 'sine', 0.08);
      }
      this.step++;
    };
    tick();
    this.musicTimer = setInterval(tick, 215);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.step = 0;
  }
}
