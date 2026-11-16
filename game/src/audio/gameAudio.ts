// Browser-local audio. Feedback follows accepted actions, never reducers or snapshots.
import { createStore } from '../core/createStore';
import { confirmedGameStore, gameStore, onConfirmedAction, onGameReset, syncStore, type ConfirmedActionEvent } from '../core/store';
import type { GameState } from '../core/state';
import { computeMissionResult, isScrubbed, missionScore } from '../stations/planner/result';
import { TECH_BY_ID } from '../stations/science/data/techs';

type Cue = 'attention' | 'confirmation' | 'completion' | 'launch' | 'achievement' | 'setback';
interface Preferences { muted: boolean; effects: number; music: number }
interface AudioState extends Preferences { error: string; storageFailed: boolean }
const STORAGE_KEY = 'mission-control-audio-settings-v1';
const defaults: Preferences = { muted: false, effects: 0.4, music: 0.15 };
function load(): Preferences {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!s || typeof s !== 'object') return defaults;
    const volume = (v: unknown, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
    return { muted: s.muted === true, effects: volume(s.effects, defaults.effects), music: volume(s.music, defaults.music) };
  } catch { return defaults; }
}
export const audioState = createStore<AudioState>({ ...load(), error: '', storageFailed: false });
const source = (name: string) => `${import.meta.env.BASE_URL}audio/${name}.mp3`;
const priorities: Record<Cue, number> = { confirmation: 1, attention: 2, completion: 3, setback: 4, launch: 5, achievement: 6 };
const sounds = new Map<Cue, HTMLAudioElement>();
let music: HTMLAudioElement | null = null;
let active: { cue: Cue; node: HTMLAudioElement } | null = null;
let unlocked = false;
let installed = false;
let eligibleResult: string | null = null;
let lastPlayed = new Map<Cue, number>();
const keyOf = (s: GameState) => `${s.meta.missionId}|${s.meta.seed}|${s.meta.attempt}`;
const visible = () => document.visibilityState === 'visible';
const connected = () => syncStore.get().role !== 'client' || syncStore.get().connected;

function makeAudio(name: string, preload: 'auto' | 'metadata'): HTMLAudioElement {
  const node = new Audio(source(name));
  node.preload = preload;
  node.hidden = true;
  // Keep media attached: the in-app browser interrupts detached Audio objects.
  document.body.append(node);
  return node;
}
function message(error: string): void {
  if (audioState.get().error !== error) audioState.update(s => { s.error = error; });
}
function updateLevels(): void {
  const settings = audioState.get();
  if (active) active.node.volume = settings.effects;
  if (music) music.volume = settings.music * (active && priorities[active.cue] >= 4 ? 0.2 : 1);
}
function stopEffect(): void {
  const previous = active;
  active = null;
  if (previous) { previous.node.pause(); previous.node.currentTime = 0; }
  updateLevels();
}
function updateMusic(): void {
  if (!music) return;
  const s = audioState.get();
  const phase = confirmedGameStore.get().meta.phase;
  const wanted = unlocked && !s.muted && s.music > 0 && visible() && connected() && (phase === 'lobby' || phase === 'planning');
  updateLevels();
  if (!wanted) { music.pause(); return; }
  if (!music.paused) return;
  void music.play().then(() => message('')).catch(error => {
    if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') message('Music could not load. Reload to retry.');
  });
}
export function setAudioPreferences(patch: Partial<Preferences>): void {
  audioState.update(s => {
    if (patch.muted !== undefined) s.muted = patch.muted;
    for (const k of ['effects', 'music'] as const) {
      const v = patch[k];
      if (typeof v === 'number' && Number.isFinite(v)) s[k] = Math.max(0, Math.min(1, v));
    }
  });
  const { muted, effects, music: musicVolume } = audioState.get();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted, effects, music: musicVolume }));
    if (audioState.get().storageFailed) audioState.update(s => { s.storageFailed = false; });
  }
  catch { audioState.update(s => { s.storageFailed = true; }); }
  if (muted || effects === 0) stopEffect();
  updateLevels();
  updateMusic();
}
function play(cue: Cue): void {
  const prefs = audioState.get();
  if (!unlocked || prefs.muted || prefs.effects === 0 || !visible() || !connected()) return;
  const now = performance.now();
  const cooldown = cue === 'confirmation' ? 120 : 1000;
  if (now - (lastPlayed.get(cue) ?? -Infinity) < cooldown) return;
  if (active && !active.node.ended && !active.node.paused && priorities[active.cue] > priorities[cue]) return;
  stopEffect();
  const node = sounds.get(cue);
  if (!node) return;
  lastPlayed.set(cue, now);
  node.currentTime = 0;
  active = { cue, node };
  updateLevels();
  void node.play().then(() => message('')).catch(error => {
    if (active?.node !== node || error.name === 'AbortError') return;
    active = null;
    updateLevels();
    if (error.name !== 'NotAllowedError') message('A sound could not load. Reload to retry.');
  });
}

/** Called when the planner actually reveals its result; other stations reveal at launch. */
export function playMissionResult(): void {
  const s = confirmedGameStore.get();
  if (eligibleResult !== keyOf(s)) return;
  eligibleResult = null; // A muted/background/reopened result must never replay later.
  const score = missionScore(computeMissionResult(s));
  play(score.scrubbed || score.achieved === 0 ? 'setback' : score.total > 0 && score.achieved === score.total ? 'achievement' : 'completion');
}

function acceptedCommit({ previous: before, state: after, action }: ConfirmedActionEvent): boolean {
  switch (action.type) {
    case 'procurement/signOrder': case 'procurement/signOffer': case 'procurement/replaceContract':
      return after.market.contracts.some(c => !before.market.contracts.some(old => old.id === c.id));
    case 'procurement/amendDelivery': case 'procurement/cancelContract':
      return after.market.contracts.some(c => c.id === action.args[0] && before.market.contracts.some(old => old.id === c.id && old.revision !== c.revision));
    case 'procurement/openCall': return after.market.calls.length > before.market.calls.length;
    case 'procurement/allocate': return after.market.allocations !== before.market.allocations;
    case 'science/startTech': case 'science/startTest':
      return after.research.projects.some(p => p.id === action.args[0] && !before.research.projects.some(old => old.id === p.id));
    case 'comms/answer':
      return after.comms.inbox.some(i => i.instanceId === action.args[0] && i.status === 'answered' && before.comms.inbox.some(old => old.instanceId === i.instanceId && old.status === 'open'));
    case 'comms/startProject': return after.comms.projects.some(p => !before.comms.projects.some(old => old.instanceId === p.instanceId));
    case 'coordination/create': case 'coordination/edit': case 'coordination/setStatus': return after.coordination !== before.coordination;
    case 'planner/orderPart': case 'planner/orderAllParts': return after.market.tasks !== before.market.tasks;
    case 'planner/saveVersion': return after.planner.versions !== before.planner.versions;
    default: return false;
  }
}

function feedback(event: ConfirmedActionEvent): void {
  const { previous: before, state: after, action, local } = event;
  const station = syncStore.get().station;
  if (keyOf(before) !== keyOf(after)) return;
  if (before.meta.phase === 'planning' && after.meta.phase === 'launched') {
    eligibleResult = keyOf(after);
    if (!station) { eligibleResult = null; return; }
    if (station === 'planner') {
      if (!isScrubbed(computeMissionResult(after))) play('launch');
    } else playMissionResult();
    return;
  }
  if (!station || before.meta.phase !== 'planning' || after.meta.phase !== 'planning') return;
  // Collect one highest-value cue per accepted action/tick, not one per changed item.
  let cue: Cue | null = local && acceptedCommit(event) ? 'confirmation' : null;
  const raise = (next: Cue) => { if (!cue || priorities[next] > priorities[cue]) cue = next; };
  const assigned = after.coordination.some(task => {
    if (task.origin === 'effect' || task.status !== 'open' || task.assignee !== station || task.authorRole === station || action.by === station) return false;
    const old = before.coordination.find(t => t.id === task.id);
    return !old || old.assignee !== station || old.status !== 'open';
  });
  if (assigned) raise('attention');
  if (station === 'comms') {
    if (after.comms.inbox.some(i => i.status === 'open' && !before.comms.inbox.some(old => old.instanceId === i.instanceId))) raise('attention');
    if (before.comms.projects.some(p => !after.comms.projects.some(next => next.instanceId === p.instanceId))) raise('completion');
  }
  if (station === 'procurement' && after.market.calls.some(c => c.status === 'closed' && c.offerIds.length > 0 && before.market.calls.some(old => old.id === c.id && old.status === 'open'))) raise('attention');
  if (station === 'procurement' && after.market.contracts.some(c => c.status === 'delivered'
    && before.market.contracts.some(old => old.id === c.id && old.status === 'active')
    && before.market.allocations.some(a => a.contractId === c.id && a.status === 'reserved' && (a.taskId || a.department)))) raise('completion');
  if (station === 'science') {
    for (const p of after.research.projects) {
      if (!before.research.projects.some(old => old.id === p.id && old.status === 'running')) continue;
      if (p.status === 'succeeded') raise('completion');
      // Cancellation and invalidated part tests also use "failed"; those are not failed experiments.
      if (action.type === 'core/tick' && p.status === 'failed' && p.techId && TECH_BY_ID[p.techId] && !after.science.info[p.id]?.cancelled) raise('setback');
    }
  }
  if (cue) play(cue);
}

export function installGameAudio(): void {
  if (installed) return;
  installed = true;
  for (const cue of Object.keys(priorities) as Cue[]) {
    const node = makeAudio(cue, 'auto');
    node.onended = () => { if (active?.node === node) { active = null; updateLevels(); } };
    sounds.set(cue, node);
  }
  music = makeAudio('music', 'metadata');
  music.loop = true;
  const unlock = () => { if (!unlocked) { unlocked = true; updateMusic(); } };
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });
  document.addEventListener('visibilitychange', () => { if (!visible()) stopEffect(); updateMusic(); });
  gameStore.subscribe(updateMusic);
  let sync = syncStore.get();
  syncStore.subscribe(() => {
    const next = syncStore.get();
    if (sync.station !== next.station || sync.role !== next.role || !next.connected) { eligibleResult = null; stopEffect(); }
    sync = next;
    updateMusic();
  });
  onGameReset(() => { eligibleResult = null; lastPlayed = new Map(); stopEffect(); updateMusic(); });
  onConfirmedAction(feedback);
}
