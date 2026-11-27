// input.js — keyboard, mouse and touch state for Pardon Run.
// One job: turn raw browser events into the four verbs the game reads —
// jump, duck, dash and confirm — with clean edge detection per frame.

const JUMP_KEYS = new Set(['ArrowUp', 'KeyW', 'Space']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const DASH_KEYS = new Set(['ArrowRight', 'KeyD', 'ShiftLeft', 'ShiftRight']);

export class Input {
  constructor(canvas) {
    this.held = new Set();
    this.pressedEdges = new Set();
    this.pointerDown = false;
    this.pointerEdge = false;
    this.pointerLow = false;   // touch/press on the lower half = duck

    window.addEventListener('keydown', (event) => {
      if (JUMP_KEYS.has(event.code) || DUCK_KEYS.has(event.code) || event.code === 'ArrowLeft') {
        event.preventDefault();
      }
      if (!event.repeat) this.pressedEdges.add(event.code);
      this.held.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.held.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.held.clear();
    });

    const press = (event) => {
      const rect = canvas.getBoundingClientRect();
      const y = (event.clientY - rect.top) / rect.height;
      this.pointerDown = true;
      this.pointerEdge = true;
      this.pointerLow = y > 0.55;
    };
    const release = () => {
      this.pointerDown = false;
      this.pointerLow = false;
    };
    canvas.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  }

  // True only on the frame the jump control went down.
  jumpPressed() {
    for (const code of this.pressedEdges) {
      if (JUMP_KEYS.has(code)) return true;
    }
    return this.pointerEdge && !this.pointerLow;
  }

  duckHeld() {
    for (const code of this.held) {
      if (DUCK_KEYS.has(code)) return true;
    }
    return this.pointerDown && this.pointerLow;
  }

  dashHeld() {
    for (const code of this.held) {
      if (DASH_KEYS.has(code)) return true;
    }
    return false;
  }

  // Any fresh press at all — used to start and to restart.
  confirmPressed() {
    return this.pressedEdges.size > 0 || this.pointerEdge;
  }

  // Call once at the end of each frame to clear the edge sets.
  endFrame() {
    this.pressedEdges.clear();
    this.pointerEdge = false;
  }
}
