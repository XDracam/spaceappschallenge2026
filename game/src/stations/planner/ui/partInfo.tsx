// Shared vocabulary for the Rocket and Procurement panels: one part status
// set, plain-language stat labels and one-line hints for newcomers.
import type { Part, PartKind, PartState, PayloadType, PropulsionId } from '../model/types';
import type { StatDef } from '../data/parts';
import { PROPULSION } from '../data/propulsion';
import { statDefs, variantLabel } from '../data/parts';
import { fmtNum } from './common';

// ------------------------------------------------------------ status vocabulary

/** One status set used everywhere: Draft · Ordered · Contracted · Delivered · Late. */
export type PartStatus = PartState;

export const STATUS_LABEL: Record<PartStatus, string> = {
  draft: 'Draft', ordered: 'Ordered', contracted: 'Contracted', delivered: 'Delivered', late: 'Late',
};

export const STATUS_HINT: Record<PartStatus, string> = {
  draft: 'Draft: not ordered yet, sliders are free to change',
  ordered: 'Ordered: waiting for procurement to find a supplier',
  contracted: 'Contracted: a supplier is building it, on its way',
  delivered: 'Delivered: ready for launch',
  late: 'Late: the contract delivers after the launch date',
};

const ORDER: PartStatus[] = ['draft', 'ordered', 'contracted', 'delivered'];

/** Derived part status (stations/planner/derive.ts sets part.state from the shared market). */
export function partStatus(part: Part): PartStatus {
  return part.state;
}

/** Status of a group of parts: Late wins, otherwise the least advanced part. */
export function groupStatus(statuses: PartStatus[]): PartStatus {
  if (statuses.length === 0) return 'draft';
  if (statuses.includes('late')) return 'late';
  let i = ORDER.length - 1;
  for (const s of statuses) i = Math.min(i, ORDER.indexOf(s));
  return ORDER[i];
}

export function StatusDot({ status, title }: { status: PartStatus; title?: string }) {
  return <span class={`ps-dot ps-${status}`} title={title ?? STATUS_HINT[status]} />;
}

export function StatusPill({ status }: { status: PartStatus }) {
  return <span class={`ps-pill ps-${status}`} title={STATUS_HINT[status]}>{STATUS_LABEL[status]}</span>;
}

// ------------------------------------------------------------ plain stat labels

/** Human label for a part stat (plain words first, jargon in brackets). */
export function statLabel(def: StatDef): string {
  if (def.key === 'isp') return 'Efficiency (Isp)';
  if (def.key === 'thrustKN') return 'Push (thrust)';
  return def.label;
}

/** Stat value in display units, e.g. "4.0", "300 s", "1900 kN". */
export function fmtStatValue(def: StatDef, v: number): string {
  const f = def.displayFactor ?? 1;
  const unit = def.displayUnit ?? def.unit;
  const n = def.key === 'performance' ? (v * f).toFixed(1) : fmtNum(v * f);
  return unit ? `${n} ${unit}` : n;
}

/** Research / unlock key ("engine.hydrolox.isp", "engine.ion") as plain words. */
export function researchKeyLabel(key: string): string {
  const [kind, variant, stat] = key.split('.') as [PartKind, string, string | undefined];
  if (!stat) return `${variantLabel(kind, variant)} (future tech)`;
  const def = statDefs(kind, variant).find((d) => d.key === stat);
  return def ? statLabel(def) : stat;
}

// ------------------------------------------------------------ hints

export const PROPULSION_HINT: Record<PropulsionId, string> = {
  solid: 'Strong, simple push for liftoff; least efficient',
  kerolox: 'Strong, dense fuel; the usual 1st stage',
  hydrolox: 'Most efficient chemical fuel; boils off on long trips',
  hypergolic: 'Keeps for years and ignites reliably; good for spacecraft',
  ion: 'Extremely efficient but a tiny push; needs lots of power; cannot launch or land',
};

export function propulsionName(p: PropulsionId): string {
  return PROPULSION[p].name;
}

export const PAYLOAD_HINT: Record<PayloadType, string> = {
  orbiter: 'Stays in orbit; cannot land',
  lander: 'Can land; needs landing legs (and a heat shield where there is air)',
  rover: 'Lands and drives on the surface',
  sampleReturn: 'Lands, collects samples and can fly back to Earth',
  crew: 'Carries astronauts; can land and return',
};

/** Equipment grouped by purpose, with a one-line hint per item. */
export const EQUIPMENT_GROUPS: { title: string; items: { kind: PartKind; variant: string; hint: string }[] }[] = [
  {
    title: 'Science',
    items: [
      { kind: 'instrument', variant: 'camera', hint: 'Maps a planet from orbit' },
      { kind: 'instrument', variant: 'spectrometer', hint: 'Finds what surfaces are made of, from orbit' },
      { kind: 'instrument', variant: 'radar', hint: 'Looks below the surface from orbit' },
      { kind: 'instrument', variant: 'surfaceLab', hint: 'Analyses soil after landing' },
    ],
  },
  {
    title: 'Power',
    items: [
      { kind: 'power', variant: 'solar', hint: 'Cheap power; weaker far from the Sun' },
      { kind: 'power', variant: 'rtg', hint: 'Nuclear battery; same power anywhere' },
    ],
  },
  {
    title: 'Communication',
    items: [{ kind: 'antenna', variant: 'standard', hint: 'Sends science data home; needed for data goals' }],
  },
  {
    title: 'Landing',
    items: [
      { kind: 'legs', variant: 'standard', hint: 'Needed to touch down on a surface' },
      { kind: 'heatShield', variant: 'standard', hint: 'Needed to brake in an atmosphere or land on Mars/Earth/Venus' },
    ],
  },
  {
    title: 'Protection',
    items: [
      { kind: 'radShield', variant: 'standard', hint: 'Needed near Jupiter' },
      { kind: 'heatProtection', variant: 'standard', hint: "Needed on Venus' surface" },
    ],
  },
];
