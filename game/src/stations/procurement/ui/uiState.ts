// Procurement UI-local state (never shared): selection, filters, open view, dialogs.
import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { createStore, useStore } from '../../../core/createStore';
import type { NewsItem, PartKind, DeliveryOptionId, OrderDraft, Criterion, Destination } from '../../../core/model';
import { useGame } from '../../../core/store';
import type { PView } from '../rules';

export type View = 'catalogue' | 'calls' | 'contracts' | 'compare';
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
  | { type: 'sign'; offerId: string; taskId?: string; criterionId?: string; qty: number }
  | { type: 'cancel'; contractId: string }
  | { type: 'order'; draft: OrderDraft; token: string }
  | { type: 'amend'; contractId: string; delivery: DeliveryOptionId; token: string }
  | null;

export interface UiState {
  view: View;
  category: Category;
  query: string;
  sort: 'featured' | 'price' | 'arrival' | 'reliability';
  matchesOnly: boolean;
  hideLocked: boolean;
  focus: Focus | null;
  /** Right panel: the selected Resource, or the focused need's overview. */
  inspect: 'resource' | 'need';
  resourceId: string | null;
  offerId: string | null;
  /** Allocation target chosen in the inspector ('' = unallocated). */
  target: string;
  /** Quantity override in the inspector (0 = the target's uncovered quantity). */
  qty: number;
  compare: string[];
  contractId: string | null;
  callId: string | null;
  callTarget: string;
  delivery: DeliveryOptionId;
  neededAt: number | null;
  callWindow: 7 | 14 | 30;
  callResourceId: string | null;
  callSnapshot: { criterion: Criterion; destination: Destination; neededAt?: number } | null;
  dialog: Dialog;
  newsOpen: boolean;
  status: string;
}

export const ui = createStore<UiState>({
  view: 'catalogue',
  category: 'all',
  query: '',
  sort: 'featured',
  matchesOnly: false,
  hideLocked: false,
  focus: null,
  inspect: 'resource',
  resourceId: 'e-ker-2000',
  offerId: null,
  target: '',
  qty: 0,
  compare: [],
  contractId: null,
  callId: null,
  callTarget: '',
  delivery: 'standard',
  neededAt: null,
  callWindow: 14,
  callResourceId: null,
  callSnapshot: null,
  dialog: null,
  newsOpen: false,
  status: '',
});

export function useUi<S>(sel: (u: UiState) => S): S {
  return useStore(ui, sel);
}
export function setUi(patch: Partial<UiState>): void {
  ui.set({ ...ui.get(), ...patch });
}

/** Encodes a criterion target as one select value. */
export const targetKey = (taskId: string, criterionId: string) => `${taskId}::${criterionId}`;
export function parseTarget(v: string): Focus | null {
  if (!v) return null;
  const [taskId, criterionId] = v.split('::');
  return { taskId, criterionId };
}

// ------------------------------------------------------------ shared state view

/**
 * Snapshot of the shared state procurement reads. Selected as JSON so the station
 * re-renders only when these parts change (the host ticks 4×/s; the calendar day
 * is floored).
 */
export function usePView(): PView {
  const json = useGame((s) => JSON.stringify({
    market: s.market,
    budget: s.budget,
    research: { limits: s.research.limits, unlocked: s.research.unlocked },
    clock: { day: Math.floor(s.clock.day) },
    planner: { plan: { launchDay: s.planner.plan.launchDay } },
    comms: { trust: { industry: s.comms.trust.industry } },
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
