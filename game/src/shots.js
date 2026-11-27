// shots.js — the maker's screenshot poses.
// One job: read ?shot=<scene>&seed=<n> from the page URL so the game can
// be captured in a browser at exact, reproducible moments. Normal play
// never passes these parameters and is unaffected.

export function readShotRequest() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;
  return { shot, seed };
}

// The scenes the entry's screenshots are taken from, in file order.
export const SHOT_SCENES = ['title', 'farm', 'kitchen', 'escaped'];
