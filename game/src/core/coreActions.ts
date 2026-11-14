// Core actions: calendar, seats, phase. Station reducers live in stations/*/logic.ts.
import { defineActions, runTickHandlers } from './actions';
import type { NewsItem, StationId } from './model';
import type { GameState } from './state';

/** Append a news item (shared feed on every station). */
export function pushNews(s: GameState, item: Omit<NewsItem, 'id' | 'day'>, newId: (p: string) => string): void {
  s.events.news.unshift({ id: newId('news'), day: s.clock.day, ...item });
  if (s.events.news.length > 200) s.events.news.length = 200;
}

export function setFlag(s: GameState, flag: string, on: boolean): void {
  s.events.flags = s.events.flags.filter((f) => f !== flag);
  if (on) s.events.flags.push(flag);
}

export const coreActions = defineActions('core', {
  /** Host clock: advance the agency calendar; runs every station's tick handler. */
  tick(s, ctx, toDay: number) {
    if (s.meta.phase !== 'planning') return;
    const from = s.clock.day;
    if (!(toDay > from)) return;
    // Step in whole-day boundaries so day-based logic sees each day in order.
    let day = from;
    while (day < toDay && s.meta.phase === 'planning') {
      const next = Math.min(toDay, Math.floor(day) + 1);
      s.clock.day = next;
      runTickHandlers(s, { ...ctx, day: next }, day, next);
      day = next;
    }
  },
  setRunning(s, _ctx, running: boolean) {
    s.clock.running = running;
  },
  setSpeed(s, _ctx, daysPerSecond: number) {
    s.clock.daysPerSecond = Math.max(0, daysPerSecond);
  },
  /** Leave the lobby: the calendar starts. */
  startGame(s) {
    if (s.meta.phase !== 'lobby') return;
    s.meta.phase = 'planning';
    s.clock.running = true;
  },
  /** Sit at a station. Allowed if free or already yours; frees your previous seat (hop, D-015). */
  claimSeat(s, _ctx, station: StationId, peerId: string, playerName?: string) {
    const seat = s.meta.seats[station];
    if (seat.claimedBy && seat.claimedBy !== peerId) return;
    for (const st of Object.keys(s.meta.seats) as StationId[]) {
      if (s.meta.seats[st].claimedBy === peerId && st !== station) s.meta.seats[st] = { claimedBy: null };
    }
    s.meta.seats[station] = { claimedBy: peerId, ...(playerName ? { playerName } : {}) };
  },
  releaseSeat(s, _ctx, peerId: string) {
    for (const st of Object.keys(s.meta.seats) as StationId[]) {
      if (s.meta.seats[st].claimedBy === peerId) s.meta.seats[st] = { claimedBy: null };
    }
  },
});
