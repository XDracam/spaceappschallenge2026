// Shared UI helpers: UI-local state, id generation, formatting, icons.
import type { ComponentChildren, RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import type { BodyId, Branch, Evaluation, FlightState, PlannerGame, ManeuverResult, PartState, Vec2 } from '../model/types';
import { onGameReset } from '../../../core/store';
import { createStore, useStore } from '../../../core/createStore';
import { getPlanner, uiId, uiStore } from '../state/store';
import { bodyById } from '../data/bodies';
import { allParts, findPart } from '../model/rocketUtils';
import { formatMoneyM } from '../../../shared/format';
import { formatDay } from '../model/units';

export const BRANCH_COLORS = ['#3fc7ff', '#b98cff', '#ffaa5c', '#3fe0a0'];
export function branchColor(index: number): string {
  return BRANCH_COLORS[((index % BRANCH_COLORS.length) + BRANCH_COLORS.length) % BRANCH_COLORS.length];
}

// ------------------------------------------------------------ layout constants (keep in sync with styles.css)

export const HEADER_H = 76;
export const EDGE = 16;
export const PANEL_W = 340;
export const CARDS_H = 164;
export const PLAYBACK_W = 360;

export interface Insets { top: number; right: number; bottom: number; left: number }

// ------------------------------------------------------------ UI-local store

interface LocalUi {
  /** Part to highlight in the Rocket tab (requested from the issues list). */
  highlightPartId: string | null;
  highlightNonce: number;
  /** Screen point of the last maneuverEdit popup (to return to it from the heat map). */
  lastEditScreen: Vec2 | null;
  /** Right floating panel visible. */
  panelOpen: boolean;
  /** Accordion state of the Rocket panel. */
  openStageId: string | null;
  openPartId: string | null;
  openSpacecraftId: string | null;
  /** Px of the viewport covered by floating UI (map fits into the rest). */
  insets: Insets;
}

const initialLocalUi = (): LocalUi => ({
  highlightPartId: null, highlightNonce: 0, lastEditScreen: null,
  panelOpen: true, openStageId: null, openPartId: null, openSpacecraftId: null,
  insets: { top: HEADER_H, right: PANEL_W + EDGE * 2, bottom: CARDS_H + EDGE * 2, left: 0 },
});
export const localUi = createStore<LocalUi>(initialLocalUi());
onGameReset(() => localUi.set(initialLocalUi()));

export function useLocalUi<S>(selector: (s: LocalUi) => S): S {
  return useStore(localUi, selector);
}

/** Open the right panel on a tab; clicking the tab that is already open collapses the panel. */
export function toggleTab(tab: 'rocket' | 'tasks' | 'versions') {
  const open = localUi.get().panelOpen;
  const cur = uiStore.get().sideTab;
  if (open && cur === tab) {
    localUi.update((s) => { s.panelOpen = false; });
    return;
  }
  uiStore.update((u) => { u.sideTab = tab; });
  localUi.update((s) => { s.panelOpen = true; });
}

/** Open the right panel on a tab (never closes it; the panel's × does that). */
export function openTab(tab: 'rocket' | 'tasks' | 'versions') {
  uiStore.update((u) => { u.sideTab = tab; });
  localUi.update((s) => { s.panelOpen = true; });
}

let highlightTimer: ReturnType<typeof setTimeout> | undefined;
export function highlightPart(partId: string) {
  uiStore.update((u) => {
    u.sideTab = 'rocket';
  });
  const loc = findPart(getPlanner().rocket, partId);
  localUi.update((s) => {
    s.panelOpen = true;
    s.highlightPartId = partId;
    s.highlightNonce++;
    s.openPartId = partId;
    if (loc?.stage) s.openStageId = loc.stage.id;
  });
  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    localUi.update((s) => {
      s.highlightPartId = null;
    });
  }, 2600);
}

/** Close a popover on a pointer-down outside `ref` or on Escape. */
export function useOutsideClose(ref: RefObject<HTMLElement>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
}

// ------------------------------------------------------------ ids

/** Unique ids for maneuvers / branches created from the UI (passed to the shared reducers). */
export const newId = uiId;

// ------------------------------------------------------------ map container

let mapContainer: HTMLElement | null = null;
export function setMapContainer(el: HTMLElement | null) {
  mapContainer = el;
}
export function mapCentre(): Vec2 {
  if (!mapContainer) return { x: 300, y: 200 };
  const i = localUi.get().insets;
  return {
    x: (i.left + mapContainer.clientWidth - i.right) / 2,
    y: (i.top + mapContainer.clientHeight - i.bottom) / 2 - 60,
  };
}

let popupReturnTarget: HTMLElement | null = null;
/** Capture the originating DOM control before a store update replaces focused menu content. */
export function rememberPopupFocus() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body && !active.closest('.popup')) popupReturnTarget = active;
}
export function restorePopupFocus() {
  if (uiStore.get().popup) return;
  const branch = uiStore.get().selectedBranchId;
  const continuation = [...document.querySelectorAll<HTMLButtonElement>('.st-planner .route-actions button')]
    .find((button) => button.dataset.branchId === branch);
  const target = popupReturnTarget?.isConnected ? popupReturnTarget
    : continuation ?? document.querySelector<HTMLElement>('.st-planner .route-actions button, .st-planner .route-editor summary');
  target?.focus({ preventScroll: true });
  popupReturnTarget = null;
}

export function openManeuverEdit(maneuverId: string, branchId?: string, screen?: Vec2) {
  rememberPopupFocus();
  uiStore.update((u) => {
    u.selectedManeuverId = maneuverId;
    if (branchId) u.selectedBranchId = branchId;
    u.popup = { kind: 'maneuverEdit', maneuverId, screen: screen ?? mapCentre() };
  });
}

export function closePopup() {
  uiStore.update((u) => {
    u.popup = null;
    u.mapDay = null;
  });
}

// ------------------------------------------------------------ formatting

export function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 10000) return Math.round(v).toLocaleString('en-US');
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  if (a === 0) return '0';
  return v.toPrecision(2);
}

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** Reliability-style percentage: one decimal between 99 % and 100 %. */
export function pctFine(x: number): string {
  return x > 0.99 && x < 1 ? `${(x * 100).toFixed(1)}%` : pct(x);
}

export function chanceClass(c: number): 'ok' | 'warn' | 'err' {
  return c >= 0.8 ? 'ok' : c >= 0.4 ? 'warn' : 'err';
}

export const PART_STATE_LABEL: Record<PartState, string> = {
  draft: 'Draft', ordered: 'Ordered', contracted: 'Contracted', delivered: 'Delivered', late: 'Late',
};

export function bodyName(id: BodyId): string {
  return bodyById(id)?.name ?? id;
}

export function describeState(s: FlightState | undefined, startISO: string): string {
  if (!s) return 'Unknown state';
  switch (s.kind) {
    case 'surface': return `On ${bodyName(s.body)} · ${formatDay(s.day, startISO)}`;
    case 'orbit': return `${bodyName(s.body)} orbit ${fmtNum(s.altitudeKm)} km · ${formatDay(s.day, startISO)}`;
    case 'approach': return `Approaching ${bodyName(s.body)} · ${formatDay(s.day, startISO)}`;
    case 'lost': return `Lost: ${s.reason}`;
  }
}

export function findResult(ev: Evaluation, maneuverId: string): ManeuverResult | undefined {
  for (const b of ev.branches) {
    const r = b.maneuvers.find((m) => m.maneuverId === maneuverId);
    if (r) return r;
  }
  return undefined;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Real (wall-clock) duration: "7:40", "1:02:05". */
export function formatRealTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Whole millions: "195 M", "1.20 B". */
export function fmtMoneyShort(m: number): string {
  return formatMoneyM(m, { decimals: 0, billions: true });
}

/** "1 part" / "3 parts". */
export function plural(n: number, word: string, many = `${word}s`): string {
  return `${n} ${n === 1 ? word : many}`;
}

/** Launch readiness of the parts in the design. */
export interface Readiness {
  /** Parts still in draft (not ordered). */
  draft: number;
  /** Parts ordered (task sent or contracted) but not delivered. */
  ordered: number;
  /** Running contracts that deliver after the launch date (evaluation 'delivery' errors). */
  late: number;
  /** All parts that are not delivered. */
  notDelivered: number;
}

export function partReadiness(game: PlannerGame, ev: Evaluation): Readiness {
  let draft = 0;
  let ordered = 0;
  for (const { part } of allParts(game.rocket)) {
    if (part.state === 'draft') draft++;
    else if (part.state !== 'delivered') ordered++;
  }
  const late = ev.issues.filter((i) => i.code === 'delivery' && i.severity === 'error').length;
  return { draft, ordered, late, notDelivered: draft + ordered };
}

/** Name to show for a branch: the root ("Main") shows its spacecraft, e.g. "Orbiter + Lander". */
export function branchDisplayName(game: PlannerGame, branch: Branch): string {
  if (branch.parent) return branch.name;
  const names = branch.spacecraftIds
    .map((id) => game.rocket.spacecraft.find((s) => s.id === id)?.name)
    .filter((n): n is string => !!n);
  return names.length ? names.join(' + ') : branch.name;
}

// ------------------------------------------------------------ icons

function Svg({ children, size = 14, title }: { children: ComponentChildren; size?: number; title?: string }) {
  return (
    <svg class="icon" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden={title ? undefined : 'true'}>
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export const LockIcon = ({ title }: { title?: string }) => (
  <Svg title={title} size={12}><rect x="3.5" y="7" width="9" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></Svg>
);
export const ErrorIcon = () => (
  <Svg><circle cx="8" cy="8" r="6.2" /><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" /></Svg>
);
export const WarnIcon = () => (
  <Svg><path d="M8 2.2l6.2 11H1.8z" /><path d="M8 6.5v3M8 11.6v.1" /></Svg>
);
export const InfoIcon = () => (
  <Svg><circle cx="8" cy="8" r="6.2" /><path d="M8 7.3v4M8 4.8v.1" /></Svg>
);
export const PlayIcon = () => (
  <svg class="icon" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5l9.5 5.5L4 13.5z" fill="currentColor" /></svg>
);
export const PauseIcon = () => (
  <svg class="icon" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" fill="currentColor" /><rect x="9.5" y="2.5" width="3" height="11" fill="currentColor" /></svg>
);
export const CloseIcon = () => (
  <Svg size={12}><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></Svg>
);
export const CheckIcon = () => (
  <Svg><path d="M3 8.5l3.2 3.2L13 4.8" /></Svg>
);

export const GearIcon = () => (
  <Svg size={16}><circle cx="8" cy="8" r="2.2" /><path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M3.5 12.5l1.3-1.3M11.2 4.8l1.3-1.3" /><circle cx="8" cy="8" r="4.6" /></Svg>
);
export const PlusIcon = () => (
  <Svg size={14}><path d="M8 3v10M3 8h10" /></Svg>
);
export const ChevronIcon = ({ open }: { open?: boolean }) => (
  <span class={`chev${open ? ' open' : ''}`}><Svg size={12}><path d="M6 3.5l4.5 4.5L6 12.5" /></Svg></span>
);
export const TrashIcon = () => (
  <Svg size={13}><path d="M2.8 4.2h10.4M6.2 4.2V2.6h3.6v1.6M4.2 4.2l.7 9.2h6.2l.7-9.2M6.8 6.8v4.4M9.2 6.8v4.4" /></Svg>
);
export const RestoreIcon = () => (
  <Svg size={13}><path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.8" /><path d="M2.6 2.4v2.8h2.8" /></Svg>
);
export const ArrowUpIcon = () => <Svg size={12}><path d="M8 13V3M4 7l4-4 4 4" /></Svg>;
export const ArrowDownIcon = () => <Svg size={12}><path d="M8 3v10M4 9l4 4 4-4" /></Svg>;
export const HeatIcon = () => (
  <Svg size={13}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></Svg>
);

/** Small icon per maneuver type (menu and edit popup). */
export function ManeuverIcon({ type }: { type: string }) {
  switch (type) {
    case 'launch':
      return <Svg size={16}><path d="M8 1.8c2 1.6 3 3.8 3 6.4v2.6H5V8.2c0-2.6 1-4.8 3-6.4z" /><path d="M5 9.6l-2 2.6h2M11 9.6l2 2.6h-2M7 13.2l1 1.4 1-1.4" /></Svg>;
    case 'transfer':
      return <Svg size={16}><circle cx="3.5" cy="12" r="1.5" /><circle cx="12.5" cy="4" r="1.5" /><path d="M4.6 10.8C6 6.6 8.4 4.6 11 4.1" stroke-dasharray="2 1.6" /></Svg>;
    case 'flyby':
      return <Svg size={16}><circle cx="9.5" cy="8" r="2.4" /><path d="M1.8 13.5c4-.4 6.6-2 6.4-4.4M8.2 9.1C7.9 6.7 9.6 4 14 2.6" /></Svg>;
    case 'changeOrbit':
      return <Svg size={16}><circle cx="8" cy="8" r="1.6" /><circle cx="8" cy="8" r="4" /><circle cx="8" cy="8" r="6.4" stroke-dasharray="2 1.6" /></Svg>;
    case 'insertion':
      return <Svg size={16}><circle cx="8" cy="8" r="2" /><path d="M8 2.2A5.8 5.8 0 1 1 2.4 9.5" /><path d="M1.4 6.6l1 2.9 2.8-1.1" /></Svg>;
    case 'land':
      return <Svg size={16}><path d="M8 2v8M5 7l3 3 3-3M2.5 13.5h11" /></Svg>;
    case 'ascent':
      return <Svg size={16}><path d="M8 11V3M5 6l3-3 3 3M2.5 13.5h11" /></Svg>;
    case 'separate':
      return <Svg size={16}><path d="M8 14V8.5M8 8.5L3.5 3M8 8.5L12.5 3M2.6 5.2L3.5 3l2.2.4M13.4 5.2L12.5 3l-2.2.4" /></Svg>;
    case 'entry':
      return <Svg size={16}><path d="M3 3l6.5 6.5" /><path d="M10.6 7.4a3 3 0 1 1-3.2 3.2" /><path d="M5 9.5L3.5 12.5 6.5 11" /></Svg>;
    default:
      return <Svg size={16}><circle cx="8" cy="8" r="5" /></Svg>;
  }
}

export function SeverityIcon({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  return (
    <span class={`sev sev-${severity}`}>
      {severity === 'error' ? <ErrorIcon /> : severity === 'warning' ? <WarnIcon /> : <InfoIcon />}
    </span>
  );
}
