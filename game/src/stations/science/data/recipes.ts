// Hand-authored project ideas (D-005): two or three fields combined on the bench.
// Content started from the design-canvas mockup (Nov 14, 2026); the engineering
// recipes were added for the integrated game. Descriptions are assistant-written
// from general knowledge and still need a fact check. Costs (M), durations
// (months), odds and gains are balancing placeholders.
//
// Gains use the planner's research keys (stations/planner/data/parts.ts):
// limits `${kind}.${variant}.${stat}`, unlocks `${kind}.${variant}`. Every research
// limit and every locked variant of the Mars mission has at least one recipe.

import type { Recipe } from '../model/types';

export const RECIPES: Recipe[] = [
  // ------------------------------------------------ instruments
  {
    ids: ['a5', 'b1'],
    title: 'Methane as a life detector',
    pitch: 'Seasonal methane swings could be geology or biology. Pair the timing of the swings with gases that only living systems should move together with. The work sharpens the orbital spectrometer.',
    method: 'Orbiter gas sounding plus surface sampling',
    needs: 'Spectrometer test unit (Procurement)',
    months: 6, costM: 18, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'instrument.spectrometer.performance', delta: 1 }],
    testPart: { label: 'Spectrometer test unit', partKind: 'instrument', variant: 'spectrometer', minimums: { performance: 3 } },
  },
  {
    ids: ['i1', 'i12'],
    title: 'Cooled infrared detector',
    pitch: 'Detector noise sets how faint a spectral line the spectrometer can see. A colder, quieter focal plane buys a full performance step.',
    method: 'Lab cryocooler tests on a spare detector',
    needs: 'Lab time only',
    months: 4, costM: 12, odds: 'Good',
    gains: [{ kind: 'limit', key: 'instrument.spectrometer.performance', delta: 1 }],
  },
  {
    ids: ['i12', 'i6'],
    title: 'Low-noise stereo camera',
    pitch: 'Stereo mapping is limited by sensor noise in the shadows. Cooling the sensor and stacking frames lifts the camera\'s resolving power.',
    method: 'Sensor cooling trials and image stacking',
    needs: 'Camera test unit (Procurement)',
    months: 4, costM: 12, odds: 'Good',
    gains: [{ kind: 'limit', key: 'instrument.camera.performance', delta: 1 }],
    testPart: { label: 'Camera test unit', partKind: 'instrument', variant: 'camera', minimums: { performance: 3 } },
  },
  {
    ids: ['i18', 'o12'],
    title: 'Self-guided science on approach',
    pitch: 'Let the spacecraft choose its own observation targets during the last days of approach, when light delay rules out ground control. If it works, the camera does far more with the same pixels.',
    method: 'Onboard image analysis on the navigation camera',
    needs: 'Camera and processor budget (Procurement), approach timeline (Planning)',
    months: 7, costM: 24, odds: 'Long shot',
    gains: [{ kind: 'limit', key: 'instrument.camera.performance', delta: 2 }],
  },
  {
    ids: ['g9', 'i5'],
    title: 'Radar signatures of pure ice',
    pitch: 'Teach a sounding radar to tell clean ice from ice-rich soil before it is flown. Proving the method qualifies the radar as a mission instrument.',
    method: 'Calibrate on analogue sites',
    needs: 'Field campaign on terrestrial glaciers',
    months: 5, costM: 30, odds: 'Medium',
    gains: [{ kind: 'unlock', key: 'instrument.radar' }],
  },
  {
    ids: ['g8', 'i5'],
    title: 'Radar through glacial ice',
    pitch: 'Buried Martian glaciers are a natural test range. Modelling how radar loses power in dusty ice lets the sounder reach deeper.',
    method: 'Propagation modelling against archive radargrams',
    needs: 'Archive radar data',
    months: 4, costM: 14, odds: 'Good',
    gains: [{ kind: 'limit', key: 'instrument.radar.performance', delta: 1 }],
  },
  {
    ids: ['b16', 'i3'],
    title: 'Measure the false-alarm rate',
    pitch: 'Before claiming a life signal, learn how often non-biological chemistry fakes one on the surface lab. Knowing the false alarms makes every real reading count more.',
    method: 'Lab runs on abiotic mixtures',
    needs: 'Mass spectrometer test unit (Procurement)',
    months: 4, costM: 10, odds: 'Good',
    gains: [{ kind: 'limit', key: 'instrument.surfaceLab.performance', delta: 1 }],
    testPart: { label: 'Mass spectrometer test unit', partKind: 'instrument', variant: 'surfaceLab', minimums: { performance: 3 } },
  },
  {
    ids: ['b2', 'g4'],
    title: 'Clays as organic time capsules',
    pitch: 'Clays trap organics in standing water. Learning which clays kept them longest tells the surface lab what to look for, and how.',
    method: 'Compare orbital spectra, then in-situ analysis',
    needs: 'Lander instrument slot (Planning, Procurement)',
    months: 6, costM: 16, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'instrument.surfaceLab.performance', delta: 1 }],
  },

  // ------------------------------------------------ power
  {
    ids: ['a2', 'm6'],
    title: 'Dust load forecast for hardware',
    pitch: 'Predict how much dust panels see through a storm season, so coatings and tilt can be sized. Cleaner panels give a higher rated output.',
    method: 'Storm model with deposition estimates',
    needs: 'Compute time (none from other stations)',
    months: 3, costM: 8, odds: 'Good',
    gains: [{ kind: 'limit', key: 'power.solar.outputKW', delta: 3 }],
  },
  {
    ids: ['a15', 'm8'],
    title: 'Panels tuned to dusty light',
    pitch: 'Sunlight at Mars is reddened by dust. Cells tuned to that spectrum convert more of what actually arrives.',
    method: 'Cell tests under a Mars-spectrum lamp',
    needs: 'Solar cell samples',
    months: 5, costM: 16, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'power.solar.outputKW', delta: 3 }],
  },
  {
    ids: ['m9', 'r16'],
    title: 'RTG safety case',
    pitch: 'A radioisotope generator only flies with a launch safety case: dose to the public in every accident scenario. Build it, and the RTG becomes a mission option.',
    method: 'Accident dose modelling and capsule tests',
    needs: 'Regulator review (Comms may help)',
    months: 7, costM: 40, odds: 'Medium',
    gains: [{ kind: 'unlock', key: 'power.rtg' }],
    flags: ['science.rtgSafetyCase'],
  },
  {
    ids: ['i12', 'm9'],
    title: 'Better thermocouples',
    pitch: 'The same thermoelectric materials that cool detectors turn RTG heat into power. Better couples mean more watts per kilogram of fuel.',
    method: 'Material screening on a heated test stand',
    needs: 'Lab time only',
    months: 5, costM: 18, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'power.rtg.outputKW', delta: 1 }],
  },

  // ------------------------------------------------ communications
  {
    ids: ['o11', 'o14'],
    title: 'Relay-assisted downlink',
    pitch: 'Plan the orbiter\'s antenna around relay passes and ground-station geometry, and the link supports a much higher rate.',
    method: 'Link budget study with relay orbit options',
    needs: 'Orbit options (Planning)',
    months: 5, costM: 15, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'antenna.standard.dataRateKbps', delta: 1500 }],
  },
  {
    ids: ['i14', 'o11'],
    title: 'More science per bit',
    pitch: 'Smarter coding and onboard compression squeeze more data through the same dish. The antenna is rated for a higher effective rate.',
    method: 'Coding trials on archive telemetry',
    needs: 'Archive telemetry',
    months: 3, costM: 9, odds: 'Good',
    gains: [{ kind: 'limit', key: 'antenna.standard.dataRateKbps', delta: 1000 }],
  },

  // ------------------------------------------------ protection
  {
    ids: ['m16', 'r6'],
    title: 'Polymer radiation shielding',
    pitch: 'Hydrogen-rich polymers stop cosmic-ray secondaries better than metal for the same mass. Qualify a layered shield.',
    method: 'Beam-line tests of layered samples',
    needs: 'Accelerator beam time',
    months: 6, costM: 20, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'radShield.standard.level', delta: 2 }],
  },
  {
    ids: ['r15', 'r6'],
    title: 'Shield layout by simulation',
    pitch: 'Simulate particle showers through the whole spacecraft and put shielding only where it counts.',
    method: 'Particle transport simulation',
    needs: 'Compute time',
    months: 3, costM: 9, odds: 'Good',
    gains: [{ kind: 'limit', key: 'radShield.standard.level', delta: 1 }],
  },
  {
    ids: ['a13', 'm1'],
    title: 'Entry heating margins',
    pitch: 'Measured entry winds and densities shrink the heating uncertainty, so the same protection rates higher.',
    method: 'Re-analysis of past entry data, arc-jet tests',
    needs: 'Arc-jet test slot',
    months: 5, costM: 16, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'heatProtection.standard.level', delta: 2 }],
  },
  {
    ids: ['m1', 'o16'],
    title: 'Shallow entry corridor',
    pitch: 'A shallower entry trades peak heating for a longer pulse. Pick the corridor with the protection in mind.',
    method: 'Trajectory and heating trade study',
    needs: 'Compute time',
    months: 3, costM: 8, odds: 'Good',
    gains: [{ kind: 'limit', key: 'heatProtection.standard.level', delta: 1 }],
  },

  // ------------------------------------------------ propulsion
  {
    ids: ['m7', 'o9'],
    title: 'Densified hydrogen feed',
    pitch: 'Sub-cooled hydrogen is denser and lets the upper-stage engine run a richer, more efficient cycle. Every second of Isp is delta-v.',
    method: 'Cryogenic feed tests and cycle analysis',
    needs: 'Cryogenic test stand',
    months: 5, costM: 22, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'engine.hydrolox.isp', delta: 10 }],
  },
  {
    ids: ['m10', 'm7'],
    title: 'Lightweight hydrogen turbopump',
    pitch: 'Composite housings and colder bearings let a hydrogen turbopump spin faster for the same mass: more thrust per engine.',
    method: 'Component tests on a pump rig',
    needs: 'Pump test rig',
    months: 4, costM: 16, odds: 'Good',
    gains: [{ kind: 'limit', key: 'engine.hydrolox.thrustKN', delta: 300 }],
  },
  {
    ids: ['m17', 'o9'],
    title: 'Injector lessons from methane engines',
    pitch: 'Methane engines built for fuel made on Mars taught a lot about injector mixing. Apply it to kerosene for a better burn.',
    method: 'Injector cold-flow and hot-fire tests',
    needs: 'Engine test stand',
    months: 4, costM: 15, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'engine.kerolox.isp', delta: 10 }],
  },
  {
    ids: ['m10', 'o9'],
    title: 'Composite booster casings',
    pitch: 'Lighter casings leave room for bigger chambers on the same pad. The booster engine can be rated for more thrust.',
    method: 'Structural tests of casing segments',
    needs: 'Structures lab',
    months: 4, costM: 14, odds: 'Good',
    gains: [{ kind: 'limit', key: 'engine.kerolox.thrustKN', delta: 1000 }],
  },
  {
    ids: ['m1', 'm10'],
    title: 'Composite nozzle liners',
    pitch: 'Carbon-carbon liners survive a hotter solid-motor exhaust, which buys a little more Isp from the same propellant.',
    method: 'Sub-scale motor firings',
    needs: 'Motor test range',
    months: 3, costM: 10, odds: 'Good',
    gains: [{ kind: 'limit', key: 'engine.solid.isp', delta: 10 }],
  },
  {
    ids: ['m15', 'o5'],
    title: 'Corrosion-proof insertion engine',
    pitch: 'Storable propellants eat valves. Corrosion-proof seals let the orbit-insertion engine run at a higher chamber pressure.',
    method: 'Long-duration soak tests and hot fires',
    needs: 'Engine test stand',
    months: 4, costM: 14, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'engine.hypergolic.isp', delta: 10 }],
  },
  {
    ids: ['m8', 'o6', 'r14'],
    title: 'Electric propulsion qualification',
    pitch: 'An ion engine spirals out slowly on solar power but needs a fraction of the propellant. Qualify grids, power processing and plume effects for a Mars cruise. Three-way combinations are rare.',
    method: 'Thruster life test plus spiral trajectory study',
    needs: 'Vacuum chamber time, power design (Planning)',
    months: 7, costM: 45, odds: 'Medium',
    gains: [{ kind: 'unlock', key: 'engine.ion' }, { kind: 'unlock', key: 'tank.ion' }],
  },
  {
    ids: ['o6', 'r14'],
    title: 'Grid erosion in the solar wind',
    pitch: 'Ion engine grids wear out from their own plasma. Understanding the erosion lets the engine run at a higher exhaust speed for the same life.',
    method: 'Plasma simulation and grid wear tests',
    needs: 'Vacuum chamber time',
    months: 5, costM: 18, odds: 'Medium',
    gains: [{ kind: 'limit', key: 'engine.ion.isp', delta: 500 }],
  },

  // ------------------------------------------------ pure science (no planner effect)
  {
    ids: ['g9', 'm3'],
    title: 'Mineable ice: depth versus yield',
    pitch: 'Where is buried ice shallow and clean enough that extracting it pays for itself on the first crewed landing?',
    method: 'Radar survey plus extraction test rig',
    needs: 'Archive radar data',
    months: 4, costM: 9, odds: 'Good', gains: [],
    finding: 'a map of shallow, clean ice that a future crew could mine.',
    flags: ['science.iceMap'],
  },
  {
    ids: ['r12', 'r2'],
    title: 'Where to shelter in a solar storm',
    pitch: 'Map how much terrain blocks storm particles around the candidate landing sites.',
    method: 'Particle transport modelling on terrain maps',
    needs: 'Compute time, terrain maps (Planning)',
    months: 2, costM: 5, odds: 'Good', gains: [],
    finding: 'storm-shelter maps for every candidate landing site.',
    flags: ['science.stormShelter'],
  },
  {
    ids: ['g16', 'r12', 'r2'],
    title: 'Lava-tube storm shelter',
    pitch: 'Natural tubes may cut storm dose by a large factor. Find candidate tubes before the landing site is chosen. Three-way combinations are rare.',
    method: 'Orbital imaging, radar survey and dose modelling',
    needs: 'Archive imaging',
    months: 6, costM: 14, odds: 'Medium', gains: [],
    finding: 'three lava tubes that could shelter a crew from solar storms.',
    flags: ['science.lavaTubes', 'research.breakthrough'],
  },
  {
    ids: ['a3', 'm4'],
    title: 'Propellant yield through the seasons',
    pitch: 'Carbon dioxide frost comes and goes. How much does a future fuel plant\'s output change between seasons?',
    method: 'Atmosphere model driving a plant simulation',
    needs: 'Compute time',
    months: 2, costM: 5, odds: 'Good', gains: [],
    finding: 'a seasonal yield curve for making rocket fuel on Mars.',
    flags: ['science.isruSeasons'],
  },
  {
    ids: ['a19', 'a5'],
    title: 'Was the single-pass methane burst real?',
    pitch: 'One rover pass logged a methane spike that never repeated. Was it a real release or an instrument effect?',
    method: 'Re-process archive passes near the site',
    needs: 'Archive access only',
    months: 2, costM: 4, odds: 'Medium', gains: [],
    finding: 'the methane burst was real, and it came from a fracture zone.',
    flags: ['science.methaneBurst', 'research.breakthrough'],
  },
  {
    ids: ['b19', 'b2'],
    title: 'Is the delta organic signal real?',
    pitch: 'A weak organic-like signal in a delta drill sample is neither confirmed nor ruled out. Could organics have survived there, and could contamination explain it?',
    method: 'Preservation modelling plus archive re-check',
    needs: 'Archive access, 1 lab slot',
    months: 3, costM: 6, odds: 'Long shot', gains: [],
    finding: 'the delta organic signal survives every contamination check. Headlines incoming.',
    flags: ['science.deltaOrganics', 'research.breakthrough'],
  },
  {
    ids: ['a12', 'o11'],
    title: 'Radio occultation profiles',
    pitch: 'Every time a spacecraft slips behind Mars its radio signal bends through the atmosphere. Turn those archive passes into temperature profiles.',
    method: 'Re-process archive tracking data',
    needs: 'Archive access only',
    months: 2, costM: 4, odds: 'Good', gains: [],
    finding: 'a decade of atmosphere temperature profiles, rescued from tracking data.',
    flags: ['science.occultation'],
  },
];

export function recipeKey(ids: readonly string[]): string {
  return [...ids].sort().join('+');
}

const BY_KEY = new Map(RECIPES.map((r) => [recipeKey(r.ids), r]));

export function findRecipe(ids: readonly string[]): Recipe | undefined {
  return BY_KEY.get(recipeKey(ids));
}

export function recipeByKey(key: string): Recipe | undefined {
  return BY_KEY.get(key);
}

/** Recipes whose gains touch a research or unlock key. */
export function recipesFor(key: string): Recipe[] {
  return RECIPES.filter((r) => r.gains.some((g) => g.key === key));
}
