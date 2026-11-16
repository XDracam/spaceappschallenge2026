// Authored tech tree shared by all missions (D-005). Every name, cost, duration,
// chance and prerequisite is a balancing placeholder. Techs grant planner research limits
// or unlocks (keys `kind.variant.stat` and `kind.variant`, as in mission-planner/procurement-interface.md).
// Where two techs grant the same value they are alternative routes to the same goal.
import type { Branch, Gate, Grant, Tech } from '../model/types';

const limit = (key: string, value: number): Grant => ({ kind: 'limit', key, value });
const unlock = (key: string): Grant => ({ kind: 'unlock', key });

function tech(
  id: string, name: string, branch: Branch, requires: string[], blurb: string, gives: Grant[],
  costM: number, months: number, chance: number, extra: { gate?: Gate } = {},
): Tech {
  return { id, name, branch, requires, blurb, gives, costM, months, chance, ...extra };
}
const start = (id: string, name: string, branch: Branch, blurb: string): Tech =>
  ({ id, name, branch, requires: [], blurb, gives: [], costM: 0, months: 0, chance: 1, start: true });

export const BRANCH_LABEL: Record<Branch, string> = {
  propulsion: 'Propulsion', power: 'Power', instruments: 'Instruments', antenna: 'Antenna and data', protection: 'Protection',
};
export const BRANCH_COLOR: Record<Branch, string> = {
  propulsion: '#ffa657', power: '#f2b84b', instruments: '#c78bff', antenna: '#5fb3ff', protection: '#4cc38a',
};
export const BRANCH_ORDER: Branch[] = ['propulsion', 'power', 'instruments', 'antenna', 'protection'];

export const TECHS: Tech[] = [
  // ---------------------------------------------------------------- propulsion
  start('chem-base', 'Chemical propulsion', 'propulsion', 'The agency\'s established solid, kerosene, hydrogen and storable engines.'),
  tech('staged-combustion', 'Staged combustion upgrade', 'propulsion', ['chem-base'],
    'Burns the exhaust of the pre-burner in the main chamber. More Isp from the same propellant.',
    [limit('engine.kerolox.isp', 350)], 10, 4, 0.9),
  tech('turbopump-hp', 'High-pressure turbopumps', 'propulsion', ['chem-base'],
    'Pumps that feed more propellant per second. Raises thrust at the same engine size.',
    [limit('engine.kerolox.thrustKN', 9000), limit('engine.hydrolox.thrustKN', 2750)], 12, 5, 0.9),
  tech('hypergolic-tuning', 'Hypergolic injector tuning', 'propulsion', ['chem-base'],
    'Finer injectors for storable propellants. A small Isp gain for the orbiter and lander engines.',
    [limit('engine.hypergolic.isp', 335)], 8, 3, 0.95),
  tech('nozzle-extension', 'Extendable nozzle', 'propulsion', ['staged-combustion'],
    'A nozzle that unfolds in vacuum for a better expansion ratio.',
    [limit('engine.kerolox.isp', 360), limit('engine.hydrolox.isp', 458)], 22, 6, 0.8),
  tech('regen-cooling', 'Regenerative cooling', 'propulsion', ['turbopump-hp'],
    'Propellant cools the chamber walls before it burns. Allows hotter, stronger engines.',
    [limit('engine.hydrolox.thrustKN', 3000), limit('engine.kerolox.thrustKN', 10000)], 25, 6, 0.8),
  tech('densified-cryo', 'Densified cryogenics', 'propulsion', ['regen-cooling', 'nozzle-extension'],
    'Colder, denser propellant and a tuned expander cycle for the best hydrogen engines.',
    [limit('engine.hydrolox.isp', 465)], 40, 8, 0.7),
  tech('xenon-feed', 'Xenon feed system', 'propulsion', ['chem-base'],
    'Tanks, valves and flow control for xenon. Needed before any electric engine flies.',
    [unlock('tank.ion')], 9, 4, 0.9),
  tech('ion-ppu', 'Ion power processing unit', 'propulsion', ['hv-arrays'],
    'Converts solar array power into the high voltages an ion engine needs.',
    [], 18, 5, 0.85),
  tech('ion-grid', 'Gridded ion engine', 'propulsion', ['xenon-feed', 'ion-ppu'],
    'Accelerates xenon ions through charged grids. Very efficient, very low thrust.',
    [unlock('engine.ion')], 28, 7, 0.8),
  tech('ion-high-isp', 'High-impulse ion grids', 'propulsion', ['ion-grid'],
    'Closer grid spacing and better materials for a higher exhaust speed.',
    [limit('engine.ion.isp', 4200)], 30, 7, 0.7),

  // --------------------------------------------------------------------- power
  start('solar-base', 'Solar arrays', 'power', 'Established silicon and gallium arsenide solar panels.'),
  tech('hv-arrays', 'High-voltage solar arrays', 'power', ['solar-base'],
    'Wiring that carries power at higher voltage with less loss.',
    [limit('power.solar.outputKW', 18)], 10, 4, 0.9),
  tech('triple-junction', 'Triple-junction cells', 'power', ['solar-base'],
    'Three stacked cell layers catch more of the spectrum.',
    [limit('power.solar.outputKW', 20)], 14, 5, 0.9),
  tech('light-panels', 'Lightweight deployable panels', 'power', ['hv-arrays'],
    'Thin, rolled-out panels that give more area for the same launch mass.',
    [limit('power.solar.outputKW', 24)], 22, 6, 0.8),
  tech('concentrators', 'Concentrator arrays', 'power', ['triple-junction'],
    'Mirrors focus light on small, expensive cells.',
    [limit('power.solar.outputKW', 24)], 24, 6, 0.8),
  tech('metamorphic', 'Inverted metamorphic cells', 'power', ['light-panels', 'concentrators'],
    'Lightweight, efficient cells that are difficult to manufacture.',
    [limit('power.solar.outputKW', 30)], 42, 9, 0.65),
  tech('rtg-heat-source', 'Radioisotope heat source', 'power', ['solar-base'],
    'Qualifies a plutonium-238 heat source for flight. Needs the government to approve nuclear material.',
    [], 20, 6, 0.9, { gate: { by: 'government', why: 'Nuclear material needs government approval.' } }),
  tech('thermoelectric', 'Thermoelectric converters', 'power', ['rtg-heat-source'],
    'Turns the heat of decay into electricity with no moving parts.',
    [unlock('power.rtg'), limit('power.rtg.outputKW', 1.5)], 24, 6, 0.85),
  tech('dynamic-isotope', 'Dynamic isotope converters', 'power', ['thermoelectric'],
    'Moving converters that get more electricity from the same heat.',
    [limit('power.rtg.outputKW', 3)], 38, 9, 0.7),

  // --------------------------------------------------------------- instruments
  start('instr-base', 'Flight instruments', 'instruments', 'The agency\'s established cameras, spectrometers and surface lab.'),
  tech('large-sensor', 'Larger sensor arrays', 'instruments', ['instr-base'],
    'Bigger detectors for the same camera body. More pixels per image.',
    [limit('instrument.camera.performance', 7)], 9, 4, 0.9),
  tech('adaptive-optics', 'Adaptive optics', 'instruments', ['instr-base'],
    'Mirrors that correct small distortions as they happen.',
    [limit('instrument.camera.performance', 7)], 12, 5, 0.85),
  tech('computational-imaging', 'Computational imaging', 'instruments', ['large-sensor'],
    'Stacks many frames on board for a sharper picture.',
    [limit('instrument.camera.performance', 8)], 15, 5, 0.85),
  tech('wavefront-control', 'Wavefront control', 'instruments', ['adaptive-optics'],
    'Tuned control loops that get close to the optical limit.',
    [limit('instrument.camera.performance', 8)], 16, 5, 0.85),
  tech('large-aperture', 'Large-aperture mirror', 'instruments', ['computational-imaging'],
    'A wide folding mirror for a lighter, sharper camera.',
    [limit('instrument.camera.performance', 9)], 32, 8, 0.7),
  tech('cooled-focal-plane', 'Cooled focal planes', 'instruments', ['wavefront-control'],
    'Detectors held cold for the lowest noise.',
    [limit('instrument.camera.performance', 9)], 34, 8, 0.7),
  tech('spec-sensitivity', 'Spectrometer sensitivity', 'instruments', ['instr-base'],
    'Better detectors and calibration for the infrared spectrometer.',
    [limit('instrument.spectrometer.performance', 7)], 9, 4, 0.9),
  tech('spec-resolution', 'High-resolution spectrometer', 'instruments', ['spec-sensitivity'],
    'Finer wavelength bins to separate more minerals.',
    [limit('instrument.spectrometer.performance', 8)], 18, 6, 0.8),
  tech('radar-electronics', 'Radar electronics', 'instruments', ['instr-base'],
    'Pulse generators and receivers for a sounding radar that works in space.',
    [unlock('instrument.radar')], 14, 5, 0.85),
  tech('subsurface-sounding', 'Subsurface sounding', 'instruments', ['radar-electronics'],
    'Lower frequencies that reach deeper into the ground.',
    [limit('instrument.radar.performance', 6)], 22, 6, 0.8),
  tech('lab-automation', 'Lab automation', 'instruments', ['instr-base'],
    'Robotic sample handling for the surface lab.',
    [limit('instrument.surfaceLab.performance', 6)], 14, 5, 0.85),
  tech('lab-microscopy', 'In-situ microscopy', 'instruments', ['lab-automation'],
    'A microscope and a mass spectrometer in one box.',
    [limit('instrument.surfaceLab.performance', 7)], 26, 7, 0.75),

  // ----------------------------------------------------------- antenna and data
  start('antenna-base', 'X-band communications', 'antenna', 'The standard high-gain antenna.'),
  tech('ka-band', 'Ka-band downlink', 'antenna', ['antenna-base'],
    'A higher radio frequency that carries more data in the same time.',
    [limit('antenna.standard.dataRateKbps', 4000)], 10, 4, 0.9),
  tech('big-dish', 'Larger deployable dish', 'antenna', ['antenna-base'],
    'A bigger dish that folds up for launch.',
    [limit('antenna.standard.dataRateKbps', 4000)], 12, 5, 0.9),
  tech('adaptive-coding', 'Adaptive coding', 'antenna', ['big-dish'],
    'Error coding that adapts to the link quality and wastes less bandwidth.',
    [limit('antenna.standard.dataRateKbps', 5000)], 14, 4, 0.9),
  tech('optical-terminal', 'Optical communications terminal', 'antenna', ['ka-band'],
    'A high-throughput laser link. Needs partner approval for ground-station access.',
    [limit('antenna.standard.dataRateKbps', 6000)], 30, 7, 0.75,
    { gate: { by: 'partners', why: 'A laser link needs a licence from partner agencies.' } }),
  tech('phased-array', 'Phased-array antenna', 'antenna', ['adaptive-coding', 'optical-terminal'],
    'Electronic beam steering and improved link control increase data throughput.',
    [limit('antenna.standard.dataRateKbps', 8000)], 36, 8, 0.7),

  // ---------------------------------------------------------------- protection
  start('shield-base', 'Shielding and thermal control', 'protection', 'Aluminium shielding and standard ablative heat protection.'),
  tech('poly-shield', 'Polyethylene composite shield', 'protection', ['shield-base'],
    'Hydrogen-rich plastic that blocks cosmic rays better than metal.',
    [limit('radShield.standard.level', 5)], 10, 4, 0.9),
  tech('layered-shield', 'Layered hydrogen shield', 'protection', ['poly-shield'],
    'Layers of water and polymer protect critical spacecraft electronics.',
    [limit('radShield.standard.level', 6)], 20, 6, 0.8),
  tech('magnetic-deflector', 'Magnetic deflector', 'protection', ['layered-shield'],
    'A field that bends charged particles away. Untested outside the lab.',
    [limit('radShield.standard.level', 7)], 48, 10, 0.55),
  tech('better-ablator', 'High-temperature insulation', 'protection', ['shield-base'],
    'Insulation that helps spacecraft equipment operate on hot surfaces.',
    [limit('heatProtection.standard.level', 4)], 10, 4, 0.9),
  tech('dual-layer', 'Layered thermal barriers', 'protection', ['better-ablator'],
    'Layered barriers reduce heat reaching equipment during surface operations.',
    [limit('heatProtection.standard.level', 5)], 20, 6, 0.8),
  tech('reusable-tps', 'Surface thermal protection', 'protection', ['dual-layer'],
    'Advanced materials extend operations on very hot surfaces. Heavy testing needed.',
    [limit('heatProtection.standard.level', 6)], 36, 9, 0.65),
];

export const TECH_BY_ID: Record<string, Tech> = Object.fromEntries(TECHS.map((t) => [t.id, t]));
export const START_TECHS: string[] = TECHS.filter((t) => t.start).map((t) => t.id);
