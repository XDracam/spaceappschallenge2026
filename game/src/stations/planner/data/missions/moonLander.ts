import type { MissionDef, Part, PartKind, PropulsionId, Stage } from '../../model/types';
import { makePart } from '../parts';

// Hand-crafted third mission (D-005; specification:
// mission-planner/notes/2026-11-15-third-mission-proposal.md): one lander to the
// Moon. Between the weather satellite and Mars in difficulty: it adds leaving Earth,
// braking into orbit at another body and landing, but keeps one vehicle and needs
// no launch window (a Moon transfer leaves any day and takes about five days).
//
// The starting design deliberately cannot lift off: one 2,000 kN booster engine
// under a ~305 t rocket (lift ratio 0.67). No tank size fixes that, so the Planner
// has to change engines. Two answers work, with different cost, risk and timing:
// - Twin booster: two 2,000 kN engines (sold fast by Swift), a bigger lander tank
//   and stronger legs. Two engines are two chances to fail.
// - One big engine: one 4,500 kN engine (Tallis, eight months: sign in the first
//   two minutes, or get Feldwerk's through Communications). Safer and more margin.
// Every part size of the starting design is a catalogue size
// (procurement/data/catalogue.ts). The legs start at 2.5 t (Strider LG-2.5), not the
// spec's 1 t: the tank fix sizes the lander tank between 0.7 and 1.6 t, every such
// tank is bought as the full 1.6 t Flask, and 1-t legs could not carry that lander
// (touchdown ~1.12 t), so the team found out only after the contracts were signed.
// With 2.5-t legs every lander tank up to 1.6 t fits, and a bought tank only adds margin.
//
// Two parts are beyond what the agency has researched, so Science has work from
// the first second: the drill-and-oven surface lab (4.5 against 3.2) and the
// throttleable descent engine (Isp 312 against 310).

let n = 0;
const id = (prefix: string) => `${prefix}-l${++n}`;

function part(kind: PartKind, variant: string, stats: Record<string, number>): Part {
  const p = makePart(id('part'), kind, variant);
  p.stats = { ...p.stats, ...stats };
  return p;
}

function stage(name: string, propulsion: PropulsionId, engineCount: number, engine: Record<string, number>, fuelT: number[]): Stage {
  return {
    id: id('stage'), name, propulsion,
    engine: part('engine', propulsion, engine),
    engineCount,
    tanks: fuelT.map((f) => part('tank', propulsion, { fuelT: f })),
  };
}

const landerId = id('sc');

export const MOON_LANDER: MissionDef = {
  id: 'moon-lander',
  name: 'Lunar ice lander',
  briefing:
    "Land a robotic spacecraft near the Moon's south pole and drill for water ice, so the crewed programme can choose where its " +
    'first crew lands. All goals must be achieved by the mission deadline.',
  // The planner's briefing lists these under "New in this mission", one sentence each.
  ideas: [
    'Leaving Earth: from low orbit, one more burn sends you to the Moon, a trip of about five days.',
    'Arriving: at the Moon you are too fast to stay, so you brake into lunar orbit first.',
    'Landing: the Moon has no air, so all 1.9 km/s of braking comes from fuel, and the legs carry what is left.',
    'Engines: a heavy rocket needs a second engine (Rocket → Advanced) or one bigger engine (Push); two engines are two chances to fail.',
  ],
  startDateISO: '2030-01-01',
  // 1 Apr 2031. Launch is planned for day 300 (28 Oct 2030, about ten real minutes
  // in). The deadline leaves room to slip the launch if a research fails once.
  completionDeadlineDay: 455,
  budgetM: 260,
  goals: [
    { id: 'goal-moon-orbit', name: 'Reach lunar orbit', kind: 'orbit', body: 'moon' },
    { id: 'goal-moon-land', name: 'Land on the Moon', kind: 'land', body: 'moon' },
    { id: 'goal-moon-ice', name: 'Drill for water ice', kind: 'surfaceData', body: 'moon', instrument: 'surfaceLab', minPerformance: 4.5, stayDays: 12 },
  ],
  researchTimeFactor: 0.6,
  research: {
    'engine.solid.isp': 270,
    'engine.kerolox.isp': 340,
    'engine.hydrolox.isp': 450,
    // The throttleable descent engines (312 s and up) need Science's research.
    'engine.hypergolic.isp': 310,
    'engine.ion.isp': 3000,
    'engine.kerolox.thrustKN': 8000,
    'engine.hydrolox.thrustKN': 2500,
    'instrument.camera.performance': 6,
    'instrument.spectrometer.performance': 6,
    'instrument.radar.performance': 4,
    // "As flown today": the drill-and-oven lab (4.5) needs Science's research.
    'instrument.surfaceLab.performance': 3.2,
    'power.solar.outputKW': 15,
    'power.rtg.outputKW': 1,
    'antenna.standard.dataRateKbps': 3000,
    'radShield.standard.level': 4,
    'heatProtection.standard.level': 3,
  },
  unlocked: [
    'engine.solid', 'engine.kerolox', 'engine.hydrolox', 'engine.hypergolic',
    'tank.solid', 'tank.kerolox', 'tank.hydrolox', 'tank.hypergolic',
    'instrument.camera', 'instrument.spectrometer', 'instrument.surfaceLab',
    'power.solar', 'antenna.standard', 'legs.standard', 'heatShield.standard',
    'radShield.standard', 'heatProtection.standard',
  ],
  initialRocket: {
    stages: [
      // ~305 t at lift-off on one 2,000 kN engine: lift ratio 0.67, it cannot leave the pad.
      stage('Booster', 'kerolox', 1, { thrustKN: 2000, isp: 305 }, [260]),
      stage('Upper stage', 'hydrolox', 1, { thrustKN: 120, isp: 446 }, [22]),
    ],
    spacecraft: [
      {
        id: landerId, name: 'Lunar lander', payloadType: 'lander',
        stages: [stage('Descent stage', 'hypergolic', 1, { thrustKN: 5, isp: 312 }, [0.7])],
        equipment: [
          // Lab 4.5: 0.325 kW and 90 kbps. The panel gives 0.6 kW near 1 AU, the antenna 120 kbps.
          part('instrument', 'surfaceLab', { performance: 4.5 }),
          part('power', 'solar', { outputKW: 0.6 }),
          part('antenna', 'standard', { dataRateKbps: 120 }),
          part('legs', 'standard', { maxLandingMassT: 2.5 }),
        ],
      },
    ],
  },
  initialPlan: {
    launchDay: 300,
    branches: [
      {
        id: 'branch-root', name: 'Main', spacecraftIds: [landerId], carriesRocketStages: true,
        // Starts on the launch pad: the planner's first step is the launch.
        maneuvers: [],
      },
    ],
  },
};
