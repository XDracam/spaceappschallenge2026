// Shared UI helpers: UI-local state, id generation, formatting, icons.
import type { ComponentChildren } from 'preact';
import type { BodyId, Evaluation, FlightState, ManeuverResult, PartState, Vec2 } from '../model/types';
import { createStore, useStore } from '../state/createStore';
import { uiStore } from '../state/store';
import { bodyById } from '../data/bodies';
import { formatDay } from '../model/units';

export const BRANCH_COLORS = ['#5fb3ff', '#c78bff', '#ffa657', '#4cc38a'];
export function branchColor(index: number): string {
  return BRANCH_COLORS[((index % BRANCH_COLORS.length) + BRANCH_COLORS.length) % BRANCH_COLORS.length];
}

// ------------------------------------------------------------ UI-local store

interface LocalUi {
  /** Part to highlight in the Rocket tab (requested from the issues list). */
  highlightPartId: string | null;
  highlightNonce: number;
  /** Screen point of the last maneuverEdit popup (to return to it from the heat map). */
  lastEditScreen: Vec2 | null;
}

export const localUi = createStore<LocalUi>({ highlightPartId: null, highlightNonce: 0, lastEditScreen: null });

export function useLocalUi<S>(selector: (s: LocalUi) => S): S {
  return useStore(localUi, selector);
}

let highlightTimer: ReturnType<typeof setTimeout> | undefined;
export function highlightPart(partId: string) {
  uiStore.update((u) => {
    u.sideTab = 'rocket';
  });
  localUi.update((s) => {
    s.highlightPartId = partId;
    s.highlightNonce++;
  });
  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    localUi.update((s) => {
      s.highlightPartId = null;
    });
  }, 2600);
}

// ------------------------------------------------------------ ids

let idCounter = 0;
/** Unique ids for maneuvers / branches created from the UI. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${idCounter++}`;
}

// ------------------------------------------------------------ map container

let mapContainer: HTMLElement | null = null;
export function setMapContainer(el: HTMLElement | null) {
  mapContainer = el;
}
export function mapCentre(): Vec2 {
  if (!mapContainer) return { x: 300, y: 200 };
  return { x: mapContainer.clientWidth / 2, y: mapContainer.clientHeight / 2 - 60 };
}

export function openManeuverEdit(maneuverId: string, branchId?: string, screen?: Vec2) {
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
  draft: 'Draft', sent: 'Task sent', contracted: 'Contracted', delivered: 'Delivered',
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

export function SeverityIcon({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  return (
    <span class={`sev sev-${severity}`}>
      {severity === 'error' ? <ErrorIcon /> : severity === 'warning' ? <WarnIcon /> : <InfoIcon />}
    </span>
  );
}
