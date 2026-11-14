// Host saves the authoritative state to localStorage (resume after a reload).
import { onHostState } from './store';
import { STATE_VERSION, type GameState } from './state';

const KEY = 'mission-control.save.v1';
let timer: ReturnType<typeof setTimeout> | null = null;
let latest: GameState | null = null;

export function startPersistence(): void {
  onHostState((s) => {
    latest = s;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (latest) save(latest);
    }, 1000);
  });
  addEventListener('pagehide', () => latest && save(latest));
}

function save(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or unavailable: play on */
  }
}

export function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s?.version !== STATE_VERSION) return null;
    // Saves from before mission selection were Mars games.
    s.meta.missionId ??= 'mars-orbiter-lander';
    return s;
  } catch {
    return null;
  }
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
