// Host-only calendar loop: dispatches core/tick a few times per second while the
// game is in planning and the clock runs. Clients never tick; they follow the host.
import { coreActions } from './coreActions';
import { getState, syncStore } from './store';

const TICK_MS = 250;
let started = false;

export function startHostClock(): void {
  if (started) return;
  started = true;
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = Math.min(1, (now - last) / 1000);
    last = now;
    if (syncStore.get().role === 'client') return;
    const s = getState();
    if (s.meta.phase !== 'planning' || !s.clock.running) return;
    coreActions.tick(s.clock.day + dt * s.clock.daysPerSecond);
  }, TICK_MS);
}
