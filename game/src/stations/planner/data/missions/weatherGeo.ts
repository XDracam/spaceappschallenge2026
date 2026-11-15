import type { MissionDef, Part, PartKind, PropulsionId, Stage } from '../../model/types';
import { makePart } from '../parts';

// Hand-crafted first mission (D-005; user direction 2026-11-14, see
// mission-planner/notes/2026-11-14-weather-mission.md): a weather satellite in
// geostationary orbit. Launch to low Earth orbit (200 km), then one orbit raise
// to 35,786 km (Hohmann in this coplanar model: 2.45 + 1.48 = 3.93 km/s).
//
// The starting design deliberately falls short: it reaches low orbit with
// ~3.70 km/s left, about 0.24 km/s short of the raise to geostationary orbit
// (it runs out during the final circularisation). One obvious fix makes it work:
// a bigger upper-stage tank (2 t -> 3 t: ~0.4 km/s spare) or a bigger apogee tank
// on the satellite (0.7 t -> 1.6 t: ~0.13 km/s spare). Part sizes are at or below
// catalogue items (procurement/data/catalogue.ts), so contracted parts only help.
//
// Two parts of the starting design are beyond what the agency has researched
// (playtest 1115m-r01, finding 03: science had nothing to do): the camera the
// imagery goal needs (4.5 against a limit of 4) and the antenna that carries its
// 225 kbps (limit 200). Science has to research both before the catalogue sells
// them. Research runs at twice the tree's authored speed (researchTimeFactor), so
// a first-step tech takes about 2 months and still leaves the 3 months the fastest
// camera supplier needs before the launch on day 180.

let n = 0;
const id = (prefix: string) => `${prefix}-w${++n}`;

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

const satelliteId = id('sc');

/** Geostationary altitude above the equator (km). */
const GEO_ALT_KM = 35_786;

export const WEATHER_GEO: MissionDef = {
  id: 'weather-geo',
  name: 'Weather satellite',
  briefing:
    'Put a weather satellite into geostationary orbit, where it keeps pace with the Earth and forecasters can watch ' +
    'a whole hemisphere around the clock. The two main goals must be achieved by the mission deadline. ' +
    'Two optional goals earn bonus points: they need extra instruments, some research and more fuel for the heavier satellite, ' +
    'and the budget only covers all of them with careful buying.',
  startDateISO: '2030-01-01',
  // 5 Feb 2031. Launch is planned for day 180 (30 Jun 2030, about 6 real minutes
  // in): the booster engine's fastest catalogue offer takes 4 months, so it must be
  // signed in the first ~2 minutes. The orbit raise takes hours, so the deadline
  // leaves room to slip the launch.
  completionDeadlineDay: 400,
  // Tuned so that all four goals are just affordable (playtest: the 350 M of the first version was never spent):
  // the cheapest complete plan costs about 175 M (parts ~85, camera and antenna research ~25, extras below),
  // a typical one about 205 M. The two main goals alone are done for 105-140 M.
  budgetM: 210,
  goals: [
    {
      id: 'goal-geo', name: 'Reach geostationary orbit', kind: 'orbit', body: 'earth',
      altitudeKm: GEO_ALT_KM, altitudeToleranceKm: 2000, orbitName: 'geostationary orbit',
    },
    {
      id: 'goal-imagery', name: 'Send weather images', kind: 'orbitData', body: 'earth',
      instrument: 'camera', minPerformance: 4.5, stayDays: 730,
      altitudeKm: GEO_ALT_KM, altitudeToleranceKm: 2000, orbitName: 'geostationary orbit',
    },
    // Optional goals (user direction 2026-11-15): bonus points, no effect on the main goals. Each needs one more
    // instrument on the satellite: power (0.09 / 0.38 kW) and data (50 / 300 kbps) fit the starting solar panels and antenna,
    // so the cost is the instrument itself (spectrometer S5 about 19-24 M; sounding radar R3 about 34 M plus 14 M to research
    // radar electronics, because the radar is not unlocked) and its extra mass in the satellite's tanks.
    {
      id: 'goal-ozone', name: 'Measure ozone and aerosols', kind: 'orbitData', body: 'earth',
      instrument: 'spectrometer', minPerformance: 5, stayDays: 730,
      altitudeKm: GEO_ALT_KM, altitudeToleranceKm: 2000, orbitName: 'geostationary orbit',
      optional: true, bonusPoints: 40,
    },
    {
      id: 'goal-rain', name: 'Sound rain and cloud layers with radar', kind: 'orbitData', body: 'earth',
      instrument: 'radar', minPerformance: 3, stayDays: 730,
      altitudeKm: GEO_ALT_KM, altitudeToleranceKm: 2000, orbitName: 'geostationary orbit',
      optional: true, bonusPoints: 60,
    },
  ],
  // Same research keys as the Mars mission, so science and procurement work unchanged.
  researchTimeFactor: 0.5,
  research: {
    'engine.solid.isp': 270,
    'engine.kerolox.isp': 340,
    'engine.hydrolox.isp': 450,
    'engine.hypergolic.isp': 320,
    'engine.ion.isp': 3000,
    'engine.kerolox.thrustKN': 8000,
    'engine.hydrolox.thrustKN': 2500,
    'instrument.camera.performance': 4,
    'instrument.spectrometer.performance': 6,
    'instrument.radar.performance': 4,
    'instrument.surfaceLab.performance': 5,
    'power.solar.outputKW': 15,
    'power.rtg.outputKW': 1,
    'antenna.standard.dataRateKbps': 200,
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
      // ~92 t at lift-off, lift ratio ~2.1.
      stage('Booster', 'kerolox', 1, { thrustKN: 1900, isp: 300 }, [80]),
      stage('Upper stage', 'hydrolox', 1, { thrustKN: 110, isp: 445 }, [2]),
    ],
    spacecraft: [
      {
        id: satelliteId, name: 'Weather satellite', payloadType: 'orbiter',
        stages: [stage('Apogee engine', 'hypergolic', 1, { thrustKN: 0.5, isp: 315 }, [0.7])],
        equipment: [
          // Camera 4.5: 225 kbps, 0.16 kW. At Earth the antenna sends its full rate and the panels give their 1 AU output.
          part('instrument', 'camera', { performance: 4.5 }),
          part('power', 'solar', { outputKW: 1.2 }),
          part('antenna', 'standard', { dataRateKbps: 600 }),
        ],
      },
    ],
  },
  initialPlan: {
    launchDay: 180,
    branches: [
      {
        id: 'branch-root', name: 'Main', spacecraftIds: [satelliteId], carriesRocketStages: true,
        // Starts on the launch pad: the planner's first step is the launch.
        maneuvers: [],
      },
    ],
  },
};
