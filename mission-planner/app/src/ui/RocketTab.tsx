import { useEffect, useRef, useState } from 'preact/hooks';
import type { Evaluation, Part, PartKind, PayloadType, PropulsionId, Spacecraft, Stage } from '../model/types';
import { actions, useEvaluation, useGame } from '../state/store';
import {
  EQUIPMENT_KINDS, PART_KIND_LABEL, PAYLOAD_TYPE_LABEL, VARIANTS, beyondResearch, equipmentMassT, estimatedCostM,
  partDryMassT, partReliability, researchKey, spacecraftWetMassT, stageDryMassT, stageFuelT, stageIsp, stageThrustKN,
  statDefs, unlockKey, variantLabel,
} from '../data/parts';
import { PROPULSION, PROPULSION_LIST } from '../data/propulsion';
import { G0, formatDv, formatMass, formatMoney } from '../model/units';
import { StatSlider } from './Slider';
import { LockIcon, PART_STATE_LABEL, fmtNum, pctFine, useLocalUi } from './common';

function stageBand(ev: Evaluation, stageId: string) {
  const root = ev.branches[0]?.stageBands.find((b) => b.stageId === stageId);
  if (root) return root;
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

function fmtThrust(stage: Stage): string {
  const kn = stageThrustKN(stage);
  return stage.propulsion === 'ion' ? `${fmtNum(kn * 1000)} N` : `${fmtNum(kn)} kN`;
}

export function RocketTab() {
  const rocket = useGame((g) => g.rocket);
  const ev = useEvaluation();
  const [newPayload, setNewPayload] = useState<PayloadType>('orbiter');
  const [newProp, setNewProp] = useState<PropulsionId>('kerolox');
  const payloadMass = rocket.spacecraft.reduce((s, sc) => s + spacecraftWetMassT(sc), 0);

  // Rocket-stage TWR at ignition against Earth gravity: everything above (and including) the stage.
  const rocketTwr = (index: number) => {
    let mass = payloadMass;
    for (let j = index; j < rocket.stages.length; j++) mass += stageWetMassT(rocket.stages[j]);
    return mass > 0 ? stageThrustKN(rocket.stages[index]) / (mass * G0) : undefined;
  };

  return (
    <div class="rocket-tab">
      <div class="summary-grid">
        <div><span class="muted">Launch mass</span><b class="num">{formatMass(ev.totalMassT || payloadMass + rocket.stages.reduce((s, st) => s + stageWetMassT(st), 0))}</b></div>
        <div><span class="muted">Payload</span><b class="num">{formatMass(payloadMass)}</b></div>
        <div><span class="muted">Est. cost</span><b class="num">{formatMoney(ev.totalCostM)}</b></div>
      </div>

      <div class="section-head">
        <h3>Payload</h3>
        <div class="inline">
          <select value={newPayload} onChange={(e) => setNewPayload((e.currentTarget as HTMLSelectElement).value as PayloadType)}>
            {Object.entries(PAYLOAD_TYPE_LABEL).map(([k, l]) => <option value={k}>{l}</option>)}
          </select>
          <button class="btn small" onClick={() => actions.addSpacecraft(newPayload)}>+ Spacecraft</button>
        </div>
      </div>
      {rocket.spacecraft.length === 0 && <p class="empty">No spacecraft. Add one to carry instruments.</p>}
      {rocket.spacecraft.map((sc) => <SpacecraftCard key={sc.id} sc={sc} ev={ev} />)}

      <div class="section-head">
        <h3>Rocket stages</h3>
        <div class="inline">
          <PropulsionSelect value={newProp} onChange={setNewProp} />
          <button class="btn small" onClick={() => actions.addStage('rocket', newProp)}>+ Stage</button>
        </div>
      </div>
      <p class="hint">Top to bottom as stacked: the upper stage fires last, the booster first.</p>
      {rocket.stages.length === 0 && <p class="empty">No rocket stages.</p>}
      {rocket.stages.map((_, i) => rocket.stages.length - 1 - i).map((i) => (
        <StageCard key={rocket.stages[i].id} stage={rocket.stages[i]} ev={ev}
          canUp={i < rocket.stages.length - 1} canDown={i > 0}
          twr={rocketTwr(i)} twrLabel="TWR (Earth)" position={i === 0 ? 'Booster · fires first' : `Stage ${i + 1}`} />
      ))}
    </div>
  );
}

function PropulsionSelect({ value, onChange, disabled }: { value: PropulsionId; onChange: (p: PropulsionId) => void; disabled?: boolean }) {
  const unlocked = useGame((g) => g.unlocked);
  return (
    <select value={value} disabled={disabled} onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value as PropulsionId)}>
      {PROPULSION_LIST.map((p) => {
        const locked = !unlocked.includes(unlockKey('engine', p.id));
        return <option value={p.id}>{p.name}{locked ? ' (locked)' : ''}</option>;
      })}
    </select>
  );
}

function SpacecraftCard({ sc, ev }: { sc: Spacecraft; ev: Evaluation }) {
  const unlocked = useGame((g) => g.unlocked);
  const [kind, setKind] = useState<PartKind>('instrument');
  const [variant, setVariant] = useState<string>(VARIANTS.instrument[0]);
  const [prop, setProp] = useState<PropulsionId>('hypergolic');
  const variantLocked = !unlocked.includes(unlockKey(kind, variant));

  return (
    <div class="card sc-card">
      <div class="card-head">
        <input class="name-input" value={sc.name} onChange={(e) => actions.renameSpacecraft(sc.id, (e.currentTarget as HTMLInputElement).value)} />
        <select value={sc.payloadType} onChange={(e) => actions.setPayloadType(sc.id, (e.currentTarget as HTMLSelectElement).value as PayloadType)}>
          {Object.entries(PAYLOAD_TYPE_LABEL).map(([k, l]) => <option value={k}>{l}</option>)}
        </select>
        <button class="btn small danger ghost" title="Remove spacecraft"
          onClick={() => confirm(`Remove ${sc.name} and all its parts? Running contracts are not cancelled.`) && actions.removeSpacecraft(sc.id)}>
          Remove
        </button>
      </div>
      <div class="derived">
        <span>Wet <b class="num">{formatMass(spacecraftWetMassT(sc))}</b></span>
        <span>Equipment <b class="num">{formatMass(equipmentMassT(sc))}</b></span>
      </div>

      <div class="sub-head">Equipment</div>
      {sc.equipment.length === 0 && <p class="empty">No equipment.</p>}
      {sc.equipment.map((p) => <PartRow key={p.id} part={p} removable />)}
      <div class="inline add-row">
        <select value={kind} onChange={(e) => {
          const k = (e.currentTarget as HTMLSelectElement).value as PartKind;
          setKind(k);
          setVariant(VARIANTS[k][0]);
        }}>
          {EQUIPMENT_KINDS.map((k) => <option value={k}>{PART_KIND_LABEL[k]}</option>)}
        </select>
        {VARIANTS[kind].length > 1 && (
          <select value={variant} onChange={(e) => setVariant((e.currentTarget as HTMLSelectElement).value)}>
            {VARIANTS[kind].map((v) => (
              <option value={v}>{variantLabel(kind, v)}{unlocked.includes(unlockKey(kind, v)) ? '' : ' (locked)'}</option>
            ))}
          </select>
        )}
        {variantLocked && <span class="lock-note" title="Not unlocked yet: can be planned with, flagged beyond research"><LockIcon /></span>}
        <button class="btn small" onClick={() => actions.addEquipment(sc.id, kind, variant)}>+ Add</button>
      </div>

      <div class="sub-head">Spacecraft stages</div>
      {sc.stages.length === 0 && <p class="empty">No propulsion. The spacecraft can only coast after separation.</p>}
      {sc.stages.map((_, i) => sc.stages.length - 1 - i).map((i) => (
        <StageCard key={sc.stages[i].id} stage={sc.stages[i]} ev={ev}
          canUp={i < sc.stages.length - 1} canDown={i > 0}
          twr={stageTwrFromResults(ev, sc.stages[i].id)} twrLabel="TWR (local)"
          position={sc.stages.length > 1 ? (i === 0 ? 'fires first' : `fires ${i + 1}.`) : undefined} />
      ))}
      <div class="inline add-row">
        <PropulsionSelect value={prop} onChange={setProp} />
        <button class="btn small" onClick={() => actions.addStage(sc.id, prop)}>+ Stage</button>
      </div>
    </div>
  );
}

function StageCard({ stage, ev, canUp, canDown, twr, twrLabel, position }: {
  stage: Stage; ev: Evaluation; canUp: boolean; canDown: boolean; twr?: number; twrLabel: string; position?: string;
}) {
  const allDraft = stage.engine.state === 'draft' && stage.tanks.every((t) => t.state === 'draft');
  const band = stageBand(ev, stage.id);
  const engineEditable = isEditable(stage.engine);
  const dry = stageDryMassT(stage);
  const fuel = stageFuelT(stage);
  return (
    <div class="card stage-card">
      <div class="card-head">
        <input class="name-input" value={stage.name} onChange={(e) => actions.renameStage(stage.id, (e.currentTarget as HTMLInputElement).value)} />
        {position && <span class="muted small nowrap">{position}</span>}
        <button class="btn icon-btn" title="Move up (fires later)" disabled={!canUp} onClick={() => actions.moveStage(stage.id, 1)}>▲</button>
        <button class="btn icon-btn" title="Move down (fires earlier)" disabled={!canDown} onClick={() => actions.moveStage(stage.id, -1)}>▼</button>
        <button class="btn small danger ghost" onClick={() => confirm(`Remove ${stage.name}? Running contracts are not cancelled.`) && actions.removeStage(stage.id)}>Remove</button>
      </div>
      <div class="stage-config">
        {allDraft ? (
          <PropulsionSelect value={stage.propulsion} onChange={(p) => actions.setStagePropulsion(stage.id, p)} />
        ) : (
          <span class="tag" title="Propulsion is fixed once a part of the stage is sent to procurement">{PROPULSION[stage.propulsion].name}</span>
        )}
        <div class="stepper" title="Engine count">
          <button class="btn icon-btn" disabled={!engineEditable || stage.engineCount <= 1} onClick={() => actions.setEngineCount(stage.id, stage.engineCount - 1)}>−</button>
          <span class="num">{stage.engineCount}× engine</span>
          <button class="btn icon-btn" disabled={!engineEditable || stage.engineCount >= 30} onClick={() => actions.setEngineCount(stage.id, stage.engineCount + 1)}>+</button>
        </div>
      </div>
      <div class="derived">
        <span>Wet <b class="num">{formatMass(dry + fuel)}</b></span>
        <span>Dry <b class="num">{formatMass(dry)}</b></span>
        <span>Thrust <b class="num">{fmtThrust(stage)}</b></span>
        <span>Isp <b class="num">{fmtNum(stageIsp(stage))} s</b></span>
        <span>Δv <b class="num">{band ? formatDv(band.dvTotalMs) : '—'}</b>{band && band.dvUsedMs > 0 && <span class="muted"> (used {formatDv(band.dvUsedMs)})</span>}</span>
        {twr !== undefined && Number.isFinite(twr) && (
          <span class={twr < 1 ? 'err-text' : ''}>{twrLabel} <b class="num">{twr.toFixed(2)}</b></span>
        )}
      </div>
      <PartRow part={stage.engine} countLabel={stage.engineCount > 1 ? `× ${stage.engineCount}` : undefined} />
      {stage.tanks.map((t) => <PartRow key={t.id} part={t} removable={stage.tanks.length > 1} />)}
      <button class="btn small ghost" onClick={() => actions.addTank(stage.id)}>+ Tank</button>
    </div>
  );
}

function PartRow({ part, removable, countLabel }: { part: Part; removable?: boolean; countLabel?: string }) {
  const research = useGame((g) => g.research);
  const unlocked = useGame((g) => g.unlocked);
  const contract = useGame((g) => (part.contractId ? g.contracts.find((c) => c.id === part.contractId) : undefined));
  const highlighted = useLocalUi((s) => s.highlightPartId === part.id);
  const nonce = useLocalUi((s) => s.highlightNonce);
  const ref = useRef<HTMLDivElement>(null);
  const [showReplaceInfo, setShowReplaceInfo] = useState(false);

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted, nonce]);

  const editable = isEditable(part);
  const defs = statDefs(part.kind, part.variant);
  const beyond = beyondResearch(part, research, unlocked);
  const locked = !unlocked.includes(unlockKey(part.kind, part.variant));
  const showVariant = part.kind !== 'engine' && part.kind !== 'tank' && VARIANTS[part.kind].length > 1 && part.name !== variantLabel(part.kind, part.variant);

  return (
    <div ref={ref} class={`part-row state-${part.state}${highlighted ? ' highlight' : ''}`}>
      <div class="part-head">
        <span class="part-name">{part.name}</span>
        {showVariant && <span class="muted small">{variantLabel(part.kind, part.variant)}</span>}
        {countLabel && <span class="muted small num">{countLabel}</span>}
        {locked && <span class="badge locked" title="Part variant not unlocked yet"><LockIcon /> locked</span>}
        <div class="spacer" />
        <span class={`badge st-${part.state}`}>{!editable && <LockIcon />} {PART_STATE_LABEL[part.state]}</span>
      </div>
      {beyond.length > 0 && (
        <div class="beyond-note" title="Needs research, an unlock, a costly purchase, or diplomacy">
          Beyond research: {beyond.join(', ')}
        </div>
      )}
      {defs.map((def) => (
        <StatSlider key={def.key} def={def} value={part.stats[def.key]} locked={!editable}
          limit={research[researchKey(part, def.key)]}
          onChange={(v) => actions.setPartStat(part.id, def.key, v)} />
      ))}
      <div class="part-foot">
        <span>Mass <b class="num">{formatMass(partDryMassT(part))}</b>{part.kind === 'tank' && <span class="muted"> dry</span>}</span>
        {contract ? (
          <span>Price <b class="num">{formatMoney(contract.priceM)}</b></span>
        ) : (
          <span>Est. <b class="num">{formatMoney(estimatedCostM(part))}</b></span>
        )}
        <span>Rel. <b class="num">{pctFine(partReliability(part))}</b></span>
        <div class="spacer" />
        {part.state === 'draft' && (
          <button class="btn small primary" onClick={() => actions.sendTask(part.id)} title="Send this part's slider values to procurement as minimums">
            Send to procurement
          </button>
        )}
        {part.state === 'sent' && <span class="muted small">Edits update the task</span>}
        {(part.state === 'contracted' || part.state === 'delivered') && (
          <button class="btn small" onMouseEnter={() => setShowReplaceInfo(true)} onMouseLeave={() => setShowReplaceInfo(false)}
            onClick={() => confirm('Replace this part with a new draft? The old contract keeps running; only procurement can cancel it.') && actions.replacePart(part.id)}>
            Replace
          </button>
        )}
        {removable && (
          <button class="btn small danger ghost" title="Remove part" onClick={() => {
            if (part.state === 'contracted' || part.state === 'delivered') {
              if (!confirm(`Remove ${part.name}? Its contract keeps running; only procurement can cancel it.`)) return;
            }
            actions.removePart(part.id);
          }}>✕</button>
        )}
      </div>
      {showReplaceInfo && (
        <div class="hint">Creates a new draft with the same stats. The old contract keeps running; only procurement can cancel it.</div>
      )}
    </div>
  );
}
