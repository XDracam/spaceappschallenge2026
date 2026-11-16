import type { MissionDef, Part, PartKind, PropulsionId, Stage } from '../../model/types';
import { makePart } from '../parts';

// Hand-crafted mission: Mars orbiter + lander.
// The starting design deliberately falls short (no delta-v left for Mars
// orbit insertion) so the planner has something to fix.

let n = 0;
const id = (prefix: string) => `${prefix}-m${++n}`;

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

const orbiterId = id('sc');
const landerId = id('sc');

export const MARS_ORBITER_LANDER: MissionDef = {
  id: 'mars-orbiter-lander',
  name: 'Mars orbiter + lander',
  briefing:
    'Send an orbiter to map Mars and a lander to conduct surface science. ' +
    'All goals must be achieved by the mission deadline.',
  startDateISO: '2030-01-01',
  // 1 Jul 2033. The first Mars window (late 2030) arrives with plenty of margin;
  // the second (late 2032) only makes it with a faster-than-cheapest transfer.
  completionDeadlineDay: 1277,
  budgetM: 900,
  goals: [
    { id: 'goal-orbit', name: 'Reach Mars orbit', kind: 'orbit', body: 'mars' },
    { id: 'goal-orbit-data', name: 'Map Mars from orbit', kind: 'orbitData', body: 'mars', instrument: 'camera', minPerformance: 4, stayDays: 365 },
    { id: 'goal-land', name: 'Land on Mars', kind: 'land', body: 'mars' },
    { id: 'goal-surface-data', name: 'Surface science', kind: 'surfaceData', body: 'mars', instrument: 'surfaceLab', minPerformance: 3, stayDays: 180 },
  ],
  research: {
    'engine.solid.isp': 270,
    'engine.kerolox.isp': 340,
    'engine.hydrolox.isp': 450,
    'engine.hypergolic.isp': 320,
    'engine.ion.isp': 3000,
    'engine.kerolox.thrustKN': 8000,
    'engine.hydrolox.thrustKN': 2500,
    // Four-month sensor research plus standard camera delivery fits day 230.
    'instrument.camera.performance': 3,
    'instrument.spectrometer.performance': 6,
    'instrument.radar.performance': 4,
    'instrument.surfaceLab.performance': 5,
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
      stage('Booster', 'kerolox', 2, { thrustKN: 1900, isp: 300 }, [250]),
      stage('Upper stage', 'hydrolox', 1, { thrustKN: 110, isp: 445 }, [20]),
    ],
    spacecraft: [
      {
        id: orbiterId, name: 'Orbiter', payloadType: 'orbiter',
        stages: [stage('Orbiter propulsion', 'hypergolic', 1, { thrustKN: 0.5, isp: 315 }, [1.5])],
        equipment: [
          part('instrument', 'camera', { performance: 4 }),
          part('power', 'solar', { outputKW: 2 }),
          part('antenna', 'standard', { dataRateKbps: 500 }),
        ],
      },
      {
        id: landerId, name: 'Lander', payloadType: 'lander',
        stages: [stage('Descent stage', 'hypergolic', 1, { thrustKN: 30, isp: 310 }, [0.6])],
        equipment: [
          part('instrument', 'surfaceLab', { performance: 3 }),
          part('power', 'solar', { outputKW: 1 }),
          part('antenna', 'standard', { dataRateKbps: 100 }),
          part('legs', 'standard', { maxLandingMassT: 2 }),
          part('heatShield', 'standard', { maxEntryMassT: 2.5 }),
        ],
      },
    ],
  },
  initialPlan: {
    launchDay: 230,
    branches: [
      {
        id: 'branch-root', name: 'Main', spacecraftIds: [orbiterId, landerId], carriesRocketStages: true,
        // Starts on the launch pad: the planner's first step is the launch.
        maneuvers: [],
      },
    ],
  },
};
