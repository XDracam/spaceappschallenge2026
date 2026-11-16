// Procurement UI-local state (never shared): selection, filters, open view, dialogs.
import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { createStore, useStore } from '../../../core/createStore';
import type { NewsItem, PartKind, DeliveryOptionId, OrderDraft, Task } from '../../../core/model';
import { getState, onConfirmedAction, onGameReset, syncStore, useGame } from '../../../core/store';
import { DRAFT_PREFIX, type PView } from '../rules';
import { partStatus } from '../../planner/derive';
import { allParts } from '../../planner/model/rocketUtils';

export type View = 'catalogue' | 'contracts' | 'research';
export type Category = 'all' | 'propulsion' | 'tanks' | 'instruments' | 'power' | 'comms' | 'landing' | 'protection';

export const CATEGORIES: { id: Category; label: string; kinds: PartKind[] }[] = [
  { id: 'all', label: 'All', kinds: [] },
  { id: 'propulsion', label: 'Engines', kinds: ['engine'] },
  { id: 'tanks', label: 'Tanks', kinds: ['tank'] },
  { id: 'instruments', label: 'Instruments', kinds: ['instrument'] },
  { id: 'power', label: 'Power', kinds: ['power'] },
  { id: 'comms', label: 'Antennas', kinds: ['antenna'] },
  { id: 'landing', label: 'Landing & entry', kinds: ['legs', 'heatShield'] },
  { id: 'protection', label: 'Protection', kinds: ['radShield', 'heatProtection'] },
];

export function categoryOf(kind: PartKind): Category {
  return CATEGORIES.find((c) => c.kinds.includes(kind))?.id ?? 'all';
}

export interface Focus { taskId: string; criterionId: string }

export type Dialog =
  | { type: 'order'; draft: OrderDraft; token: string }
  /** Switch a need from an active contract to another offer (cancel + sign in one step). */
  | { type: 'replace'; contractId: string; draft: OrderDraft; token: string }
  | { type: 'cancel'; contractId: string }
  | { type: 'amend'; contractId: string; delivery: DeliveryOptionId; token: string }
  | { type: 'facility'; facilityId: string; months: number | 'buy' }
  | { type: 'team'; offerId: string }
  | null;

export interface UiState {
  view: View;
  category: Category;
  query: string;
  matchesOnly: boolean;
  focus: Focus | null;
  /** Right panel: the selected Resource, or the focused need's overview. */
  inspect: 'resource' | 'need';
  /** Explicitly selected catalogue Resource; null leaves the decision panel empty. */
  resourceId: string | null;
  offerId: string | null;
  /** Need chosen in the resource inspector ('' = the focused or first uncovered fitting need). */
  target: string;
  contractId: string | null;
  amendmentPreview: { contractId: string; delivery: DeliveryOptionId } | null;
  /** Delivery chosen in the resource inspector; null = the one the offer is best ordered with. */
  delivery: DeliveryOptionId | null;
  dialog: Dialog;
  newsOpen: boolean;
  status: string;
  pending: boolean;
}

function initialUi(): UiState {
  return {
    view: 'catalogue',
    category: 'all',
    query: '',
    matchesOnly: false,
    focus: null,
    inspect: 'resource',
    resourceId: null,
    offerId: null,
    target: '',
    contractId: null,
    amendmentPreview: null,
    delivery: null,
    dialog: null,
    newsOpen: false,
    status: '',
    pending: false,
  };
}

export const ui = createStore<UiState>(initialUi());

// A new attempt (restart, back to the lobby, another mission, a resumed save): nothing selected survives.
onGameReset(() => { clearTimeout(statusTimer); ui.set(initialUi()); });

export function useUi<S>(sel: (u: UiState) => S): S {
  return useStore(ui, sel);
}
export function setUi(patch: Partial<UiState>): void {
  const current = ui.get();
  const changingContract = patch.contractId !== undefined && patch.contractId !== current.contractId;
  ui.set({ ...current, ...(changingContract ? { amendmentPreview: null } : {}), ...patch });
}

/** Encodes a criterion target as one select value. */
export const targetKey = (taskId: string, criterionId: string) => `${taskId}::${criterionId}`;
export function parseTarget(v: string): Focus | null {
  if (!v) return null;
  const [taskId, criterionId] = v.split('::');
  return { taskId, criterionId };
}

// ------------------------------------------------------------ shared state view

/** The Planner's draft parts as preview Tasks (ids `draft:<partId>`), so Procurement can prepare before the order. */
function draftTasks(s: ReturnType<typeof getState>): Task[] {
  return allParts(s.planner.rocket).filter((l) => partStatus(s, l.part.id) === 'draft').map(({ part, stage, role }) => ({
    id: `${DRAFT_PREFIX}${part.id}`, revision: 0, authorRole: 'planner', title: part.name,
    criteria: [{ id: 'c', label: part.name, partKind: part.kind, variant: part.variant, minimums: { ...part.stats }, quantity: role === 'engine' && stage ? Math.max(1, stage.engineCount) : 1 }],
    neededAt: s.planner.plan.launchDay, priority: 'normal', status: 'open', partId: part.id, beyondResearch: [], createdAt: 0, updatedAt: 0,
  }));
}

/** Core reducers preserve unchanged branch identities. Subscribe to the actual dependencies. */
export function usePView(): PView {
  const market = useGame(s => s.market);
  const budget = useGame(s => s.budget);
  const limits = useGame(s => s.research.limits);
  const unlocked = useGame(s => s.research.unlocked);
  const projects = useGame(s => s.research.projects);
  const day = useGame(s => Math.floor(s.clock.day));
  const launchDay = useGame(s => s.planner.plan.launchDay);
  const rocket = useGame(s => s.planner.rocket);
  const industry = useGame(s => s.comms.trust.industry);
  // draftTasks reads rocket, market coverage and launchDay; it does not need calendar ticks.
  const drafts = useMemo(() => draftTasks(getState()), [rocket, market, launchDay]);
  return useMemo(() => ({ market, budget, research: { limits, unlocked, projects }, clock: { day },
    planner: { plan: { launchDay } }, comms: { trust: { industry } }, drafts,
  }), [market, budget, limits, unlocked, projects, day, launchDay, industry, drafts]);
}

export function useNews(limit = 40): NewsItem[] {
  const news = useGame(s => s.events.news);
  return useMemo(() => news.slice(0, limit), [news, limit]);
}

// Feedback comes from the ordered host echo, never from optimistic client state.
let statusTimer: ReturnType<typeof setTimeout> | undefined;
function feedback(status: string): void {
  clearTimeout(statusTimer);
  setUi({ status, pending: false });
  statusTimer = setTimeout(() => setUi({ status: '' }), 12000);
}
onConfirmedAction(({ previous, state, action, local }) => {
  if (!local || !ui.get().pending || !action.type.startsWith('procurement/')) return;
  const known = new Set(previous.events.news.map(n => n.id));
  const result = state.events.news.find(n => n.from === 'procurement' && !known.has(n.id));
  feedback(result?.text ?? 'No change was made. Review the current availability and try again.');
});
syncStore.subscribe(() => {
  if (!ui.get().pending) return;
  const sync = syncStore.get();
  if (!sync.connected || sync.error) feedback(sync.error || 'Connection lost. Reconnect and check the current state before trying again.');
});

/** Close review before dispatch: solo actions can be confirmed synchronously. */
export function submitAction(action: () => void): void {
  if (ui.get().pending) return;
  const sync = syncStore.get();
  if (!sync.connected) { feedback('Waiting for the host. Reconnect before making changes.'); return; }
  clearTimeout(statusTimer);
  setUi({ dialog: null, amendmentPreview: null, pending: true, status: 'Waiting for host confirmation…' });
  // A snapshot may replace an unacknowledged action; never leave a permanent success or spinner.
  statusTimer = setTimeout(() => feedback('Confirmation not received. Check the current Contracts or Research needs before trying again.'), 15000);
  action();
}

export const PCtx = createContext<PView>(null as unknown as PView);
export function useP(): PView {
  return useContext(PCtx);
}
