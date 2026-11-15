import './panels.css';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type {
  Evaluation, Part, PartContract, PartKind, PayloadType, PlannerGame, PropulsionId, Spacecraft, Stage,
} from '../model/types';
import type { StatDef } from '../data/parts';
import { actions, getPlanner, useEvaluation, usePlanner } from '../state/store';
import {
  PAYLOAD_TYPE_LABEL, beyondResearch, estimatedCostM, partDryMassT, partReliability, researchKey,
  spacecraftWetMassT, stageDryMassT, stageFuelT, stageIsp, stageThrustKN, statDefs, unlockKey, variantLabel,
} from '../data/parts';
import { PROPULSION, PROPULSION_LIST } from '../data/propulsion';
import { G0, formatDay, formatDuration, formatDv, formatMass, formatMoney } from '../model/units';
import { allParts, findStage } from '../model/rocketUtils';
import { firstDvShortfall, tankFixCache } from '../fix';
import type { DvShortfall, TankFix } from '../fix';
import { Slider, StatValue, researchHint } from './Slider';
import { LockIcon, PlusIcon, fmtNum, highlightPart, pctFine, plural, useLocalUi, useOutsideClose } from './common';
import {
  EQUIPMENT_GROUPS, PAYLOAD_HINT, PROPULSION_HINT, STATUS_HINT, StatusDot, partStatus, researchKeyLabel, statLabel,
} from './partInfo';
import type { PartStatus } from './partInfo';
import { setAdvanced, useAdvanced } from './advanced';

// Rocket panel: one compact slider line per part stat, all visible at once.
// The Advanced switch adds fuel types, engine counts, stage order, add / remove
// menus and per-stage details; nothing here is a step the player must follow.

interface Ctx {
  ev: Evaluation;
  contracts: PartContract[];
  launchDay: number;
  startISO: string;
  research: Record<string, number>;
  unlocked: string[];
  advanced: boolean;
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
  return p.state === 'draft' || p.state === 'ordered';
}

/** Contracted, delivered or late: the part has a supplier. */
function hasSupplier(p: Part) {
  return p.state === 'contracted' || p.state === 'delivered' || p.state === 'late';
}

function fmtThrustKN(kn: number, ion: boolean): string {
  return ion ? `${fmtNum(kn * 1000)} N` : `${fmtNum(kn)} kN`;
}

function kms(ms: number): string {
  return `${(ms / 1000).toFixed(2)} km/s`;
}

/** Rocket stages by firing order: "Booster", then "Upper stage" (two stages) or "Stage 2", "Stage 3"… */
function rocketStageName(index: number, count: number): string {
  if (index === 0) return 'Booster';
  if (count === 2) return 'Upper stage';
  return `Stage ${index + 1}`;
}

const stop = (e: Event) => e.stopPropagation();

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

function AddMenu({ groups, title, label }: { groups: AddGroup[]; title: string; label?: string }) {
  const pop = usePopover();
  const [future, setFuture] = useState(false);
  const lockedCount = groups.reduce((s, g) => s + g.items.filter((i) => i.locked).length, 0);
  return (
    <div class="add-menu" ref={pop.ref} onClick={stop}>
      {label ? (
        <button class={`pill small rt-add-btn${pop.open ? ' active' : ''}`} title={title} onClick={pop.toggle}>
          <PlusIcon /> {label}
        </button>
      ) : (
        <button class={`round-btn small rt-add-round${pop.open ? ' active' : ''}`} title={title} aria-label={title} onClick={pop.toggle}>
          <PlusIcon />
        </button>
      )}
      {pop.open && (
        <div class={`popover glass strong pm-menu thin-scroll${pop.up ? ' up' : ''}${label ? ' rt-menu-left' : ''}`}>
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
  const unlocked = usePlanner((g) => g.unlocked);
  return PROPULSION_LIST.map((p) => ({
    label: p.name, hint: PROPULSION_HINT[p.id], onPick: () => add(p.id), locked: !unlocked.includes(unlockKey('engine', p.id)),
  }));
}

function PropulsionSelect({ value, onChange }: { value: PropulsionId; onChange: (p: PropulsionId) => void }) {
  const unlocked = usePlanner((g) => g.unlocked);
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

// ------------------------------------------------------------ Δv quick fix

/** Button text for a bigger tank on a stage, e.g. "Bigger upper-stage tank". */
function fixLabel(game: PlannerGame, stageId: string): string {
  const i = game.rocket.stages.findIndex((s) => s.id === stageId);
  if (i >= 0) {
    const n = rocketStageName(i, game.rocket.stages.length).toLowerCase();
    return `Bigger ${n === 'upper stage' ? 'upper-stage' : n} tank`;
  }
  const name = findStage(game.rocket, stageId)?.stage.name ?? 'stage';
  return `Bigger ${name.charAt(0).toLowerCase()}${name.slice(1)} tank`;
}

/**
 * The tank fix for the current design (fix.ts), computed shortly after the
 * design stops changing so dragging a slider stays smooth. 'pending' until then.
 */
function useTankFix(game: PlannerGame, ev: Evaluation): TankFix | undefined | 'pending' {
  const [, force] = useState(0);
  const ready = tankFixCache.has(game);
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => {
      tankFixCache.compute(game, ev);
      force((n) => n + 1);
    }, 120);
    return () => clearTimeout(t);
  }, [game, ready]);
  return ready ? tankFixCache.get(game) : 'pending';
}

function ProblemLine({ sf, game, ev }: { sf: DvShortfall; game: PlannerGame; ev: Evaluation }) {
  const fix = useTankFix(game, ev);
  const tank = fix !== 'pending' && fix?.kind === 'tank' ? fix : undefined;
  const cost = tank ? (tank.extraCostM < 0.05 ? 'under 0.1 M' : `about ${formatMoney(tank.extraCostM)}`) : '';
  return (
    <div class="rt-problem" role="status">
      <span class="rt-problem-text"><b>{kms(sf.shortMs)} short</b> at {sf.label}</span>
      {tank && (
        <button class="pill small primary rt-fix" onClick={() => actions.setPartStat(tank.tankId, 'fuelT', tank.toT)}
          title={`Fuel ${formatMass(tank.fromT)} → ${formatMass(tank.toT)}: the smallest tank that removes the shortfall (extra cost ${cost})`}>
          → {fixLabel(game, tank.stageId)}
        </button>
      )}
      {fix !== 'pending' && fix?.kind === 'none' && (
        <span class="rt-problem-none" title="No single tank within its slider range gives enough Δv. Try lighter parts, better engines or another stage.">
          No tank size fixes this
        </span>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Δv bar

function km1(ms: number, digits: number): string {
  return (ms / 1000).toFixed(digits);
}

function DvBar({ ev, short, massT }: { ev: Evaluation; short: boolean; massT: number }) {
  const root = ev.branches[0];
  const has = root?.dvAvailableTotalMs ?? 0;
  const needs = root?.dvRequiredTotalMs ?? 0;
  const planned = needs > 0;
  const enough = planned && !short && has >= needs;
  const tone = !planned ? '' : enough ? ' ok' : ' err';
  // One decimal unless that would hide the gap ("13.3 of 13.3").
  const digits = planned && km1(has, 1) === km1(needs, 1) && Math.abs(has - needs) >= 5 ? 2 : 1;
  const ratio = planned ? Math.min(1, has / needs) : 0;
  const title = `Speed change (Δv) the rocket can give${planned ? ' vs what the flight plan needs' : ''}. Launch mass ${formatMass(massT)}.`;
  return (
    <div class={`rt-dv${tone}`} title={title}>
      <div class="rt-dv-text">
        <span class="rt-dv-label">Δv</span>
        {planned ? (
          <span><b class="num">{km1(has, digits)}</b> of {km1(needs, digits)} km/s needed</span>
        ) : (
          <span><b class="num">{km1(has, 1)}</b> km/s <span class="muted">· plan a flight on the map</span></span>
        )}
      </div>
      <div class="rt-dv-bar"><div class="rt-dv-fill" style={{ width: `${ratio * 100}%` }} /></div>
    </div>
  );
}

// ------------------------------------------------------------ panel

export function RocketTab() {
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const advanced = useAdvanced();
  const rocket = game.rocket;
  const stageItems = usePropulsionItems((p) => actions.addStage('rocket', p));
  const ctx: Ctx = {
    ev, contracts: game.contracts, launchDay: game.plan.launchDay, startISO: game.mission.startDateISO,
    research: game.research, unlocked: game.unlocked, advanced,
  };

  const payloadMass = rocket.spacecraft.reduce((s, sc) => s + spacecraftWetMassT(sc), 0);
  const padMass = payloadMass + rocket.stages.reduce((s, st) => s + stageWetMassT(st), 0);
  const launchMass = ev.totalMassT || padMass;
  const sf = firstDvShortfall(ev);

  // Liftoff lift ratio of the 1st stage against Earth gravity (advanced details).
  const liftRatio = rocket.stages.length && padMass > 0 ? stageThrustKN(rocket.stages[0]) / (padMass * G0) : undefined;

  const drafts = allParts(rocket).filter((l) => l.part.state === 'draft');
  const orderAll = () => {
    if (!drafts.length) return;
    if (!confirm(`Order ${plural(drafts.length, 'draft part')}? Their slider values become minimums for procurement.`)) return;
    actions.orderAllParts();
  };

  return (
    <div class={`rocket-tab rt${advanced ? ' rt-advanced' : ''}`}>
      <DvBar ev={ev} short={!!sf} massT={launchMass} />
      {sf && <ProblemLine sf={sf} game={game} ev={ev} />}

      {rocket.spacecraft.map((sc) => <SpacecraftGroup key={sc.id} sc={sc} ctx={ctx} />)}
      {rocket.stages.map((_, i) => rocket.stages.length - 1 - i).map((i) => (
        <StageBlock key={rocket.stages[i].id} stage={rocket.stages[i]} ctx={ctx} index={i} count={rocket.stages.length}
          liftRatio={i === 0 ? liftRatio : undefined} />
      ))}
      {rocket.spacecraft.length === 0 && rocket.stages.length === 0 && (
        <div class="empty">Nothing in the design. Turn on Advanced to add a spacecraft and rocket stages.</div>
      )}

      {advanced && (
        <div class="rt-adds">
          <AddMenu label="Spacecraft" title="Add a spacecraft to the payload" groups={[{
            title: 'Add spacecraft',
            items: (Object.entries(PAYLOAD_TYPE_LABEL) as [PayloadType, string][]).map(([k, l]) => ({
              label: l, hint: PAYLOAD_HINT[k], onPick: () => actions.addSpacecraft(k),
            })),
          }]} />
          <AddMenu label="Rocket stage" title="Add a rocket stage on top (fires after the others)"
            groups={[{ title: 'Add stage on top', items: stageItems }]} />
        </div>
      )}

      <div class="rt-foot">
        <label class={`rt-switch${advanced ? ' on' : ''}`}
          title="Advanced: fuel types, engine counts, stage order, add or remove parts and stages, per-stage details and saved versions">
          <input type="checkbox" role="switch" checked={advanced} aria-checked={advanced}
            onChange={(e) => setAdvanced((e.currentTarget as HTMLInputElement).checked)} />
          <span class="rt-switch-track"><span class="rt-switch-knob" /></span>
          Advanced
        </label>
        <div class="spacer" />
        {drafts.length > 0 && (
          <button class="pill primary small" onClick={orderAll} title="Send every draft part to procurement; their slider values become minimums">
            Order {plural(drafts.length, 'part')}
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ groups

function GroupHead({ name, sub, editValue, renaming, onRename, onDone, menu, minor }: {
  name: string; sub?: string; editValue: string; renaming: boolean; onRename: (v: string) => void; onDone: () => void;
  menu?: ComponentChildren; minor?: boolean;
}) {
  return (
    <div class={minor ? 'rt-subhead' : 'rt-head'}>
      {renaming ? <NameEdit value={editValue} onCommit={onRename} onDone={onDone} /> : (
        <span class="rt-head-name">{name}{sub && <span class="rt-head-sub">{sub}</span>}</span>
      )}
      {menu}
    </div>
  );
}

function SpacecraftGroup({ sc, ctx }: { sc: Spacecraft; ctx: Ctx }) {
  const unlocked = usePlanner((g) => g.unlocked);
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

  const menu: MenuEntry[] = [
    { label: 'Rename', onPick: () => setRenaming(true) },
    { header: 'Type' },
    ...(Object.entries(PAYLOAD_TYPE_LABEL) as [PayloadType, string][]).map(([k, l]) => ({
      label: l, checked: sc.payloadType === k, title: PAYLOAD_HINT[k], onPick: () => actions.setPayloadType(sc.id, k),
    })),
    ...(sc.equipment.length ? [{ header: 'Equipment' }, ...sc.equipment.flatMap((p) => partMenuEntries(p, ctx, true))] : []),
    { header: '' },
    {
      label: 'Remove spacecraft', danger: true,
      onPick: () => confirm(`Remove ${sc.name} and all its parts? Running contracts are not cancelled.`) && actions.removeSpacecraft(sc.id),
    },
  ];

  return (
    <div class="rt-group">
      <GroupHead name={sc.name} editValue={sc.name} renaming={renaming} onRename={(v) => actions.renameSpacecraft(sc.id, v)} onDone={() => setRenaming(false)}
        menu={ctx.advanced && <>
          <RowMenu title={`${sc.name}: rename, type, remove`} entries={menu} />
          <AddMenu title="Add equipment or a propulsion stage" groups={groups} />
        </>} />
      {ctx.advanced && (
        <div class="rt-adv-stats rt-adv-indent">
          <span title={PAYLOAD_HINT[sc.payloadType]}>Type <b>{PAYLOAD_TYPE_LABEL[sc.payloadType]}</b></span>
          <span>Mass with fuel <b class="num">{formatMass(spacecraftWetMassT(sc))}</b></span>
        </div>
      )}
      {sc.equipment.length === 0 && sc.stages.length === 0 && (
        <div class="empty rt-adv-indent">No equipment or propulsion.{ctx.advanced ? ' Use + to add.' : ''}</div>
      )}
      {sc.equipment.map((p) => <PartLines key={p.id} part={p} ctx={ctx} />)}
      {sc.stages.map((_, i) => sc.stages.length - 1 - i).map((i) => (
        <StageBlock key={sc.stages[i].id} stage={sc.stages[i]} ctx={ctx} index={i} count={sc.stages.length} spacecraft={sc} />
      ))}
    </div>
  );
}

/** A rocket stage (its own group) or a spacecraft's propulsion stage (a sub-heading in the spacecraft's group). */
function StageBlock({ stage, ctx, index, count, spacecraft, liftRatio }: {
  stage: Stage; ctx: Ctx; index: number; count: number; spacecraft?: Spacecraft; liftRatio?: number;
}) {
  const [renaming, setRenaming] = useState(false);
  const rocketStage = !spacecraft;
  const name = rocketStage ? rocketStageName(index, count) : stage.name;
  // Rocket stages show their position; a custom name shows next to it in Advanced.
  const sub = rocketStage && ctx.advanced && stage.name !== name && !/^Stage \d+$/.test(stage.name) ? stage.name : undefined;

  const menu: MenuEntry[] = [
    { label: 'Rename', onPick: () => setRenaming(true) },
    { label: 'Fire earlier', disabled: index === 0, onPick: () => actions.moveStage(stage.id, -1), title: 'Swap with the stage that fires before it' },
    { label: 'Fire later', disabled: index >= count - 1, onPick: () => actions.moveStage(stage.id, 1), title: 'Swap with the stage that fires after it' },
    ...(() => {
      const parts = [
        ...partMenuEntries(stage.engine, ctx, false, 'engine'),
        ...stage.tanks.flatMap((t, i) => partMenuEntries(t, ctx, stage.tanks.length > 1, stage.tanks.length > 1 ? `tank ${i + 1}` : 'tank')),
      ];
      return parts.length ? [{ header: 'Parts' } as MenuEntry, ...parts] : [];
    })(),
    { header: '' },
    {
      label: 'Remove stage', danger: true,
      onPick: () => confirm(`Remove ${name}${sub ? ` (${sub})` : ''}? Running contracts are not cancelled.`) && actions.removeStage(stage.id),
    },
  ];

  return (
    <div class={rocketStage ? 'rt-group' : 'rt-stage'} data-stage-id={stage.id}>
      <GroupHead name={name} sub={sub} editValue={stage.name} renaming={renaming} minor={!rocketStage}
        onRename={(v) => actions.renameStage(stage.id, v)} onDone={() => setRenaming(false)}
        menu={ctx.advanced && <RowMenu title={`${name}: rename, fire order, order or replace parts, remove`} entries={menu} />} />
      {ctx.advanced && <StageDetails stage={stage} ctx={ctx} liftRatio={liftRatio} />}
      <PartLines part={stage.engine} ctx={ctx} engineCount={stage.engineCount} />
      {stage.tanks.map((t, i) => (
        <PartLines key={t.id} part={t} ctx={ctx} label={stage.tanks.length > 1 ? `Fuel ${i + 1}` : 'Fuel'} />
      ))}
    </div>
  );
}

/** Advanced: fuel type, engine count and the stage's numbers. */
function StageDetails({ stage, ctx, liftRatio }: { stage: Stage; ctx: Ctx; liftRatio?: number }) {
  const allDraft = stage.engine.state === 'draft' && stage.tanks.every((t) => t.state === 'draft');
  const engineEditable = isEditable(stage.engine);
  const band = stageBand(ctx.ev, stage.id);
  const dry = stageDryMassT(stage);
  const fuel = stageFuelT(stage);
  const ion = stage.propulsion === 'ion';
  const tooHeavy = liftRatio !== undefined && Number.isFinite(liftRatio) && liftRatio < 1;
  return (
    <div class="rt-adv-stage">
      <div class="rt-adv-controls">
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
      <div class="rt-adv-stats">
        <span title={`Empty ${formatMass(dry)} + fuel ${formatMass(fuel)}`}>Fuel + tank <b class="num">{formatMass(dry + fuel)}</b></span>
        <span title="Thrust of all engines together">Push <b class="num">{fmtThrustKN(stageThrustKN(stage), ion)}</b></span>
        <span title="Specific impulse: more seconds = more speed from the same fuel">Efficiency <b class="num">{fmtNum(stageIsp(stage))} s</b></span>
        <span title="Speed change (Δv) this stage can give, and how much of it the flight plan uses">
          Δv <b class="num">{band ? formatDv(band.dvTotalMs) : '—'}</b>{band && band.dvUsedMs > 0 && <> · used <b class="num">{formatDv(band.dvUsedMs)}</b></>}
        </span>
        {liftRatio !== undefined && Number.isFinite(liftRatio) && (
          <span title="Push divided by the weight of the whole rocket at liftoff; must be above 1 to leave the pad">
            Lift ratio <b class={`num${tooHeavy ? ' err-text' : ''}`}>{liftRatio.toFixed(2)}</b>
          </span>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ part lines

/** Timing for a part: needed by / arrives / late / delivered. */
function timing(status: PartStatus, contract: PartContract | undefined, ctx: Ctx): string | undefined {
  const d = (day: number) => formatDay(day, ctx.startISO);
  switch (status) {
    case 'draft': return undefined;
    case 'ordered': return `Needed by ${d(ctx.launchDay)} (launch)`;
    case 'delivered': return contract ? `Delivered ${d(contract.deliveryDay)}` : 'Delivered';
    case 'contracted':
      return contract
        ? `Arrives ${d(contract.deliveryDay)} (${formatDuration(ctx.launchDay - contract.deliveryDay)} before launch)`
        : 'On its way';
    case 'late':
      return `Arrives ${contract ? d(contract.deliveryDay) : '?'}, ${formatDuration((contract?.deliveryDay ?? ctx.launchDay) - ctx.launchDay)} after launch: move the launch or order a replacement`;
  }
}

/** Replace a contracted/delivered part with a new order (same values; still adjustable while ordered). */
function orderReplacement(part: Part, contract: PartContract | undefined, startISO: string) {
  const when = contract
    ? contract.status === 'delivered' ? `was delivered on ${formatDay(contract.deliveryDay, startISO)}` : `arrives ${formatDay(contract.deliveryDay, startISO)}`
    : 'is already contracted';
  const msg = `Order a replacement for ${part.name}?\n\nThe current part ${when}. Its contract${contract ? ` with ${contract.supplier}` : ''} keeps running (and its money stays spent) unless procurement cancels it.\n\nThe replacement is ordered with the same values; you can still adjust its sliders until procurement signs a supplier.`;
  if (!confirm(msg)) return;
  if (!allParts(getPlanner().rocket).some((l) => l.part.id === part.id)) return;
  highlightPart(actions.replacePart(part.id, true));
}

/** Name of a slider line: engines "Push (thrust)" / "Efficiency (Isp)", tanks "Fuel", equipment its part name. */
function lineName(part: Part, def: StatDef, label: string | undefined): ComponentChildren {
  if (def.key === 'thrustKN') return <>Push <span class="rt-jargon">(thrust)</span></>;
  if (def.key === 'isp') return <>Efficiency <span class="rt-jargon">(Isp)</span></>;
  if (label) return label;
  if (part.kind === 'tank') return 'Fuel';
  return part.name;
}

/** Everything about a part that is not a slider, for the line's tooltip. */
function partTooltip(part: Part, contract: PartContract | undefined, status: PartStatus, time: string | undefined, ctx: Ctx, engineCount?: number): string {
  const lines: string[] = [part.name];
  if (part.kind !== 'engine' && part.kind !== 'tank' && part.name !== variantLabel(part.kind, part.variant)) lines[0] += ` (${variantLabel(part.kind, part.variant)})`;
  if (engineCount && engineCount > 1) lines.push(`${engineCount} engines; push is per engine`);
  lines.push(STATUS_HINT[status] + (time ? `. ${time}` : ''));
  const mass = part.kind === 'tank' ? `Empty tank ${formatMass(partDryMassT(part))}` : `Mass ${formatMass(partDryMassT(part))}`;
  lines.push(contract ? `${mass} · Supplier ${contract.supplier}` : `${mass} · Est. cost ${formatMoney(estimatedCostM(part))}`);
  const rel = partReliability(part);
  if (contract || rel < 0.95) lines.push(`Reliability ${pctFine(rel)}`);
  if (!ctx.unlocked.includes(unlockKey(part.kind, part.variant))) {
    lines.push(`Future tech: ${variantLabel(part.kind, part.variant)} is not researched yet. Procurement may pay more or get a less reliable part.`);
  }
  const beyond = beyondResearch(part, ctx.research, ctx.unlocked).filter((k) => k.split('.').length > 2);
  if (beyond.length) lines.push(`Beyond current research: ${beyond.map(researchKeyLabel).join(', ')}`);
  if (!isEditable(part)) lines.push('Fixed by contract: the slider is locked.');
  return lines.join('\n');
}

/** Advanced ⋯ menu entries for one part: order it, order a replacement, remove it. */
function partMenuEntries(part: Part, ctx: Ctx, removable: boolean, name = part.name): MenuEntry[] {
  const out: MenuEntry[] = [];
  const contract = part.contractId ? ctx.contracts.find((c) => c.id === part.contractId) : undefined;
  if (part.state === 'draft') {
    out.push({ label: `Order ${name}`, onPick: () => actions.orderPart(part.id), title: 'Send this part to procurement; its slider values become minimums' });
  }
  if (hasSupplier(part)) {
    out.push({
      label: `Replace ${name}…`, onPick: () => orderReplacement(part, contract, ctx.startISO),
      title: 'Order a new part with the same values. The old contract keeps running unless procurement cancels it.',
    });
  }
  if (removable) {
    out.push({
      label: `Remove ${name}`, danger: true,
      onPick: () => {
        if (hasSupplier(part) && !confirm(`Remove ${part.name}? Its contract keeps running; only procurement can cancel it.`)) return;
        actions.removePart(part.id);
      },
    });
  }
  return out;
}

function PartLines({ part, ctx, engineCount, label }: {
  part: Part; ctx: Ctx; engineCount?: number; label?: string;
}) {
  const highlighted = useLocalUi((s) => s.highlightPartId === part.id);
  const nonce = useLocalUi((s) => s.highlightNonce);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted, nonce]);

  const contract = part.contractId ? ctx.contracts.find((c) => c.id === part.contractId) : undefined;
  const status = partStatus(part);
  const editable = isEditable(part);
  const defs = statDefs(part.kind, part.variant);
  const time = timing(status, contract, ctx);
  const tip = partTooltip(part, contract, status, time, ctx, engineCount);
  const dotTitle = STATUS_HINT[status] + (time ? `\n${time}` : '');

  return (
    <div ref={ref} class={`rt-part${highlighted ? ' highlight' : ''}`}>
      {defs.map((def, i) => {
        const value = part.stats[def.key];
        const limit = ctx.research[researchKey(part, def.key)];
        const beyond = limit !== undefined && value > limit + 1e-9;
        const sliderTitle = !editable ? 'Fixed by contract' : researchHint(def, value, limit) ?? statLabel(def);
        return (
          <div class="rt-line" key={def.key}>
            {i === 0 ? <StatusDot status={status} title={dotTitle} /> : <span />}
            <span class="rt-name" title={tip}>
              <span class="rt-name-text">{lineName(part, def, label)}</span>
              {i === 0 && engineCount !== undefined && engineCount > 1 && <span class="rt-jargon"> ×{engineCount}</span>}
              {!editable && <span class="rt-lock"><LockIcon title="Fixed by contract" /></span>}
            </span>
            <Slider min={def.min} max={def.max} step={def.step} scale={def.scale} value={value} limit={limit}
              disabled={!editable} title={sliderTitle} onChange={(v) => actions.setPartStat(part.id, def.key, v)} />
            <StatValue def={def} value={value} locked={!editable} beyond={beyond}
              onChange={(v) => actions.setPartStat(part.id, def.key, v)} />
          </div>
        );
      })}
      {part.supplyDetails && (
        <div class="rt-supply small muted">
          Supply: {part.supplyDetails.contributions.reduce((n, x) => n + x.quantity, 0)}/{part.supplyDetails.need} units
          {part.supplyDetails.contributions.map((lot, index) => (
            <div key={index}>
              {lot.quantity} × {lot.supplier} · {lot.status === 'delivered' ? 'delivered' : 'expected'} {formatDay(lot.day, ctx.startISO)}
              {!lot.compatible ? ' · incompatible' : ''}
            </div>
          ))}
          {part.supplyDetails.incompatible && <div class="err-text">Incompatible supply. Match the required hardware and unit mass.</div>}
        </div>
      )}
    </div>
  );
}
