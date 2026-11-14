import type {
  InstrumentVariant, Part, PartKind, PayloadType, PropulsionId, Spacecraft, Stage,
} from '../model/types';
import { AU_KM } from '../model/units';
import { PROPULSION, ionPowerKW, ispFactor } from './propulsion';

// Part catalogue rules: slider definitions, derived mass/cost/reliability,
// research keys. All numbers are balancing placeholders.

export interface StatDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  scale: 'linear' | 'log';
  /** Display multiplier (e.g. ion thrust shown in N: 1000). */
  displayFactor?: number;
  displayUnit?: string;
}

export const PART_KIND_LABEL: Record<PartKind, string> = {
  engine: 'Engine', tank: 'Tank', instrument: 'Instrument', power: 'Power', antenna: 'Antenna',
  legs: 'Landing legs', heatShield: 'Heat shield', radShield: 'Radiation shielding', heatProtection: 'Heat protection',
};

export const EQUIPMENT_KINDS: PartKind[] = ['instrument', 'power', 'antenna', 'legs', 'heatShield', 'radShield', 'heatProtection'];

export interface InstrumentSpec {
  variant: InstrumentVariant;
  name: string;
  where: 'orbit' | 'surface';
  baseMassT: number;
  basePowerKW: number;
  baseDataKbps: number;
  baseCostM: number;
}

export const INSTRUMENTS: Record<InstrumentVariant, InstrumentSpec> = {
  camera: { variant: 'camera', name: 'Orbital camera', where: 'orbit', baseMassT: 0.05, basePowerKW: 0.1, baseDataKbps: 50, baseCostM: 12 },
  spectrometer: { variant: 'spectrometer', name: 'Spectrometer', where: 'orbit', baseMassT: 0.04, basePowerKW: 0.05, baseDataKbps: 10, baseCostM: 10 },
  radar: { variant: 'radar', name: 'Sounding radar', where: 'orbit', baseMassT: 0.1, basePowerKW: 0.3, baseDataKbps: 100, baseCostM: 25 },
  surfaceLab: { variant: 'surfaceLab', name: 'Surface lab', where: 'surface', baseMassT: 0.3, basePowerKW: 0.2, baseDataKbps: 20, baseCostM: 40 },
};

export const VARIANTS: Record<PartKind, string[]> = {
  engine: ['solid', 'kerolox', 'hydrolox', 'hypergolic', 'ion'],
  tank: ['solid', 'kerolox', 'hydrolox', 'hypergolic', 'ion'],
  instrument: ['camera', 'spectrometer', 'radar', 'surfaceLab'],
  power: ['solar', 'rtg'],
  antenna: ['standard'],
  legs: ['standard'],
  heatShield: ['standard'],
  radShield: ['standard'],
  heatProtection: ['standard'],
};

export function variantLabel(kind: PartKind, variant: string): string {
  if (kind === 'engine' || kind === 'tank') return PROPULSION[variant as PropulsionId]?.name ?? variant;
  if (kind === 'instrument') return INSTRUMENTS[variant as InstrumentVariant]?.name ?? variant;
  if (kind === 'power') return variant === 'rtg' ? 'RTG' : 'Solar panels';
  return PART_KIND_LABEL[kind];
}

export function statDefs(kind: PartKind, variant: string): StatDef[] {
  switch (kind) {
    case 'engine': {
      const p = PROPULSION[variant as PropulsionId];
      const ion = variant === 'ion';
      return [
        {
          key: 'thrustKN', label: 'Thrust', unit: 'kN', min: p.thrustRangeKN[0], max: p.thrustRangeKN[1],
          step: ion ? 0.00005 : 0.1, scale: 'log',
          ...(ion ? { displayFactor: 1000, displayUnit: 'N' } : {}),
        },
        { key: 'isp', label: 'Isp', unit: 's', min: p.ispRange[0], max: p.ispRange[1], step: 1, scale: 'linear' },
      ];
    }
    case 'tank':
      return [{ key: 'fuelT', label: 'Fuel capacity', unit: 't', min: variant === 'ion' ? 0.01 : 0.1, max: 2000, step: 0.01, scale: 'log' }];
    case 'instrument':
      return [{ key: 'performance', label: 'Performance', unit: '', min: 1, max: 10, step: 0.1, scale: 'linear' }];
    case 'power':
      return [{ key: 'outputKW', label: variant === 'solar' ? 'Output at 1 AU' : 'Output', unit: 'kW', min: 0.05, max: 30, step: 0.01, scale: 'log' }];
    case 'antenna':
      return [{ key: 'dataRateKbps', label: 'Data rate at 1 AU', unit: 'kbps', min: 1, max: 10_000, step: 1, scale: 'log' }];
    case 'legs':
      return [{ key: 'maxLandingMassT', label: 'Max landing mass', unit: 't', min: 0.1, max: 60, step: 0.01, scale: 'log' }];
    case 'heatShield':
      return [{ key: 'maxEntryMassT', label: 'Max entry mass', unit: 't', min: 0.1, max: 60, step: 0.01, scale: 'log' }];
    case 'radShield':
    case 'heatProtection':
      return [{ key: 'level', label: 'Protection level', unit: '', min: 0, max: 10, step: 1, scale: 'linear' }];
  }
}

export function defaultStats(kind: PartKind, variant: string): Record<string, number> {
  switch (kind) {
    case 'engine': {
      const p = PROPULSION[variant as PropulsionId];
      const thrust = variant === 'ion' ? 0.0003 : variant === 'hypergolic' ? 5 : Math.sqrt(p.thrustRangeKN[0] * p.thrustRangeKN[1]);
      return { thrustKN: thrust, isp: Math.round((p.ispRange[0] * 2 + p.ispRange[1]) / 3) };
    }
    case 'tank': return { fuelT: variant === 'ion' ? 0.2 : variant === 'hypergolic' ? 1 : 20 };
    case 'instrument': return { performance: 3 };
    case 'power': return { outputKW: variant === 'rtg' ? 0.3 : 1 };
    case 'antenna': return { dataRateKbps: 200 };
    case 'legs': return { maxLandingMassT: 2 };
    case 'heatShield': return { maxEntryMassT: 2 };
    case 'radShield': return { level: 1 };
    case 'heatProtection': return { level: 1 };
  }
}

export function partName(kind: PartKind, variant: string): string {
  if (kind === 'engine') return `${PROPULSION[variant as PropulsionId].name} engine`;
  if (kind === 'tank') return `${PROPULSION[variant as PropulsionId].name} tank`;
  return variantLabel(kind, variant);
}

export function makePart(id: string, kind: PartKind, variant: string): Part {
  return { id, kind, variant, name: partName(kind, variant), stats: defaultStats(kind, variant), state: 'draft' };
}

export function makeStage(newId: (p: string) => string, name: string, propulsion: PropulsionId): Stage {
  return {
    id: newId('stage'), name, propulsion,
    engine: makePart(newId('part'), 'engine', propulsion),
    engineCount: 1,
    tanks: [makePart(newId('part'), 'tank', propulsion)],
  };
}

export function makeSpacecraft(newId: (p: string) => string, name: string, payloadType: PayloadType): Spacecraft {
  return { id: newId('sc'), name, payloadType, stages: [], equipment: [] };
}

export const PAYLOAD_TYPE_LABEL: Record<PayloadType, string> = {
  orbiter: 'Orbiter', lander: 'Lander', rover: 'Rover', sampleReturn: 'Sample return', crew: 'Crew capsule',
};

/** Payload types that can land (also need landing legs on airless bodies). */
export const CAN_LAND: PayloadType[] = ['lander', 'rover', 'sampleReturn', 'crew'];
/** Payload types that can return to Earth. */
export const CAN_RETURN: PayloadType[] = ['sampleReturn', 'crew'];

// ------------------------------------------------------------ derived values

/** Derived mass from slider values (ignores contracts). */
export function derivedMassT(part: Part): number {
  const s = part.stats;
  switch (part.kind) {
    case 'engine': {
      const p = PROPULSION[part.variant as PropulsionId];
      return p.engineBaseMassT + s.thrustKN * p.engineMassPerKN * ispFactor(p, s.isp);
    }
    case 'tank': {
      const p = PROPULSION[part.variant as PropulsionId];
      return s.fuelT * p.tankDryFraction; // dry mass only; fuel is counted separately
    }
    case 'instrument': {
      const i = INSTRUMENTS[part.variant as InstrumentVariant];
      return i.baseMassT * (0.6 + 0.4 * s.performance);
    }
    case 'power': return part.variant === 'rtg' ? 0.02 + s.outputKW * 0.5 : 0.01 + s.outputKW * 0.02;
    case 'antenna': return 0.02 + s.dataRateKbps * 0.0001;
    case 'legs': return 0.02 + s.maxLandingMassT * 0.05;
    case 'heatShield': return 0.03 + s.maxEntryMassT * 0.12;
    case 'radShield': return s.level * 0.03;
    case 'heatProtection': return s.level * 0.08;
  }
}

/** Dry mass of a part: contracted real mass if set, otherwise derived. Tanks: dry mass without fuel. */
export function partDryMassT(part: Part): number {
  return part.actualMassT ?? derivedMassT(part);
}

export function estimatedCostM(part: Part): number {
  const s = part.stats;
  switch (part.kind) {
    case 'engine': {
      const p = PROPULSION[part.variant as PropulsionId];
      return (p.engineBaseCost + s.thrustKN * p.engineCostPerKN) * ispFactor(p, s.isp);
    }
    case 'tank': return 0.5 + s.fuelT * PROPULSION[part.variant as PropulsionId].fuelCostPerT;
    case 'instrument': return INSTRUMENTS[part.variant as InstrumentVariant].baseCostM * (0.5 + 0.25 * s.performance);
    case 'power': return part.variant === 'rtg' ? 20 + s.outputKW * 60 : 1 + s.outputKW * 2;
    case 'antenna': return 2 + s.dataRateKbps * 0.004;
    case 'legs': return 2 + s.maxLandingMassT * 1.5;
    case 'heatShield': return 3 + s.maxEntryMassT * 3;
    case 'radShield': return s.level * 4;
    case 'heatProtection': return s.level * 3;
  }
}

/** Reliability of one unit: contracted value if set, otherwise the typical value for its kind. */
export function partReliability(part: Part): number {
  if (part.reliability !== undefined) return part.reliability;
  if (part.kind === 'engine') return PROPULSION[part.variant as PropulsionId].baseReliability;
  if (part.kind === 'tank') return 0.998;
  if (part.kind === 'instrument') return 0.97;
  if (part.kind === 'heatShield' || part.kind === 'legs') return 0.98;
  return 0.99;
}

export function stageFuelT(stage: Stage): number {
  return stage.tanks.reduce((sum, t) => sum + t.stats.fuelT, 0);
}

export function stageDryMassT(stage: Stage): number {
  return partDryMassT(stage.engine) * stage.engineCount + stage.tanks.reduce((s, t) => s + partDryMassT(t), 0);
}

export function stageThrustKN(stage: Stage): number {
  return stage.engine.stats.thrustKN * stage.engineCount;
}

export function stageIsp(stage: Stage): number {
  return stage.engine.stats.isp;
}

/** Power an ion stage needs while firing (kW); 0 for chemical stages. */
export function stagePowerNeedKW(stage: Stage): number {
  return stage.propulsion === 'ion' ? ionPowerKW(stage.engine.stats.thrustKN * stage.engineCount, stage.engine.stats.isp) : 0;
}

export function equipmentMassT(sc: Spacecraft): number {
  return sc.equipment.reduce((s, p) => s + partDryMassT(p), 0);
}

export function spacecraftWetMassT(sc: Spacecraft): number {
  return equipmentMassT(sc) + sc.stages.reduce((s, st) => s + stageDryMassT(st) + stageFuelT(st), 0);
}

export function instrumentPowerKW(part: Part): number {
  const i = INSTRUMENTS[part.variant as InstrumentVariant];
  return i.basePowerKW * (0.5 + 0.25 * part.stats.performance);
}

export function instrumentDataKbps(part: Part): number {
  const i = INSTRUMENTS[part.variant as InstrumentVariant];
  return i.baseDataKbps * part.stats.performance;
}

/** Power output at a distance from the Sun (km). Solar falls with 1/d^2; RTG constant. */
export function powerOutputKW(part: Part, sunDistanceKm: number): number {
  if (part.variant === 'rtg') return part.stats.outputKW;
  const dAU = sunDistanceKm / AU_KM;
  return part.stats.outputKW / (dAU * dAU);
}

/** Antenna data rate at a distance from Earth (km): falls with 1/d^2, capped at the 1 AU rate. */
export function antennaRateKbps(part: Part, earthDistanceKm: number): number {
  const dAU = Math.max(1, earthDistanceKm / AU_KM);
  return part.stats.dataRateKbps / (dAU * dAU);
}

/** Total radiation dose a spacecraft tolerates. Unshielded: 30 units. */
export function radiationTolerance(level: number): number {
  return 30 + 150 * level;
}

/** Hours a lander survives on the Venus surface. */
export function venusSurfaceHours(level: number): number {
  return 1 + 12 * level;
}

// -------------------------------------------------------------- research

export function researchKey(part: Part, statKey: string): string {
  return `${part.kind}.${part.variant}.${statKey}`;
}

export function unlockKey(kind: PartKind, variant: string): string {
  return `${kind}.${variant}`;
}

/** Keys this part exceeds: research limits (stat above limit) and locked variants. */
export function beyondResearch(part: Part, research: Record<string, number>, unlocked: string[]): string[] {
  const out: string[] = [];
  const uk = unlockKey(part.kind, part.variant);
  if (!unlocked.includes(uk)) out.push(uk);
  for (const def of statDefs(part.kind, part.variant)) {
    const key = researchKey(part, def.key);
    const limit = research[key];
    if (limit !== undefined && part.stats[def.key] > limit + 1e-9) out.push(key);
  }
  return out;
}
