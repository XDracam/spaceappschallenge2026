// Shared bits for the comms UI: stakeholder meta, lookups, avatars, consequence lines.

import { useState } from 'preact/hooks';
import { effectStations } from '../../../shared/events/types';
import type { Condition } from '../../../shared/events/types';
import type { Character, Effect, EventDef, EventInstance, ProjectDef, StakeholderId, StationId } from '../model/types';
import { getState } from '../../../core/store';
import type { GameState } from '../../../core/state';
import { contractReliability, type Contract, type PartKind } from '../../../core/model';
import { statDefs, variantLabel } from '../../planner/data/parts';
import { allParts } from '../../planner/model/rocketUtils';
import type { Rocket } from '../../planner/model/types';
import { contentOf, dateOf, deliveryMoves, DAYS_PER_MONTH, shieldedBudget } from '../state/world';
import { FLAG_LAUNCH_PROMISE, FLAG_RTG_STORY } from '../data/helpers';
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

/** Portraits that failed to load this session (fall back to initials without retrying). */
const brokenPortraits = new Set<string>();

/** Portrait in a glowing ring of the stakeholder colour; initials when there is no portrait. */
export function Avatar({ character, size = 'md' }: { character?: Character; size?: 'sm' | 'md' | 'lg' }) {
  const [, setBroken] = useState(0);
  const color = character ? SH[character.stakeholder].color : '#8796b0';
  const initials = character ? character.initials || initialsOf(character.name) : '?';
  const portrait = character?.portrait && !brokenPortraits.has(character.portrait) ? character.portrait : null;
  return (
    <div class={`ava ava-${size}${portrait ? ' has-img' : ''}`} style={{ '--c': color } as Record<string, string>} aria-hidden="true">
      {portrait ? (
        <img
          src={`${import.meta.env.BASE_URL}portraits/${portrait}`}
          width={384}
          height={384}
          alt=""
          title="AI-generated portrait"
          draggable={false}
          onError={() => { brokenPortraits.add(portrait); setBroken((n) => n + 1); }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

const pct = (v: number) => `${Math.round(v * 1000) / 10} %`;

function statsText(kind: string, variant: string, stats: Record<string, number> | undefined): string {
  if (!stats) return '';
  return statDefs(kind as PartKind, variant).filter((d) => stats[d.key] !== undefined)
    .map((d) => `${d.label} ${+(stats[d.key] * (d.displayFactor ?? 1)).toFixed(2)}${d.unit ? ` ${d.displayUnit ?? d.unit}` : ''}`).join(' · ');
}

/**
 * Terms of a partner offer, and what is under contract for that part now: what Comms
 * needs to judge the offer before sending it on (R1115d-r01-07).
 */
function offerLine(e: Extract<Effect, { kind: 'offer' }>, contracts: Contract[], design: Rocket): string {
  const terms = [statsText(e.partKind, e.variant, e.stats), `${pct(e.reliability)} reliable`, formatMoney(e.priceM), `${e.deliveryMonths} mo after signing`];
  const have = [...contracts].reverse().find((c) => (c.status === 'active' || c.status === 'delivered')
    && c.offerSnapshot.resource.partKind === e.partKind && c.offerSnapshot.resource.variant === e.variant);
  const now = have
    ? `contracted now: ${[statsText(e.partKind, e.variant, have.offerSnapshot.resource.stats), pct(contractReliability(have))].filter(Boolean).join(' · ')}`
    : allParts(design).some((l) => l.part.kind === e.partKind && l.part.variant === e.variant) ? 'not contracted yet' : 'not in the design';
  return `unsigned offer, ${variantLabel(e.partKind as PartKind, e.variant).toLowerCase()} from ${e.supplier}: ${terms.filter(Boolean).join(' · ')} (${now})`;
}

/** "Camera performance limit 4 → 7" from a research key `kind.variant.stat`. */
function limitText(s: GameState, key: string, value: number): string {
  const [kind, variant, stat] = key.split('.');
  const def = statDefs(kind as PartKind, variant).find((d) => d.key === stat);
  const f = def?.displayFactor ?? 1;
  const unit = def ? ` ${def.displayUnit ?? def.unit}`.trimEnd() : '';
  const now = s.research.limits[key];
  const name = `${variantLabel(kind as PartKind, variant)} ${def?.label.toLowerCase() ?? stat}`;
  const v = (n: number) => `${+(n * f).toFixed(2)}${unit}`;
  if (now !== undefined && now >= value) return `${name} limit already ${v(now)}: no change`;
  return `${name} limit ${now !== undefined ? `${v(now)} → ` : '→ '}${v(value)}: buyable without waiting for research`;
}

/** What a comms-owned flag means, in the words of what it will do. Null for flags the player need not see. */
function flagText(s: GameState, flag: string): string | null {
  if (flag === FLAG_LAUNCH_PROMISE) return `Binds the launch to ${dateOf(s, s.planner.plan.launchDay)}: if the Planner launches later, a follow-up costs Government −5 to −20`;
  if (flag === FLAG_RTG_STORY) return 'The plutonium story stays alive: a protest follows if Public trust drops under 40';
  const flight = contentOf(s).inFlight.filter((d) => conditionFlags(d.goodIf).includes(flag));
  if (flight.length) return `In flight: ${flight.map((d) => `“${d.title}” goes well (${signedPct(d.good.goalChanceDelta)})`).join(', ')}`;
  return null;
}

function conditionFlags(c: Condition): string[] {
  if (c.kind === 'flag' || c.kind === 'notFlag') return [c.flag];
  if (c.kind === 'all' || c.kind === 'any') return c.of.flatMap(conditionFlags);
  return [];
}

/** "+3 %" for a goal-chance delta (0.03). */
export const signedPct = (d: number) => signed(Math.round(d * 1000) / 10, ' %');

export type ChangeKind = 'up' | 'down' | 'cost' | 'station' | 'note';
export interface ChangeLine { text: string; kind: ChangeKind; station?: StationId; stakeholder?: StakeholderId }

/**
 * What these effects will do if applied now, in the numbers the rules will use: trust after
 * clamping, budget cuts after public support, which delivery moves to which date, prices and
 * research pace until which day, an offer's terms (R1115m-r01-10, the package goal "every
 * choice shows its real consequence"). `costM`: the option's price (shown as a cost).
 * `shield`: negative budget effects are event cuts (halved by strong Public trust).
 * `at`: the day the effects apply, when later than today (a project's end).
 */
export function previewLines(s: GameState, effects: Effect[], o: { costM?: number; shield: boolean; at?: number }): ChangeLine[] {
  const out: ChangeLine[] = [];
  let costShown = false;
  // Timed effects run from the day they apply (a project's end), else from today.
  const until = (months: number) => dateOf(s, (o.at ?? s.clock.day) + months * DAYS_PER_MONTH);
  for (const e of effects) {
    switch (e.kind) {
      case 'trust': {
        const now = s.comms.trust[e.stakeholder] ?? 0;
        const d = Math.min(100, Math.max(0, now + e.delta)) - now;
        if (d !== 0) out.push({ text: `${SH[e.stakeholder].short} ${signed(d)}`, kind: d > 0 ? 'up' : 'down', stakeholder: e.stakeholder });
        break;
      }
      case 'budget': {
        if (o.costM && !costShown && e.deltaM === -o.costM) {
          costShown = true;
          out.push({ text: `Costs ${formatMoney(o.costM)} of the shared budget`, kind: 'cost' });
          break;
        }
        const b = shieldedBudget(s, e.deltaM, o.shield && !o.costM);
        out.push({ text: `Shared budget ${signed(b.deltaM, ' M')}${b.softened ? ' (halved by strong Public trust)' : ''}`, kind: 'cost' });
        break;
      }
      case 'deliveryDelay': {
        const moves = deliveryMoves(s, e);
        let text: string;
        if (!moves.length) text = 'no delivery under contract yet: nothing moves';
        else if (e.scope === 'next') {
          const m = moves[0];
          const late = m.from > m.neededAt;
          text = `${m.part} arrives ${dateOf(s, m.to)} instead of ${dateOf(s, m.from)}${late || m.to > m.neededAt ? ` (needed ${dateOf(s, m.neededAt)})` : ''}`;
        } else text = `all ${moves.length} deliveries ${Math.abs(e.months)} mo ${e.months < 0 ? 'earlier' : 'later'}`;
        out.push({ text, kind: 'station', station: 'procurement' });
        break;
      }
      case 'priceModifier':
        out.push({ text: `new orders ${signed(e.pct, ' %')} price until ${until(e.months)}`, kind: 'station', station: 'procurement' });
        break;
      case 'offer':
        out.push({ text: offerLine(e, s.market.contracts, s.planner.rocket), kind: 'station', station: 'procurement' });
        break;
      case 'researchPace': {
        const running = s.research.projects.some((p) => p.status === 'running');
        out.push({
          text: `research and part tests ${Math.abs(e.pct)} % ${e.pct > 0 ? 'faster' : 'slower'} until ${until(e.months)}${running || o.at !== undefined ? '' : ' (nothing running now)'}`,
          kind: 'station', station: 'science',
        });
        break;
      }
      case 'researchLimit':
        out.push({ text: limitText(s, e.key, e.value), kind: 'station', station: 'science' });
        break;
      case 'unlock': {
        const [kind, variant] = e.key.split('.');
        out.push({ text: `${variantLabel(kind as PartKind, variant)} can be designed and bought`, kind: 'station', station: 'planner' });
        break;
      }
      case 'techAccess':
        out.push({ text: e.note, kind: 'station', station: 'science' });
        break;
      case 'service':
      case 'missionConstraint':
        // No station reads these (R1115m-r01-08): say so instead of promising a teammate effect.
        out.push({ text: `Promise only, no station changes: ${e.kind === 'service' ? e.note : e.text}`, kind: 'note' });
        break;
      case 'flag': {
        const t = e.on ? flagText(s, e.flag) : null;
        if (t) out.push({ text: t, kind: 'note' });
        break;
      }
      case 'eventOdds':
        out.push({ text: `${e.factor >= 1 ? 'More' : 'Fewer'} ${e.tag} messages until ${until(e.months)}`, kind: 'note' });
        break;
    }
  }
  return out;
}

/** What an outcome did, without the state at that moment (fallback for "What changed"). Flags are hidden. */
export function changeLines(effects: Effect[]): ChangeLine[] {
  const out: ChangeLine[] = [];
  for (const e of effects) {
    if (e.kind === 'flag') continue;
    if (e.kind === 'trust') {
      if (e.delta !== 0) out.push({ text: `${SH[e.stakeholder].short} ${signed(e.delta)}`, kind: e.delta > 0 ? 'up' : 'down', stakeholder: e.stakeholder });
      continue;
    }
    if (e.kind === 'budget') {
      out.push({ text: `Shared budget ${signed(e.deltaM, ' M')}`, kind: 'cost' });
      continue;
    }
    const station = effectStations(e).find((st) => st !== 'comms');
    out.push({ text: effectText(e), kind: station ? 'station' : 'note', station });
  }
  return out;
}

/** An effect in plain words (without the station), for the fallback above. */
function effectText(e: Effect): string {
  switch (e.kind) {
    case 'deliveryDelay': {
      const what = e.scope === 'next' ? 'a delivery' : 'deliveries';
      return `${what} ${Math.abs(e.months)} mo ${e.months < 0 ? 'earlier' : 'later'}`;
    }
    case 'priceModifier': return `prices ${signed(e.pct, ' %')} for ${e.months} mo`;
    case 'offer': return `unsigned offer: ${e.variant} ${e.partKind} from ${e.supplier}, ${formatMoney(e.priceM)}`;
    case 'researchPace': return `research ${signed(e.pct, ' %')} pace for ${e.months} mo`;
    case 'researchLimit': return `research limit ${e.key} → ${e.value}`;
    case 'unlock': return `unlocks ${e.key}`;
    case 'techAccess': return e.note;
    case 'service': return e.note;
    case 'missionConstraint': return e.text;
    case 'eventOdds': return `${e.factor >= 1 ? 'more' : 'fewer'} ${e.tag} messages for ${e.months} mo`;
    default: return '';
  }
}

const STATION_TITLE: Record<StationId, string> = { planner: 'Planner', procurement: 'Procurement', science: 'Science', comms: 'Comms' };

/** Consequences as compact chips: trust in its stakeholder colour, teammates' effects named by station. */
export function ChangeList({ lines, empty = 'No measurable change.' }: { lines: ChangeLine[]; empty?: string }) {
  if (!lines.length) return <div class="muted small">{empty}</div>;
  return (
    <ul class="change-list">
      {lines.map((l, i) => (
        <li key={i} class={`chg ${l.kind}`} style={l.stakeholder ? ({ '--c': SH[l.stakeholder].color } as Record<string, string>) : undefined}>
          {l.station && <span class={`chg-stn stn-${l.station}`}>{STATION_TITLE[l.station]}</span>}
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
