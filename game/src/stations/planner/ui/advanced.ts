// "Advanced" switch of the Rocket panel: off by default, remembered per browser.
// When on, the panel shows fuel types, engine counts, stage order, add / remove
// menus and per-stage details, and the header shows the Versions pill.
import { createStore, useStore } from '../../../core/createStore';

const KEY = 'planner.rocket.advanced';

function load(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

const advancedStore = createStore<{ on: boolean }>({ on: load() });

export function useAdvanced(): boolean {
  return useStore(advancedStore, (s) => s.on);
}

export function setAdvanced(on: boolean) {
  advancedStore.set({ on });
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // Storage blocked: the switch still works for this session.
  }
}
