// Shared bits for the comms UI: stakeholder meta, lookups, avatars, hint pills, effect wording.

import { affectedStations, effectStations } from '../../../shared/events/types';
import type { StakeholderHint } from '../../../shared/events/types';
import type { Character, Effect, EventDef, EventInstance, ProjectDef, StakeholderId, StationId } from '../model/types';
import { getState } from '../../../core/store';
import { contentOf } from '../state/world';
import { formatMoney, signed } from './format';

export const STAKEHOLDER_ORDER: StakeholderId[] = ['government', 'industry', 'public', 'partners'];

export const SH: Record<StakeholderId, { label: string; short: string; color: string }> = {
  government: { label: 'Government', short: 'Government', color: '#3fc7ff' },
  industry: { label: 'Industry', short: 'Industry', color: '#ffaa5c' },
  public: { label: 'Public / media', short: 'Public', color: '#ff7eb6' },
  partners: { label: 'Partners', short: 'Partners', color: '#3fe0a0' },
};

export const STATION_LABEL: Record<StationId, string> = {
  planner: 'planner', procurement: 'procurement', science: 'science', comms: 'comms',
};

/** Lookups in the comms content of the game's mission (s.meta.missionId). */
export const characterById = (id: string | undefined): Character | undefined =>
  id ? contentOf(getState()).characters.find((c) => c.id === id) : undefined;
export const eventById = (id: string): EventDef | undefined => contentOf(getState()).events.find((e) => e.id === id);
export const projectById = (id: string): ProjectDef | undefined => contentOf(getState()).projects.find((p) => p.id === id);

/** Character of an event instance (may be missing while content is a stub). */
export function eventCharacter(def: EventDef | undefined): Character | undefined {
  return def ? characterById(def.characterId) : undefined;
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && !/\.$/.test(w)).slice(0, 2).map((w) => w[0]).join('') || '?';
}

/** Stylised initials in a coloured glowing circle (no portrait art). */
export function Avatar({ character, size = 'md' }: { character?: Character; size?: 'sm' | 'md' | 'lg' }) {
  const color = character ? SH[character.stakeholder].color : '#8796b0';
  const initials = character ? character.initials || initialsOf(character.name) : '?';
  return (
    <div class={`ava ava-${size}`} style={{ '--c': color } as Record<string, string>} aria-hidden="true">
      <span>{initials}</span>
    </div>
  );
}

const ARROWS: Record<number, string> = { [-2]: '↓↓', [-1]: '↓', 1: '↑', 2: '↑↑' };

export function HintPill({ stakeholder, dir }: StakeholderHint) {
  return (
    <span class={`hint-pill ${dir > 0 ? 'up' : 'down'}`} title={`${SH[stakeholder].label}: ${dir > 0 ? 'likely improves' : 'likely worsens'}`}>
      {SH[stakeholder].short} {ARROWS[dir]}
    </span>
  );
}

export function HintPills({ hints }: { hints: StakeholderHint[] }) {
  if (!hints.length) return null;
  return <span class="hints">{hints.map((h) => <HintPill key={h.stakeholder} {...h} />)}</span>;
}

/** Trust deltas from authored numbers → hint direction (hints, not numbers). */
export function deltaToDir(delta: number): -2 | -1 | 1 | 2 {
  return delta >= 10 ? 2 : delta > 0 ? 1 : delta <= -10 ? -2 : -1;
}

export function trustHints(effects: { stakeholder: StakeholderId; delta: number }[]): StakeholderHint[] {
  return effects.filter((e) => e.delta !== 0).map((e) => ({ stakeholder: e.stakeholder, dir: deltaToDir(e.delta) }));
}

/**
 * Label for an internal-effect tag: "Affects procurement", "Affects shared budget", or null if external.
 * With costM, a budget effect is that cost (engine rule) and is shown as "costs N M" instead of a tag.
 */
export function internalTagText(effects: Effect[], costM?: number): string | null {
  const eff = costM ? effects.filter((e) => e.kind !== 'budget') : effects;
  const parts: string[] = [];
  if (eff.some((e) => e.kind === 'budget')) parts.push('shared budget');
  const stations = affectedStations(eff.filter((e) => e.kind !== 'budget'));
  parts.push(...stations.map((s) => STATION_LABEL[s]));
  return parts.length ? `Affects ${parts.join(', ')}` : null;
}

export function InternalTag({ effects, costM }: { effects: Effect[]; costM?: number }) {
  const t = internalTagText(effects, costM);
  return t ? <span class="tag-int" title="This choice changes things for your teammates' stations">{t}</span> : null;
}

/** An effect in plain words (without the station prefix). */
export function effectText(e: Effect): string {
  switch (e.kind) {
    case 'trust': return `${SH[e.stakeholder].label} trust ${signed(e.delta)}`;
    case 'budget': return `budget ${signed(e.deltaM, ' M')}`;
    case 'deliveryDelay': {
      const what = e.scope === 'next' ? 'next delivery' : 'deliveries';
      return e.months >= 0 ? `${what} ${signed(e.months, ' mo')}` : `${what} ${Math.abs(e.months)} mo earlier`;
    }
    case 'priceModifier': return `prices ${signed(e.pct, ' %')} for ${e.months} mo`;
    case 'offer': return `offer: ${e.variant} ${e.partKind} from ${e.supplier}, ${formatMoney(e.priceM)}, ${e.deliveryMonths} mo`;
    case 'researchPace': return `research pace ${signed(e.pct, ' %')} for ${e.months} mo`;
    case 'researchLimit': return `research limit ${e.key} → ${e.value}`;
    case 'unlock': return `unlocks ${e.key}`;
    case 'service': return `service: ${e.note}`;
    case 'missionConstraint': return `new requirement: ${e.text}`;
    case 'flag': return `${e.flag} ${e.on ? 'set' : 'cleared'}`;
    case 'eventOdds': return `“${e.tag}” events ${e.factor >= 1 ? 'likelier' : 'rarer'} (×${e.factor}) for ${e.months} mo`;
  }
}

export type ChangeKind = 'up' | 'down' | 'internal' | 'note';
export interface ChangeLine { text: string; kind: ChangeKind }

/** What an outcome changed, for the player ("Sent to procurement: deliveries +2 mo"). Flags are hidden. */
export function changeLines(effects: Effect[]): ChangeLine[] {
  const out: ChangeLine[] = [];
  for (const e of effects) {
    if (e.kind === 'flag') continue;
    if (e.kind === 'trust') {
      if (e.delta !== 0) out.push({ text: `${SH[e.stakeholder].label} ${signed(e.delta)}`, kind: e.delta > 0 ? 'up' : 'down' });
      continue;
    }
    if (e.kind === 'budget') {
      out.push({ text: `Shared budget ${signed(e.deltaM, ' M')}`, kind: 'internal' });
      continue;
    }
    const stations = effectStations(e).filter((s) => s !== 'comms');
    if (!stations.length) out.push({ text: cap(effectText(e)), kind: 'note' });
    else out.push({ text: `Sent to ${stations.map((s) => STATION_LABEL[s]).join(' + ')}: ${effectText(e)}`, kind: 'internal' });
  }
  return out;
}

export function ChangeList({ effects }: { effects: Effect[] }) {
  const lines = changeLines(effects);
  if (!lines.length) return <div class="muted small">No measurable change.</div>;
  return (
    <ul class="change-list">
      {lines.map((l, i) => (
        <li key={i} class={`chg ${l.kind}`}>
          <span class="chg-mark">{l.kind === 'up' ? '▲' : l.kind === 'down' ? '▼' : l.kind === 'internal' ? '⇢' : '•'}</span>
          {l.text}
        </li>
      ))}
    </ul>
  );
}

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Open events, most urgent first. */
export function openByUrgency(inbox: EventInstance[]): EventInstance[] {
  return inbox.filter((i) => i.status === 'open').sort((a, b) => a.deadlineDay - b.deadlineDay);
}

export function dueClass(left: number): string {
  return left < 7 ? 'due-err' : left < 14 ? 'due-warn' : '';
}

export function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
