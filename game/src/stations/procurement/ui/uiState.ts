// Procurement UI-local state (never shared): selection, filters, open view, dialogs.
import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { createStore, useStore } from '../../../core/createStore';
import type { NewsItem, PartKind, DeliveryOptionId, OrderDraft, Task } from '../../../core/model';
import { getState, onGameReset, useGame } from '../../../core/store';
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
  | null;

export interface UiState {
  view: View;
  category: Category;
  query: string;
  matchesOnly: boolean;
  focus: Focus | null;
  /** Right panel: the selected Resource, or the focused need's overview. */
  inspect: 'resource' | 'need';
  /** Selected catalogue Resource (null: the first one of the open category). */
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
  };
}

export const ui = createStore<UiState>(initialUi());

// A new attempt (restart, back to the lobby, another mission, a resumed save): nothing selected survives.
onGameReset(() => ui.set(initialUi()));

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

/**
 * Snapshot of the shared state procurement reads. Selected as JSON so the station
 * re-renders only when these parts change (the host ticks 4×/s; the calendar day
 * is floored).
 */
export function usePView(): PView {
  const json = useGame((s) => JSON.stringify({
    market: s.market,
    budget: s.budget,
    research: { limits: s.research.limits, unlocked: s.research.unlocked, projects: s.research.projects },
    clock: { day: Math.floor(s.clock.day) },
    planner: { plan: { launchDay: s.planner.plan.launchDay } },
    comms: { trust: { industry: s.comms.trust.industry } },
    drafts: draftTasks(s),
  }));
  return useMemo(() => JSON.parse(json) as PView, [json]);
}

export function useNews(limit = 40): NewsItem[] {
  const json = useGame((s) => JSON.stringify(s.events.news.slice(0, limit)));
  return useMemo(() => JSON.parse(json) as NewsItem[], [json]);
}

export const PCtx = createContext<PView>(null as unknown as PView);
export function useP(): PView {
  return useContext(PCtx);
}
