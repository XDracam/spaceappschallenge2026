// Playtest telemetry hook (see playtest/README.md). Inert in normal play: it only
// installs when the playtest harness sets window.__MC_PLAYTEST__ before the app loads.
// It gives the harness read access to the state, the locally dispatched actions and
// the calendar speed, so an overseer can diagnose what players struggled with.
// Players in a playtest never see or use it.
import { observeDispatch } from './actions';
import { coreActions } from './coreActions';
import { gameStore, syncStore } from './store';

interface LoggedAction {
  /** performance.now() when dispatched. */
  at: number;
  type: string;
  args: unknown[];
}

declare global {
  interface Window {
    __MC_PLAYTEST__?: boolean;
    __mc?: {
      state(): unknown;
      sync(): unknown;
      /** Actions dispatched in this browser since the last drain (calendar ticks excluded). */
      drain(): LoggedAction[];
      setSpeed(daysPerSecond: number): void;
    };
  }
}

const MAX_LOG = 500;

export function installPlaytestHook(): void {
  if (!window.__MC_PLAYTEST__) return;
  let log: LoggedAction[] = [];
  observeDispatch((type, args) => {
    if (type === 'core/tick') return;
    if (log.length < MAX_LOG) log.push({ at: performance.now(), type, args });
  });
  window.__mc = {
    state: () => gameStore.get(),
    sync: () => syncStore.get(),
    drain: () => {
      const out = log;
      log = [];
      return out;
    },
    setSpeed: (daysPerSecond) => coreActions.setSpeed(daysPerSecond),
  };
}
