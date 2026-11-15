// Core actions: calendar, seats, phase. Station reducers live in stations/*/logic.ts.
import { defineActions, runTickHandlers } from './actions';
import type { AttemptOutcome, NewsItem, StationId } from './model';
import { MISSIONS } from './mission';
import { scoreAttempt } from './score';
import { createGame, type GameState } from './state';

/** Attempt history is capped so snapshots stay small (oldest records are dropped). */
export const MAX_ATTEMPT_RECORDS = 12;

/** Append a news item (shared feed on every station). */
export function pushNews(s: GameState, item: Omit<NewsItem, 'id' | 'day'>, newId: (p: string) => string): void {
  s.events.news.unshift({ id: newId('news'), day: s.clock.day, ...item });
  if (s.events.news.length > 200) s.events.news.length = 200;
}

export function setFlag(s: GameState, flag: string, on: boolean): void {
  s.events.flags = s.events.flags.filter((f) => f !== flag);
  if (on) s.events.flags.push(flag);
}

/** The mission of this attempt has ended (launched: flown or scrubbed). */
export function missionEnded(s: GameState): boolean {
  return s.meta.phase === 'launched' || s.meta.phase === 'finished';
}

/** True once the current attempt is in s.meta.attempts. */
export function attemptRecorded(s: GameState): boolean {
  return s.meta.attempts.some((a) => a.attempt === s.meta.attempt);
}

function validOutcome(o: unknown): o is AttemptOutcome {
  const x = o as AttemptOutcome;
  return !!x && Number.isInteger(x.achieved) && Number.isInteger(x.total) && x.total >= 0
    && x.achieved >= 0 && x.achieved <= x.total && typeof x.scrubbed === 'boolean'
    && (x.bonusEarned === undefined || (Number.isFinite(x.bonusEarned) && x.bonusEarned >= 0))
    && (x.bonusTotal === undefined || (Number.isFinite(x.bonusTotal) && x.bonusTotal >= (x.bonusEarned ?? 0)));
}

/** Append the current attempt to the history once (only after the mission ended). */
function record(s: GameState, outcome: unknown): void {
  if (!missionEnded(s) || attemptRecorded(s) || !validOutcome(outcome)) return;
  const o = { achieved: outcome.achieved, total: outcome.total, scrubbed: outcome.scrubbed, bonusEarned: outcome.bonusEarned, bonusTotal: outcome.bonusTotal };
  s.meta.attempts.push({
    attempt: s.meta.attempt,
    missionId: s.meta.missionId,
    ...o,
    score: scoreAttempt(s, o),
    spentM: Math.round((s.budget.spentM + s.budget.committedM) * 10) / 10,
    fundingTotalM: s.budget.fundingTotalM,
    launchDay: s.planner.plan.launchDay,
  });
  if (s.meta.attempts.length > MAX_ATTEMPT_RECORDS) s.meta.attempts.splice(0, s.meta.attempts.length - MAX_ATTEMPT_RECORDS);
}

/** Seed of an attempt: derived from the previous seed and the attempt number (deterministic). */
function attemptSeed(seed: number, attempt: number): number {
  let h = (seed ^ Math.imul(attempt, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Replace the whole state with a fresh game of `missionId` (in place: reducers
 * mutate the draft). Kept: seats (incl. player names), attempt history, calendar
 * speed, and the id counter (ids keep counting, so ids held by a station's UI
 * from the previous attempt never point at new objects). Attempt number +1.
 */
function freshAttempt(s: GameState, missionId: string, phase: 'lobby' | 'planning'): void {
  const attempt = s.meta.attempt + 1;
  const fresh = createGame(attemptSeed(s.meta.seed, attempt), missionId);
  fresh.meta.seats = s.meta.seats;
  fresh.meta.attempts = s.meta.attempts;
  fresh.meta.attempt = attempt;
  fresh.meta.nextId = s.meta.nextId;
  fresh.meta.phase = phase;
  fresh.clock.daysPerSecond = s.clock.daysPerSecond;
  fresh.clock.running = phase === 'planning';
  const target = s as unknown as Record<string, unknown>;
  for (const k of Object.keys(target)) if (!(k in fresh)) delete target[k];
  Object.assign(target, fresh);
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

  // ------------------------------------------------------------ attempts

  /**
   * Record the finished attempt in s.meta.attempts (score computed here from the
   * state + outcome). No-op before the mission ended or when already recorded, so
   * every station may dispatch it when its result screen opens.
   */
  recordAttempt(s, _ctx, outcome: AttemptOutcome) {
    record(s, outcome);
  },
  /**
   * Try again: a fresh game of the same mission for the whole table, straight into
   * planning with the calendar running. Records the ended attempt first if
   * `outcome` is given and it is not recorded yet. No-op in the lobby.
   */
  restart(s, _ctx, outcome?: AttemptOutcome) {
    if (s.meta.phase === 'lobby') return;
    record(s, outcome);
    freshAttempt(s, s.meta.missionId, 'planning');
  },
  /**
   * Back to mission choice: a fresh game of the same mission in the lobby phase
   * (seats kept, calendar stopped). Records the ended attempt first like restart.
   * Each browser at a station returns to the lobby screen (core/store.ts).
   */
  returnToLobby(s, _ctx, outcome?: AttemptOutcome) {
    if (s.meta.phase === 'lobby') return;
    record(s, outcome);
    freshAttempt(s, s.meta.missionId, 'lobby');
  },
  /** Lobby only: switch the mission (fresh game of it; seats and history kept). Unknown ids are ignored. */
  setMission(s, _ctx, missionId: string) {
    if (s.meta.phase !== 'lobby' || missionId === s.meta.missionId) return;
    if (!MISSIONS.some((m) => m.id === missionId)) return;
    freshAttempt(s, missionId, 'lobby');
  },
});
