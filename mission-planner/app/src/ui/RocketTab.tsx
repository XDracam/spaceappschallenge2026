import './panels.css';
import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Contract, Evaluation, Part, PartKind, PayloadType, PropulsionId, Spacecraft, Stage } from '../model/types';
import { actions, gameStore, useEvaluation, useGame } from '../state/store';
import {
  PAYLOAD_TYPE_LABEL, VARIANTS, beyondResearch, estimatedCostM, partDryMassT, partReliability, researchKey,
  spacecraftWetMassT, stageDryMassT, stageFuelT, stageIsp, stageThrustKN, statDefs, unlockKey, variantLabel,
} from '../data/parts';
import { PROPULSION, PROPULSION_LIST } from '../data/propulsion';
import { G0, formatDay, formatDuration, formatDv, formatMass, formatMoney } from '../model/units';
import { allParts, findSpacecraft, findStage } from '../model/rocketUtils';
import { StatSlider } from './Slider';
import { ChevronIcon, LockIcon, PlusIcon, fmtNum, localUi, pctFine, useLocalUi, useOutsideClose } from './common';
import {
  EQUIPMENT_GROUPS, PAYLOAD_HINT, PROPULSION_HINT, StatusDot, StatusLegend, StatusPill, groupStatus, partStatus,
  researchKeyLabel,
} from './partInfo';
import type { PartStatus } from './partInfo';

// ------------------------------------------------------------ context passed down the tree

interface Ctx {
  ev: Evaluation;
  contracts: Contract[];
  launchDay: number;
  startISO: string;
  /** Stage id -> shortfall where this stage has run dry. */
  dryStages: Map<string, Shortfall>;
}

// ------------------------------------------------------------ accordion: one open item in the whole panel

function openOnly(kind: 'sc' | 'stage' | 'part' | null, id: string | null, stageId: string | null = null) {
  localUi.update((s) => {
    s.openSpacecraftId = kind === 'sc' ? id : null;
    s.openStageId = kind === 'stage' ? id : kind === 'part' ? stageId : null;
    s.openPartId = kind === 'part' ? id : null;
  });
}

// ------------------------------------------------------------ helpers

function stageBand(ev: Evaluation, stageId: string) {
  for (const b of ev.branches) {
    const band = b.stageBands.find((x) => x.stageId === stageId);
    if (band) return band;
  }
  return undefined;
}

function stageWetMassT(s: Stage): number {
  return stageDryMassT(s) + stageFuelT(s);
}

function isEditable(p: Part) {
  return p.state === 'draft' || p.state === 'sent';
}

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

function fmtThrustKN(kn: number, ion: boolean): string {
  return ion ? `${fmtNum(kn * 1000)} N` : `${fmtNum(kn)} kN`;
}

function kms(ms: number): string {
  return `${(ms / 1000).toFixed(2)} km/s`;
}

/** The one number shown on a collapsed part row (with units). */
function keyNumber(p: Part): string {
  const s = p.stats;
  switch (p.kind) {
    case 'engine': return `${fmtThrustKN(s.thrustKN, p.variant === 'ion')} · ${fmtNum(s.isp)} s`;
    case 'tank': return `${formatMass(s.fuelT)} fuel`;
    case 'instrument': return `perf ${s.performance.toFixed(1)}`;
    case 'power': return `${fmtNum(s.outputKW)} kW`;
    case 'antenna': return `${fmtNum(s.dataRateKbps)} kbps`;
    case 'legs': return `≤ ${formatMass(s.maxLandingMassT)}`;
    case 'heatShield': return `≤ ${formatMass(s.maxEntryMassT)}`;
    case 'radShield':
    case 'heatProtection': return `level ${fmtNum(s.level)}`;
  }
}

const stop = (e: Event) => e.stopPropagation();

// ------------------------------------------------------------ delta-v shortfall

interface Shortfall { maneuverLabel: string; shortMs: number; dryStageIds: string[] }

/** Per branch: the first maneuver out of delta-v, how much is missing, and which stages were burned empty by then. */
function findShortfalls(ev: Evaluation): Shortfall[] {
  const out: Shortfall[] = [];
  for (const b of ev.branches) {
    if (!b.failedAtManeuverId) continue;
    const idx = b.maneuvers.findIndex((m) => m.issues.some((i) => i.code === 'dv'));
    if (idx < 0) continue;
    const m = b.maneuvers[idx];
    const burned: string[] = [];
    for (const r of b.maneuvers.slice(0, idx + 1)) {
      for (const burn of r.burns) if (!burned.includes(burn.stageId)) burned.push(burn.stageId);
    }
    const dry = burned.filter((id) => {
      const band = b.stageBands.find((x) => x.stageId === id);
      return !!band && band.dvUsedMs >= band.dvTotalMs - 1;
    });
    out.push({ maneuverLabel: m.label, shortMs: Math.max(0, m.dvRequiredMs - m.dvAvailableBeforeMs), dryStageIds: dry });
  }
  return out;
}

function expandStage(stageId: string) {
  openOnly('stage', stageId);
  requestAnimationFrame(() => {
    document.querySelector(`[data-stage-id="${stageId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// ------------------------------------------------------------ popovers (+ menu, ⋯ menu)

function usePopover() {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  const toggle = (e: Event) => {
    e.stopPropagation();
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      setUp(below < 340 && r.top > below);
    }
    setOpen(!open);
  };
  return { open, setOpen, up, ref, toggle };
}

interface AddItem { label: string; hint?: string; locked?: boolean; onPick: () => void }
interface AddGroup { title: string; items: AddItem[] }

const FUTURE_TITLE = 'Future tech: not researched yet. You can plan with it, but ordering it may cost more or be less reliable.';

function AddMenu({ groups, title }: { groups: AddGroup[]; title: string }) {
  const pop = usePopover();
  const [future, setFuture] = useState(false);
  const lockedCount = groups.reduce((s, g) => s + g.items.filter((i) => i.locked).length, 0);
  return (
    <div class="add-menu" ref={pop.ref} onClick={stop}>
      <button class={`round-btn small${pop.open ? ' active' : ''}`} title={title} aria-label={title} onClick={pop.toggle}>
        <PlusIcon />
      </button>
      {pop.open && (
        <div class={`popover glass strong pm-menu thin-scroll${pop.up ? ' up' : ''}`}>
          {groups.map((g) => {
            const items = g.items.filter((i) => future || !i.locked);
            if (!items.length) return null;
            return (
              <div class="pm-group" key={g.title}>
                <div class="label">{g.title}</div>
                {items.map((it) => (
                  <button class="pm-item" key={it.label} title={it.locked ? FUTURE_TITLE : undefined}
                    onClick={() => { pop.setOpen(false); it.onPick(); }}>
                    <span class="pm-item-label">{it.label}{it.locked && <span class="lock-mark"> <LockIcon /></span>}</span>
                    {it.hint && <span class="pm-item-hint">{it.hint}</span>}
                  </button>
                ))}
              </div>
            );
          })}
          {lockedCount > 0 && (
            <label class="pm-future" title={FUTURE_TITLE}>
              <input type="checkbox" checked={future} onChange={(e) => setFuture((e.currentTarget as HTMLInputElement).checked)} />
              Show future tech ({lockedCount})
            </label>
          )}
        </div>
      )}
    </div>
  );
}

type MenuEntry =
  | { header: string }
  | { label: string; onPick: () => void; disabled?: boolean; danger?: boolean; checked?: boolean; title?: string };

function RowMenu({ entries, title }: { entries: MenuEntry[]; title: string }) {
  const pop = usePopover();
  return (
    <div class="add-menu" ref={pop.ref} onClick={stop}>
      <button class={`pm-dots${pop.open ? ' active' : ''}`} title={title} aria-label={title} onClick={pop.toggle}>⋯</button>
      {pop.open && (
        <div class={`popover glass strong pm-menu pm-row-menu${pop.up ? ' up' : ''}`}>
          {entries.map((e, i) => ('header' in e ? (
            <div class="label pm-header" key={`h${i}`}>{e.header}</div>
          ) : (
            <button key={e.label} class={`pm-item pm-item-row${e.danger ? ' danger' : ''}`} disabled={e.disabled} title={e.title}
              onClick={() => { pop.setOpen(false); e.onPick(); }}>
              <span class="pm-check">{e.checked ? '✓' : ''}</span>
              <span class="pm-item-label">{e.label}</span>
            </button>
          )))}
        </div>
      )}
    </div>
  );
}

function NameEdit({ value, onCommit, onDone }: { value: string; onCommit: (v: string) => void; onDone: () => void }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input ref={ref} class="name-input pm-name-edit" value={text} aria-label="Name"
      onClick={stop}
      onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
        if (e.key === 'Escape') { cancelled.current = true; (e.currentTarget as HTMLInputElement).blur(); }
      }}
      onBlur={() => {
        if (!cancelled.current && text.trim() && text.trim() !== value) onCommit(text.trim());
        onDone();
      }} />
  );
}

// ------------------------------------------------------------ propulsion choices

function usePropulsionItems(add: (p: PropulsionId) => void): AddItem[] {
  const unlocked = useGame((g) => g.unlocked);
  return PROPULSION_LIST.map((p) => ({
    label: p.name, hint: PROPULSION_HINT[p.id], onPick: () => add(p.id), locked: !unlocked.includes(unlockKey('engine', p.id)),
  }));
}

function PropulsionSelect({ value, onChange }: { value: PropulsionId; onChange: (p: PropulsionId) => void }) {
  const unlocked = useGame((g) => g.unlocked);
  return (
    <select value={value} title={`Fuel type: ${PROPULSION_HINT[value]}`} aria-label="Fuel type"
      onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value as PropulsionId)}>
      {PROPULSION_LIST.map((p) => {
        const locked = !unlocked.includes(unlockKey('engine', p.id));
        return <option value={p.id} title={PROPULSION_HINT[p.id]}>{p.name}{locked ? ' (future tech)' : ''}</option>;
      })}
    </select>
  );
}

// ------------------------------------------------------------ panel

export function RocketTab() {
  const rocket = useGame((g) => g.rocket);
  const contracts = useGame((g) => g.contracts);
  const launchDay = useGame((g) => g.plan.launchDay);
  const startISO = useGame((g) => g.mission.startDateISO);
  const ev = useEvaluation();
  const stageItems = usePropulsionItems((p) => actions.addStage('rocket', p));

  const payloadMass = rocket.spacecraft.reduce((s, sc) => s + spacecraftWetMassT(sc), 0);
  const launchMass = ev.totalMassT || payloadMass + rocket.stages.reduce((s, st) => s + stageWetMassT(st), 0);
  const root = ev.branches[0];
  const dvHas = root?.dvAvailableTotalMs ?? 0;
  const dvNeeds = root?.dvRequiredTotalMs ?? 0;
  const dvClass = dvNeeds <= 0 ? '' : dvHas >= dvNeeds ? ' ok-text' : ' err-text';

  const shortfalls = findShortfalls(ev);
  const dryStages = new Map<string, Shortfall>();
  for (const sf of shortfalls) for (const id of sf.dryStageIds) if (!dryStages.has(id)) dryStages.set(id, sf);
  const ctx: Ctx = { ev, contracts, launchDay, startISO, dryStages };
  const top = shortfalls[0];

  const parts = allParts(rocket).map((l) => l.part);
  const statuses = parts.map((p) => partStatus(p, contracts, launchDay));
  const drafts = parts.filter((p) => p.state === 'draft');
  const nOrdered = parts.length - drafts.length;
  const nDelivered = statuses.filter((s) => s === 'delivered').length;
  const nLate = statuses.filter((s) => s === 'late').length;

  // Liftoff lift ratio of the 1st stage against Earth gravity: everything above (and including) the stage.
  const liftRatio = (() => {
    if (!rocket.stages.length) return undefined;
    const mass = payloadMass + rocket.stages.reduce((s, st) => s + stageWetMassT(st), 0);
    return mass > 0 ? stageThrustKN(rocket.stages[0]) / (mass * G0) : undefined;
  })();

  const orderAll = () => {
    if (!drafts.length) return;
    if (!confirm(`Order all ${drafts.length} draft parts? Their slider values become minimums for procurement.`)) return;
    for (const p of drafts) actions.sendTask(p.id);
  };

  return (
    <div class="rocket-tab">
      <StatusLegend />

      <div class="pm-stats">
        <div title="Total mass on the launch pad"><span class="label">Mass</span><b class="num">{formatMass(launchMass)}</b></div>
        <div title={dvNeeds > 0
          ? `Speed change (Δv) the rocket has vs what the main flight plan needs.${dvHas >= dvNeeds ? ' Enough.' : ' Not enough.'}`
          : 'Speed change (Δv) the rocket has. Plan a flight on the map to see what it needs.'}>
          <span class="label">Δv <span class="pm-sub">has / needs</span></span>
          <b class={`num${dvClass}`}>{(dvHas / 1000).toFixed(1)} / {dvNeeds > 0 ? (dvNeeds / 1000).toFixed(1) : '—'} <small>km/s</small></b>
        </div>
        <div title="Estimated cost of the design: draft and ordered parts estimated, contracted parts at contract price">
          <span class="label">Cost</span><b class="num">{formatMoney(ev.totalCostM)}</b>
        </div>
      </div>

      <div class="pm-summary">
        <span>{nOrdered} of {parts.length} parts ordered</span> · <span>{nDelivered} delivered</span> ·{' '}
        <span class={nLate ? 'err-text' : ''}>{nLate} late</span>
      </div>

      {top && (
        <button class="pm-alert pm-alert-top" onClick={() => {
          const last = top.dryStageIds[top.dryStageIds.length - 1];
          if (last) expandStage(last);
        }} title={top.dryStageIds.length ? 'Show the last stage that ran dry' : undefined}>
          <b>Short by {kms(top.shortMs)} at {top.maneuverLabel}.</b>{' '}
          Fuel in upper stages counts most; adding fuel to the payload also adds weight for every stage below.
        </button>
      )}

      <div class="pm-order-all">
        <button class="pill primary small" disabled={!drafts.length} onClick={orderAll}
          title={drafts.length ? 'Send every draft part to procurement' : 'No draft parts left to order'}>
          Order all parts ({drafts.length})
        </button>
      </div>

      <div class="group-title">
        <span class="label">Payload</span>
        <div class="spacer" />
        <AddMenu title="Add spacecraft" groups={[{
          title: 'Add spacecraft',
          items: (Object.entries(PAYLOAD_TYPE_LABEL) as [PayloadType, string][]).map(([k, l]) => ({
            label: l, hint: PAYLOAD_HINT[k], onPick: () => actions.addSpacecraft(k),
          })),
        }]} />
      </div>
      {rocket.spacecraft.length === 0 && <div class="empty">No spacecraft.</div>}
      {rocket.spacecraft.map((sc) => <SpacecraftGroup key={sc.id} sc={sc} ctx={ctx} />)}

      <div class="group-title">
        <span class="label" title="Shown as stacked: top stage fires last, bottom stage fires first">Launch vehicle</span>
        <div class="spacer" />
        <AddMenu title="Add rocket stage" groups={[{ title: 'Add stage on top', items: stageItems }]} />
      </div>
      <div class="group">
        {rocket.stages.length === 0 && <div class="empty">No rocket stages.</div>}
        {rocket.stages.map((_, i) => rocket.stages.length - 1 - i).map((i) => (
          <StageRow key={rocket.stages[i].id} stage={rocket.stages[i]} ctx={ctx} index={i} count={rocket.stages.length}
            rocketStage liftRatio={i === 0 ? liftRatio : undefined} />
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ rows

function Row({ open, onToggle, dot, name, tag, sub, num, numTitle, warn, beyond, rowRef, highlight, menu, strong }: {
  open: boolean; onToggle: () => void; dot: ComponentChildren; name: ComponentChildren; tag?: string; sub?: string;
  num: string; numTitle?: string; warn?: string; beyond?: string; rowRef?: RefObject<HTMLDivElement>; highlight?: boolean;
  menu?: ComponentChildren; strong?: boolean;
}) {
  return (
    <div ref={rowRef} class={`row pm-row${open ? ' open' : ''}${highlight ? ' highlight' : ''}`} onClick={onToggle}
      role="button" tabIndex={0} aria-expanded={open}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(); } }}>
      {dot}
      <span class={`row-name${strong ? ' strong' : ''}`}>
        <span class="pm-title">{name}{tag && <span class="pm-tag">{tag}</span>}</span>
        {sub && <span class="row-sub pm-subline">{sub}</span>}
      </span>
      {beyond && <span class="beyond-mark" title={`Beyond current research: ${beyond}`}>!</span>}
      {warn && <span class="err-mark" title={warn}>!</span>}
      <span class="row-num num" title={numTitle}>{num}</span>
      {menu}
      <ChevronIcon open={open} />
    </div>
  );
}

function SpacecraftGroup({ sc, ctx }: { sc: Spacecraft; ctx: Ctx }) {
  const unlocked = useGame((g) => g.unlocked);
  const open = useLocalUi((s) => s.openSpacecraftId === sc.id);
  const [renaming, setRenaming] = useState(false);
  const stageItems = usePropulsionItems((p) => actions.addStage(sc.id, p));
  const groups: AddGroup[] = [
    ...EQUIPMENT_GROUPS.map((g) => ({
      title: g.title,
      items: g.items.map((it) => ({
        label: variantLabel(it.kind, it.variant), hint: it.hint,
        locked: !unlocked.includes(unlockKey(it.kind, it.variant)),
        onPick: () => actions.addEquipment(sc.id, it.kind as PartKind, it.variant),
      })),
    })),
    { title: 'Propulsion stage', items: stageItems },
  ];
  const parts = [...sc.equipment, ...sc.stages.flatMap((s) => [s.engine, ...s.tanks])];
  const statuses = parts.map((p) => partStatus(p, ctx.contracts, ctx.launchDay));
  const ordered = parts.filter((p) => p.state !== 'draft').length;

  const menu: MenuEntry[] = [
    { label: 'Rename', onPick: () => setRenaming(true) },
    { header: 'Type' },
    ...(Object.entries(PAYLOAD_TYPE_LABEL) as [PayloadType, string][]).map(([k, l]) => ({
      label: l, checked: sc.payloadType === k, title: PAYLOAD_HINT[k], onPick: () => actions.setPayloadType(sc.id, k),
    })),
    { header: '' },
    {
      label: 'Remove spacecraft', danger: true,
      onPick: () => confirm(`Remove ${sc.name} and all its parts? Running contracts are not cancelled.`) && actions.removeSpacecraft(sc.id),
    },
  ];

  return (
    <div class="group">
      <Row open={open} onToggle={() => openOnly(open ? null : 'sc', open ? null : sc.id)} strong
        dot={<StatusDot status={groupStatus(statuses)} />}
        name={renaming ? <NameEdit value={sc.name} onCommit={(v) => actions.renameSpacecraft(sc.id, v)} onDone={() => setRenaming(false)} /> : sc.name}
        sub={renaming || PAYLOAD_TYPE_LABEL[sc.payloadType] === sc.name ? undefined : PAYLOAD_TYPE_LABEL[sc.payloadType]}
        num={formatMass(spacecraftWetMassT(sc))} numTitle="Mass with fuel"
        menu={<>
          <RowMenu title={`${sc.name}: rename, type, remove`} entries={menu} />
          <AddMenu title="Add equipment or a propulsion stage" groups={groups} />
        </>} />
      {open && (
        <div class="row-detail">
          <div class="tiny">{PAYLOAD_TYPE_LABEL[sc.payloadType]}: <span class="muted">{PAYLOAD_HINT[sc.payloadType]}</span></div>
          <div class="mini-stats">
            <span><span class="label">Mass with fuel</span><b class="num">{formatMass(spacecraftWetMassT(sc))}</b></span>
            <span><span class="label">Parts ordered</span><b class="num">{ordered} / {parts.length}</b></span>
          </div>
        </div>
      )}
      <div class="group-body">
        {sc.equipment.length === 0 && sc.stages.length === 0 && <div class="empty">No equipment or propulsion. Use + to add.</div>}
        {sc.equipment.map((p) => <PartRow key={p.id} part={p} ctx={ctx} removable />)}
        {sc.stages.map((_, i) => sc.stages.length - 1 - i).map((i) => (
          <StageRow key={sc.stages[i].id} stage={sc.stages[i]} ctx={ctx} index={i} count={sc.stages.length} />
        ))}
      </div>
    </div>
  );
}

function StageRow({ stage, ctx, index, count, rocketStage, liftRatio }: {
  stage: Stage; ctx: Ctx; index: number; count: number; rocketStage?: boolean; liftRatio?: number;
}) {
  const open = useLocalUi((s) => s.openStageId === stage.id);
  const [renaming, setRenaming] = useState(false);
  const allDraft = stage.engine.state === 'draft' && stage.tanks.every((t) => t.state === 'draft');
  const band = stageBand(ctx.ev, stage.id);
  const engineEditable = isEditable(stage.engine);
  const dry = stageDryMassT(stage);
  const fuel = stageFuelT(stage);
  const ion = stage.propulsion === 'ion';
  const tooHeavy = liftRatio !== undefined && Number.isFinite(liftRatio) && liftRatio < 1;
  const shortfall = ctx.dryStages.get(stage.id);
  const statuses = [stage.engine, ...stage.tanks].map((p) => partStatus(p, ctx.contracts, ctx.launchDay));
  const toggle = () => openOnly(open ? null : 'stage', open ? null : stage.id);

  const defaultName = /^Stage \d+$/.test(stage.name);
  const title = rocketStage ? `${ordinal(index + 1)} stage` : stage.name;
  const tag = rocketStage ? (index === 0 ? 'fires first ↓' : undefined) : count > 1 ? (index === 0 ? 'fires first' : `fires ${ordinal(index + 1)}`) : undefined;
  const sub = rocketStage && !defaultName ? stage.name : undefined;

  const menu: MenuEntry[] = [
    { label: 'Rename', onPick: () => setRenaming(true) },
    { label: 'Fire earlier', disabled: index === 0, onPick: () => actions.moveStage(stage.id, -1), title: 'Move down the stack: fires before the stage below it now' },
    { label: 'Fire later', disabled: index >= count - 1, onPick: () => actions.moveStage(stage.id, 1), title: 'Move up the stack: fires after the stage above it now' },
    {
      label: 'Remove stage', danger: true,
      onPick: () => confirm(`Remove ${title}${sub ? ` (${sub})` : ''}? Running contracts are not cancelled.`) && actions.removeStage(stage.id),
    },
  ];

  return (
    <div class={`stage${open ? ' open' : ''}`} data-stage-id={stage.id}>
      <Row open={open} onToggle={toggle} dot={<StatusDot status={groupStatus(statuses)} />}
        name={renaming ? <NameEdit value={stage.name} onCommit={(v) => actions.renameStage(stage.id, v)} onDone={() => setRenaming(false)} /> : title}
        tag={renaming ? undefined : tag} sub={renaming ? undefined : sub}
        num={band ? formatDv(band.dvTotalMs) : '—'}
        numTitle={`${PROPULSION[stage.propulsion].name} · speed change (Δv) this stage can give`}
        warn={tooHeavy ? 'Too heavy to lift off' : shortfall ? 'Runs dry' : undefined}
        menu={<RowMenu title="Rename, fire order, remove" entries={menu} />} />
      {tooHeavy && <div class="pm-alert-line">Too heavy to lift off — add engines or remove fuel</div>}
      {shortfall && (
        <div class="pm-alert-line">Runs dry before {shortfall.maneuverLabel} — short by {kms(shortfall.shortMs)}</div>
      )}
      {open && (
        <div class="row-detail stage-detail">
          <div class="field-row">
            {allDraft ? (
              <PropulsionSelect value={stage.propulsion} onChange={(p) => actions.setStagePropulsion(stage.id, p)} />
            ) : (
              <span class="tag" title="Fuel type is fixed once a part of the stage is ordered">{PROPULSION[stage.propulsion].name}</span>
            )}
            <div class="stepper" title={engineEditable ? 'Identical engines in this stage' : 'Fixed by contract'}>
              <span class="pm-step-label">Engines</span>
              <button class="round-btn small" aria-label="Fewer engines" disabled={!engineEditable || stage.engineCount <= 1}
                onClick={() => actions.setEngineCount(stage.id, stage.engineCount - 1)}>−</button>
              <span class="num">{stage.engineCount}</span>
              <button class="round-btn small" aria-label="More engines" disabled={!engineEditable || stage.engineCount >= 30}
                onClick={() => actions.setEngineCount(stage.id, stage.engineCount + 1)}>+</button>
            </div>
          </div>
          <div class="muted tiny">{PROPULSION_HINT[stage.propulsion]}</div>
          <div class="mini-stats">
            <span title={`Empty ${formatMass(dry)} + fuel ${formatMass(fuel)}`}><span class="label">Fuel + tank</span><b class="num">{formatMass(dry + fuel)}</b></span>
            <span title="Thrust of all engines together"><span class="label">Push</span><b class="num">{fmtThrustKN(stageThrustKN(stage), ion)}</b></span>
            <span title="Specific impulse: more seconds = more speed from the same fuel"><span class="label">Efficiency (Isp)</span><b class="num">{fmtNum(stageIsp(stage))} s</b></span>
            {liftRatio !== undefined && Number.isFinite(liftRatio) && (
              <span title="Push divided by the weight of the whole rocket at liftoff; must be above 1 to leave the pad">
                <span class="label">Lift ratio (TWR)</span><b class={`num${tooHeavy ? ' err-text' : ''}`}>{liftRatio.toFixed(2)}</b>
              </span>
            )}
          </div>
          <div class="muted tiny">
            Gives {band ? formatDv(band.dvTotalMs) : '—'} of speed change (Δv)
            {band && band.dvUsedMs > 0 && `, plan uses ${formatDv(band.dvUsedMs)}`}
          </div>
          <div class="sub-rows">
            <PartRow part={stage.engine} ctx={ctx} stageId={stage.id} />
            {stage.tanks.map((t) => <PartRow key={t.id} part={t} ctx={ctx} stageId={stage.id} removable={stage.tanks.length > 1} />)}
            <button class="pill ghost small add-tank" onClick={() => actions.addTank(stage.id)}><PlusIcon /> Tank</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ part rows

/** Timing for a part: needed by / arrives / late / delivered. */
function timing(status: PartStatus, contract: Contract | undefined, ctx: Ctx): { text: string; late?: boolean } | undefined {
  const d = (day: number) => formatDay(day, ctx.startISO);
  switch (status) {
    case 'draft': return undefined;
    case 'ordered': return { text: `Needed by ${d(ctx.launchDay)} (launch)` };
    case 'delivered': return { text: 'Delivered ✓' };
    case 'contracted':
      return contract
        ? { text: `Arrives ${d(contract.deliveryDay)} (${formatDuration(ctx.launchDay - contract.deliveryDay)} before launch)` }
        : { text: 'On its way' };
    case 'late':
      return { text: `LATE — arrives ${formatDuration((contract?.deliveryDay ?? ctx.launchDay) - ctx.launchDay)} after launch`, late: true };
  }
}

/** Replace a contracted/delivered part with a new order (same values; still adjustable while ordered). */
function orderReplacement(part: Part, contract: Contract | undefined, startISO: string) {
  const when = contract
    ? contract.status === 'delivered' ? `was delivered on ${formatDay(contract.deliveryDay, startISO)}` : `arrives ${formatDay(contract.deliveryDay, startISO)}`
    : 'is already contracted';
  const msg = `Order a replacement for ${part.name}?\n\nThe current part ${when}. Its contract${contract ? ` with ${contract.supplier}` : ''} keeps running (and its money stays spent) unless procurement cancels it.\n\nThe replacement is ordered with the same values; you can still adjust its sliders until procurement signs a supplier.`;
  if (!confirm(msg)) return;
  const before = gameStore.get().rocket;
  const loc = allParts(before).find((l) => l.part.id === part.id);
  if (!loc) return;
  actions.replacePart(part.id);
  const after = gameStore.get().rocket;
  let fresh: Part | undefined;
  if (loc.role === 'engine' && loc.stage) fresh = findStage(after, loc.stage.id)?.stage.engine;
  else if (loc.role === 'tank' && loc.stage) {
    const i = loc.stage.tanks.findIndex((t) => t.id === part.id);
    fresh = findStage(after, loc.stage.id)?.stage.tanks[i];
  } else if (loc.spacecraft) {
    const i = loc.spacecraft.equipment.findIndex((p) => p.id === part.id);
    fresh = findSpacecraft(after, loc.spacecraft.id)?.equipment[i];
  }
  if (fresh && fresh.state === 'draft') {
    actions.sendTask(fresh.id);
    openOnly('part', fresh.id, loc.stage?.id ?? null);
  }
}

function PartRow({ part, ctx, removable, stageId }: { part: Part; ctx: Ctx; removable?: boolean; stageId?: string }) {
  const research = useGame((g) => g.research);
  const unlocked = useGame((g) => g.unlocked);
  const open = useLocalUi((s) => s.openPartId === part.id);
  const highlighted = useLocalUi((s) => s.highlightPartId === part.id);
  const nonce = useLocalUi((s) => s.highlightNonce);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted, nonce]);

  const contract = part.contractId ? ctx.contracts.find((c) => c.id === part.contractId) : undefined;
  const status = partStatus(part, ctx.contracts, ctx.launchDay);
  const editable = isEditable(part);
  const defs = statDefs(part.kind, part.variant);
  const beyond = beyondResearch(part, research, unlocked);
  const locked = !unlocked.includes(unlockKey(part.kind, part.variant));
  const showVariant = part.kind !== 'engine' && part.kind !== 'tank' && VARIANTS[part.kind].length > 1 && part.name !== variantLabel(part.kind, part.variant);
  const toggle = () => openOnly('part', open ? null : part.id, stageId ?? null);
  const reliability = partReliability(part);
  const time = timing(status, contract, ctx);

  const remove = () => {
    if (part.state === 'contracted' || part.state === 'delivered') {
      if (!confirm(`Remove ${part.name}? Its contract keeps running; only procurement can cancel it.`)) return;
    }
    actions.removePart(part.id);
  };

  return (
    <div class={`part${open ? ' open' : ''}`}>
      <Row rowRef={ref} open={open} onToggle={toggle} highlight={highlighted} dot={<StatusDot status={status} />}
        name={part.name} sub={showVariant ? variantLabel(part.kind, part.variant) : undefined}
        num={keyNumber(part)} beyond={beyond.length ? beyond.map(researchKeyLabel).join(', ') : undefined}
        warn={status === 'late' ? 'Arrives after launch' : undefined}
        menu={removable ? <RowMenu title="Remove part" entries={[{ label: 'Remove part', danger: true, onPick: remove }]} /> : undefined} />
      {status === 'late' && !open && time && <div class="pm-alert-line">{time.text}</div>}
      {open && (
        <div class="row-detail">
          <div class="pm-status-line">
            <StatusPill status={status} />
            {time && <span class={`tiny${time.late ? ' err-text' : ' muted'}`}>{time.text}</span>}
          </div>
          {status === 'late' && <div class="pm-alert-line pm-inset">Move the launch later or order a replacement.</div>}
          {locked && (
            <div class="pm-beyond">
              <b><LockIcon /> Future tech</b> — {variantLabel(part.kind, part.variant)} is not researched yet. Beyond current research — procurement may pay more or get a less reliable part.
            </div>
          )}
          {defs.map((def) => (
            <StatSlider key={def.key} def={def} value={part.stats[def.key]} locked={!editable}
              limit={research[researchKey(part, def.key)]}
              onChange={(v) => actions.setPartStat(part.id, def.key, v)} />
          ))}
          <div class="mini-stats">
            <span title={part.kind === 'tank' ? 'Mass of the empty tank, without fuel' : undefined}>
              <span class="label">{part.kind === 'tank' ? 'Empty mass' : 'Mass'}</span><b class="num">{formatMass(partDryMassT(part))}</b>
            </span>
            {!contract && (
              <span><span class="label">Est. cost</span><b class="num">{formatMoney(estimatedCostM(part))}</b></span>
            )}
            {contract && (
              <span><span class="label">Supplier</span><b>{contract.supplier}</b></span>
            )}
            {(contract || reliability < 0.95) && (
              <span title="Chance this part works when needed"><span class="label">Reliability</span>
                <b class={`num${reliability < 0.95 ? ' warn-text' : ''}`}>{pctFine(reliability)}</b></span>
            )}
          </div>
          <div class="row-actions">
            {part.state === 'draft' && (
              <button class="pill primary small" onClick={() => actions.sendTask(part.id)}
                title="Send this part to procurement; its slider values become minimums">
                Order part
              </button>
            )}
            {part.state === 'sent' && (
              <span class="pm-ok">Ordered — procurement will find a supplier. Slider values are now minimums.</span>
            )}
            {(part.state === 'contracted' || part.state === 'delivered') && (
              <button class="pill small" onClick={() => orderReplacement(part, contract, ctx.startISO)}
                title="Order a new part with the same values. The old contract keeps running unless procurement cancels it.">
                Order a replacement…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
