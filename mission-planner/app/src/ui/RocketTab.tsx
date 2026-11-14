import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Evaluation, Part, PartKind, PartState, PayloadType, PropulsionId, Spacecraft, Stage } from '../model/types';
import { actions, useEvaluation, useGame } from '../state/store';
import {
  EQUIPMENT_KINDS, PART_KIND_LABEL, PAYLOAD_TYPE_LABEL, VARIANTS, beyondResearch, estimatedCostM,
  partDryMassT, partReliability, researchKey, spacecraftWetMassT, stageDryMassT, stageFuelT, stageIsp, stageThrustKN,
  statDefs, unlockKey, variantLabel,
} from '../data/parts';
import { PROPULSION, PROPULSION_LIST } from '../data/propulsion';
import { G0, formatDv, formatMass, formatMoney } from '../model/units';
import { StatSlider } from './Slider';
import {
  ArrowDownIcon, ArrowUpIcon, ChevronIcon, LockIcon, PART_STATE_LABEL, PlusIcon, TrashIcon, fmtNum, localUi, pctFine,
  useLocalUi, useOutsideClose,
} from './common';

// ------------------------------------------------------------ helpers

function stageBand(ev: Evaluation, stageId: string) {
  for (const b of ev.branches) {
    const band = b.stageBands.find((x) => x.stageId === stageId);
    if (band) return band;
  }
  return undefined;
}

function stageTwrFromResults(ev: Evaluation, stageId: string): number | undefined {
  for (const b of ev.branches) {
    for (const m of b.maneuvers) {
      if (m.twr !== undefined && m.burns[0]?.stageId === stageId) return m.twr;
    }
  }
  return undefined;
}

function stageWetMassT(s: Stage): number {
  return stageDryMassT(s) + stageFuelT(s);
}

function isEditable(p: Part) {
  return p.state === 'draft' || p.state === 'sent';
}

const STATE_ORDER: PartState[] = ['draft', 'sent', 'contracted', 'delivered'];
function lowestState(parts: Part[]): PartState {
  let i = 3;
  for (const p of parts) i = Math.min(i, STATE_ORDER.indexOf(p.state));
  return STATE_ORDER[i];
}

function fmtThrustKN(kn: number, ion: boolean): string {
  return ion ? `${fmtNum(kn * 1000)} N` : `${fmtNum(kn)} kN`;
}

/** The one number shown on a collapsed part row. */
function keyNumber(p: Part): string {
  const s = p.stats;
  switch (p.kind) {
    case 'engine': return `${fmtThrustKN(s.thrustKN, p.variant === 'ion')} · ${fmtNum(s.isp)} s`;
    case 'tank': return formatMass(s.fuelT);
    case 'instrument': return `perf ${fmtNum(s.performance)}`;
    case 'power': return `${fmtNum(s.outputKW)} kW`;
    case 'antenna': return `${fmtNum(s.dataRateKbps)} kbps`;
    case 'legs': return `≤ ${formatMass(s.maxLandingMassT)}`;
    case 'heatShield': return `≤ ${formatMass(s.maxEntryMassT)}`;
    case 'radShield':
    case 'heatProtection': return `level ${fmtNum(s.level)}`;
  }
}

function StateDot({ state }: { state: PartState }) {
  return <span class={`state-dot sd-${state}`} title={PART_STATE_LABEL[state]} />;
}

// ------------------------------------------------------------ add menu

interface MenuItem { label: string; sub?: string; onPick: () => void; locked?: boolean }
interface MenuGroup { title: string; items: MenuItem[] }

function AddMenu({ groups, title }: { groups: MenuGroup[]; title: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  return (
    <div class="add-menu" ref={ref}>
      <button class={`round-btn small${open ? ' active' : ''}`} title={title}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <PlusIcon />
      </button>
      {open && (
        <div class="popover glass strong menu-pop thin-scroll">
          {groups.map((g) => (
            <div class="menu-group" key={g.title}>
              <div class="label">{g.title}</div>
              {g.items.map((it) => (
                <button class="menu-item" key={it.label} title={it.locked ? 'Not unlocked yet: can be planned with, flagged beyond research' : undefined}
                  onClick={() => { setOpen(false); it.onPick(); }}>
                  <span>{it.label}</span>
                  {it.sub && <span class="muted tiny">{it.sub}</span>}
                  {it.locked && <span class="lock-mark"><LockIcon /></span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function useStageItems(add: (p: PropulsionId) => void): MenuItem[] {
  const unlocked = useGame((g) => g.unlocked);
  return PROPULSION_LIST.map((p) => ({
    label: p.name, onPick: () => add(p.id), locked: !unlocked.includes(unlockKey('engine', p.id)),
  }));
}

// ------------------------------------------------------------ panel

export function RocketTab() {
  const rocket = useGame((g) => g.rocket);
  const ev = useEvaluation();
  const payloadMass = rocket.spacecraft.reduce((s, sc) => s + spacecraftWetMassT(sc), 0);
  const launchMass = ev.totalMassT || payloadMass + rocket.stages.reduce((s, st) => s + stageWetMassT(st), 0);
  const dvAvail = ev.branches[0]?.dvAvailableTotalMs ?? 0;
  const stageItems = useStageItems((p) => actions.addStage('rocket', p));

  // Rocket-stage TWR at ignition against Earth gravity: everything above (and including) the stage.
  const rocketTwr = (index: number) => {
    let mass = payloadMass;
    for (let j = index; j < rocket.stages.length; j++) mass += stageWetMassT(rocket.stages[j]);
    return mass > 0 ? stageThrustKN(rocket.stages[index]) / (mass * G0) : undefined;
  };

  return (
    <div class="rocket-tab">
      <div class="stat-trio">
        <div title="Total mass on the pad"><span class="label">Launch mass</span><b class="num">{formatMass(launchMass)}</b></div>
        <div title="Δv of the whole stack (first branch)"><span class="label">Δv available</span><b class="num">{formatDv(dvAvail)}</b></div>
        <div title="Estimated cost of the design: draft and sent parts estimated, contracted parts at contract price">
          <span class="label">Est. cost</span><b class="num">{formatMoney(ev.totalCostM)}</b>
        </div>
      </div>

      <div class="group-title">
        <span class="label">Payload</span>
        <div class="spacer" />
        <AddMenu title="Add spacecraft" groups={[{
          title: 'Add spacecraft',
          items: (Object.entries(PAYLOAD_TYPE_LABEL) as [PayloadType, string][]).map(([k, l]) => ({ label: l, onPick: () => actions.addSpacecraft(k) })),
        }]} />
      </div>
      {rocket.spacecraft.length === 0 && <div class="empty">No spacecraft.</div>}
      {rocket.spacecraft.map((sc) => <SpacecraftGroup key={sc.id} sc={sc} ev={ev} />)}

      <div class="group-title">
        <span class="label" title="Top to bottom as stacked: the upper stage fires last, the booster first">Launch vehicle</span>
        <div class="spacer" />
        <AddMenu title="Add rocket stage" groups={[{ title: 'Add stage on top', items: stageItems }]} />
      </div>
      <div class="group">
        {rocket.stages.length === 0 && <div class="empty">No rocket stages.</div>}
        {rocket.stages.map((_, i) => rocket.stages.length - 1 - i).map((i) => (
          <StageRow key={rocket.stages[i].id} stage={rocket.stages[i]} ev={ev}
            canUp={i < rocket.stages.length - 1} canDown={i > 0}
            twr={i === 0 ? rocketTwr(i) : undefined} twrLabel="Liftoff TWR (Earth)" position={i === 0 ? 'Booster · fires first' : `Stage ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

function SpacecraftGroup({ sc, ev }: { sc: Spacecraft; ev: Evaluation }) {
  const unlocked = useGame((g) => g.unlocked);
  const open = useLocalUi((s) => s.openSpacecraftId === sc.id);
  const stageItems = useStageItems((p) => actions.addStage(sc.id, p));
  const equipmentGroups: MenuGroup[] = [{
    title: 'Add equipment',
    items: EQUIPMENT_KINDS.flatMap((k) => VARIANTS[k].map((v) => ({
      label: VARIANTS[k].length > 1 ? variantLabel(k, v) : PART_KIND_LABEL[k],
      sub: VARIANTS[k].length > 1 ? PART_KIND_LABEL[k] : undefined,
      locked: !unlocked.includes(unlockKey(k, v)),
      onPick: () => actions.addEquipment(sc.id, k as PartKind, v),
    }))),
  }, { title: 'Add spacecraft stage', items: stageItems }];
  const allParts = [...sc.equipment, ...sc.stages.flatMap((s) => [s.engine, ...s.tanks])];

  return (
    <div class="group">
      <div class={`row group-head${open ? ' open' : ''}`}
        onClick={() => localUi.update((s) => { s.openSpacecraftId = open ? null : sc.id; })}>
        {allParts.length > 0 ? <StateDot state={lowestState(allParts)} /> : <span class="state-dot sd-draft" />}
        <span class="row-name strong">{sc.name}</span>
        <span class="row-num muted">{PAYLOAD_TYPE_LABEL[sc.payloadType]} · {formatMass(spacecraftWetMassT(sc))}</span>
        <div onClick={(e) => e.stopPropagation()}>
          <AddMenu title="Add equipment or stage" groups={equipmentGroups} />
        </div>
      </div>
      {open && (
        <div class="row-detail">
          <div class="field-row">
            <input class="name-input" value={sc.name} title="Spacecraft name"
              onChange={(e) => actions.renameSpacecraft(sc.id, (e.currentTarget as HTMLInputElement).value)} />
            <select value={sc.payloadType} title="Payload type"
              onChange={(e) => actions.setPayloadType(sc.id, (e.currentTarget as HTMLSelectElement).value as PayloadType)}>
              {Object.entries(PAYLOAD_TYPE_LABEL).map(([k, l]) => <option value={k}>{l}</option>)}
            </select>
            <button class="round-btn small danger" title="Remove spacecraft and all its parts"
              onClick={() => confirm(`Remove ${sc.name} and all its parts? Running contracts are not cancelled.`) && actions.removeSpacecraft(sc.id)}>
              <TrashIcon />
            </button>
          </div>
        </div>
      )}
      <div class="group-body">
        {sc.equipment.length === 0 && sc.stages.length === 0 && <div class="empty">No equipment or propulsion.</div>}
        {sc.equipment.map((p) => <PartRow key={p.id} part={p} removable />)}
        {sc.stages.map((_, i) => sc.stages.length - 1 - i).map((i) => (
          <StageRow key={sc.stages[i].id} stage={sc.stages[i]} ev={ev}
            canUp={i < sc.stages.length - 1} canDown={i > 0}
            twr={stageTwrFromResults(ev, sc.stages[i].id)} twrLabel="TWR (local)"
            position={sc.stages.length > 1 ? (i === 0 ? 'fires first' : `fires ${i + 1}.`) : undefined} />
        ))}
      </div>
    </div>
  );
}

function PropulsionSelect({ value, onChange }: { value: PropulsionId; onChange: (p: PropulsionId) => void }) {
  const unlocked = useGame((g) => g.unlocked);
  return (
    <select value={value} title="Propulsion" onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value as PropulsionId)}>
      {PROPULSION_LIST.map((p) => {
        const locked = !unlocked.includes(unlockKey('engine', p.id));
        return <option value={p.id}>{p.name}{locked ? ' (locked)' : ''}</option>;
      })}
    </select>
  );
}

function StageRow({ stage, ev, canUp, canDown, twr, twrLabel, position }: {
  stage: Stage; ev: Evaluation; canUp: boolean; canDown: boolean; twr?: number; twrLabel: string; position?: string;
}) {
  const open = useLocalUi((s) => s.openStageId === stage.id);
  const allDraft = stage.engine.state === 'draft' && stage.tanks.every((t) => t.state === 'draft');
  const band = stageBand(ev, stage.id);
  const engineEditable = isEditable(stage.engine);
  const dry = stageDryMassT(stage);
  const fuel = stageFuelT(stage);
  const ion = stage.propulsion === 'ion';
  const twrBad = twr !== undefined && Number.isFinite(twr) && twr < 1;
  const toggle = () => localUi.update((s) => {
    s.openStageId = open ? null : stage.id;
    s.openPartId = null;
  });

  return (
    <div class={`stage${open ? ' open' : ''}`}>
      <Row open={open} onClick={toggle} dot={<StateDot state={lowestState([stage.engine, ...stage.tanks])} />}
        name={stage.name}
        num={band ? formatDv(band.dvTotalMs) : '—'}
        numTitle={`${PROPULSION[stage.propulsion].name}${position ? ` · ${position}` : ''} · Δv this stage can give`}
        warn={twrBad ? `${twrLabel} ${twr!.toFixed(2)} < 1` : undefined} />
      {open && (
        <div class="row-detail stage-detail">
          <div class="field-row">
            <input class="name-input" value={stage.name} title="Stage name"
              onChange={(e) => actions.renameStage(stage.id, (e.currentTarget as HTMLInputElement).value)} />
            <button class="round-btn small" title="Move up (fires later)" disabled={!canUp} onClick={() => actions.moveStage(stage.id, 1)}><ArrowUpIcon /></button>
            <button class="round-btn small" title="Move down (fires earlier)" disabled={!canDown} onClick={() => actions.moveStage(stage.id, -1)}><ArrowDownIcon /></button>
            <button class="round-btn small danger" title="Remove stage"
              onClick={() => confirm(`Remove ${stage.name}? Running contracts are not cancelled.`) && actions.removeStage(stage.id)}>
              <TrashIcon />
            </button>
          </div>
          <div class="field-row">
            {allDraft ? (
              <PropulsionSelect value={stage.propulsion} onChange={(p) => actions.setStagePropulsion(stage.id, p)} />
            ) : (
              <span class="tag" title="Propulsion is fixed once a part of the stage is sent to procurement">{PROPULSION[stage.propulsion].name}</span>
            )}
            <div class="stepper" title={`${stage.engineCount} engine${stage.engineCount > 1 ? 's' : ''}`}>
              <button class="round-btn small" disabled={!engineEditable || stage.engineCount <= 1} onClick={() => actions.setEngineCount(stage.id, stage.engineCount - 1)}>−</button>
              <span class="num">{stage.engineCount}×</span>
              <button class="round-btn small" disabled={!engineEditable || stage.engineCount >= 30} onClick={() => actions.setEngineCount(stage.id, stage.engineCount + 1)}>+</button>
            </div>
          </div>
          <div class="mini-stats">
            <span title={`Dry ${formatMass(dry)} · fuel ${formatMass(fuel)}`}><span class="label">Wet</span><b class="num">{formatMass(dry + fuel)}</b></span>
            <span><span class="label">Thrust</span><b class="num">{fmtThrustKN(stageThrustKN(stage), ion)}</b></span>
            <span><span class="label">Isp</span><b class="num">{fmtNum(stageIsp(stage))} s</b></span>
            {twr !== undefined && Number.isFinite(twr) && (
              <span title={twrLabel}><span class="label">TWR</span><b class={`num${twrBad ? ' err-text' : ''}`}>{twr.toFixed(2)}</b></span>
            )}
          </div>
          <div class="muted tiny">
            {position && `${position} · `}Δv {band ? formatDv(band.dvTotalMs) : '—'}
            {band && band.dvUsedMs > 0 && `, used ${formatDv(band.dvUsedMs)}`}
          </div>
          <div class="sub-rows">
            <PartRow part={stage.engine} />
            {stage.tanks.map((t) => <PartRow key={t.id} part={t} removable={stage.tanks.length > 1} />)}
            <button class="pill ghost small add-tank" onClick={() => actions.addTank(stage.id)}><PlusIcon /> Tank</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ open, onClick, dot, name, sub, num, numTitle, warn, beyond, rowRef, highlight }: {
  open: boolean; onClick: () => void; dot: ComponentChildren; name: string; sub?: string; num: string; numTitle?: string;
  warn?: string; beyond?: string; rowRef?: RefObject<HTMLDivElement>; highlight?: boolean;
}) {
  return (
    <div ref={rowRef} class={`row${open ? ' open' : ''}${highlight ? ' highlight' : ''}`} onClick={onClick}>
      {dot}
      <span class="row-name" title={name}>{name}{sub && <span class="row-sub">{sub}</span>}</span>
      {beyond && <span class="beyond-mark" title={`Beyond research: ${beyond}`}>!</span>}
      {warn && <span class="err-mark" title={warn}>!</span>}
      <span class="row-num num" title={numTitle}>{num}</span>
      <ChevronIcon open={open} />
    </div>
  );
}

function PartRow({ part, removable }: { part: Part; removable?: boolean }) {
  const research = useGame((g) => g.research);
  const unlocked = useGame((g) => g.unlocked);
  const contract = useGame((g) => (part.contractId ? g.contracts.find((c) => c.id === part.contractId) : undefined));
  const open = useLocalUi((s) => s.openPartId === part.id);
  const highlighted = useLocalUi((s) => s.highlightPartId === part.id);
  const nonce = useLocalUi((s) => s.highlightNonce);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted, nonce]);

  const editable = isEditable(part);
  const defs = statDefs(part.kind, part.variant);
  const beyond = beyondResearch(part, research, unlocked);
  const locked = !unlocked.includes(unlockKey(part.kind, part.variant));
  const showVariant = part.kind !== 'engine' && part.kind !== 'tank' && VARIANTS[part.kind].length > 1 && part.name !== variantLabel(part.kind, part.variant);
  const toggle = () => localUi.update((s) => { s.openPartId = open ? null : part.id; });

  return (
    <div class={`part${open ? ' open' : ''}`}>
      <Row rowRef={ref} open={open} onClick={toggle} highlight={highlighted} dot={<StateDot state={part.state} />}
        name={part.name} sub={showVariant ? variantLabel(part.kind, part.variant) : undefined}
        num={keyNumber(part)} beyond={beyond.length ? beyond.join(', ') : undefined} />
      {open && (
        <div class="row-detail">
          <div class="badges">
            <span class={`state-pill sp-${part.state}`}>{!editable && <LockIcon />} {PART_STATE_LABEL[part.state]}</span>
            {locked && <span class="state-pill warn" title="Part variant not unlocked yet"><LockIcon /> locked</span>}
            {beyond.length > 0 && (
              <span class="state-pill warn" title={`Needs research, an unlock, a costly purchase, or diplomacy: ${beyond.join(', ')}`}>beyond research</span>
            )}
          </div>
          {defs.map((def) => (
            <StatSlider key={def.key} def={def} value={part.stats[def.key]} locked={!editable}
              limit={research[researchKey(part, def.key)]}
              onChange={(v) => actions.setPartStat(part.id, def.key, v)} />
          ))}
          <div class="mini-stats">
            <span title={part.kind === 'tank' ? 'Dry mass of the tank' : undefined}><span class="label">Mass</span><b class="num">{formatMass(partDryMassT(part))}</b></span>
            {contract ? (
              <span><span class="label">Price</span><b class="num">{formatMoney(contract.priceM)}</b></span>
            ) : (
              <span><span class="label">Est. cost</span><b class="num">{formatMoney(estimatedCostM(part))}</b></span>
            )}
            <span><span class="label">Reliability</span><b class="num">{pctFine(partReliability(part))}</b></span>
          </div>
          <div class="row-actions">
            {part.state === 'draft' && (
              <button class="pill primary small" onClick={() => actions.sendTask(part.id)}
                title="Send this part's slider values to procurement as minimums">
                Send to procurement
              </button>
            )}
            {part.state === 'sent' && <span class="muted tiny" title="Slider edits update the procurement task">Task sent · edits update it</span>}
            {(part.state === 'contracted' || part.state === 'delivered') && (
              <button class="pill small" title="Creates a new draft with the same stats. The old contract keeps running; only procurement can cancel it."
                onClick={() => confirm('Replace this part with a new draft? The old contract keeps running; only procurement can cancel it.') && actions.replacePart(part.id)}>
                Replace
              </button>
            )}
            <div class="spacer" />
            {removable && (
              <button class="round-btn small danger" title="Remove part" onClick={() => {
                if (part.state === 'contracted' || part.state === 'delivered') {
                  if (!confirm(`Remove ${part.name}? Its contract keeps running; only procurement can cancel it.`)) return;
                }
                actions.removePart(part.id);
              }}><TrashIcon /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
