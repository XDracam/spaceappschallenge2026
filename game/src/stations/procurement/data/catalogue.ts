// Hand-authored catalogue (D-005): Resources for every planner part kind/variant,
// with stats on the planner's stat keys (mission-planner/procurement-interface.md),
// and 1–3 catalogue Offers each. Sized so the Mars orbiter + lander starting design
// can be bought (kerolox ~1900 kN, hydrolox ~110 kN @ 445 s, hypergolic 0.5 / 30 kN,
// tanks 0.6–250 t, camera 4, surface lab 3, solar 1–2 kW, antenna 100–500 kbps …).
// Some Resources exceed the starting research limits / unlocks: domestic suppliers
// cannot sell them until science researches them (tender via a Call instead).
import type { Offer, PartKind, Resource } from '../../../core/model';
import { SUPPLIER_BY_ID } from './suppliers';
import {
  DAYS_PER_MONTH, baseLeadMonths, clamp, estimateCostM, estimateMassT, kindReliability, round1, round3,
} from './pricing';

export interface CatalogueResource extends Resource {
  blurb: string;
  supplierIds: string[];
}

type Row = [id: string, name: string, variant: string, stats: Record<string, number>, suppliers: string[], blurb?: string];

const ROWS: Record<PartKind, Row[]> = {
  engine: [
    ['e-sol-600', 'Thumper S-600', 'solid', { thrustKN: 600, isp: 250 }, ['brightline', 'tallis'], 'Simple segmented solid motor. Cheap thrust, no restart.'],
    ['e-sol-2500', 'Granite S-2500', 'solid', { thrustKN: 2500, isp: 262 }, ['tallis', 'commons', 'helix'], 'Heavy solid booster for first stages.'],
    ['e-sol-9000', 'Basalt S-9000', 'solid', { thrustKN: 9000, isp: 280 }, ['tallis', 'helix'], 'High-energy composite propellant for heavy solid boosters.'],
    ['e-ker-90', 'Kestrel KL-90', 'kerolox', { thrustKN: 90, isp: 318 }, ['swift', 'commons'], 'Small pump-fed kerosene engine for upper stages.'],
    ['e-ker-1000', 'Taiga KL-1000', 'kerolox', { thrustKN: 1000, isp: 302 }, ['brightline', 'tallis', 'commons'], 'Workhorse gas-generator engine.'],
    ['e-ker-2000', 'Taiga KL-2000', 'kerolox', { thrustKN: 2000, isp: 305 }, ['brightline', 'tallis', 'swift'], 'Booster-class kerosene engine. Cluster two for a heavy first stage.'],
    ['e-ker-2000h', 'Boreal KL-2000H', 'kerolox', { thrustKN: 2000, isp: 330 }, ['helix', 'commons'], 'Staged-combustion variant: more Isp, more money.'],
    ['e-ker-4500', 'Boreal KL-4500', 'kerolox', { thrustKN: 4500, isp: 320 }, ['tallis', 'helix'], 'Very large single-chamber booster engine.'],
    ['e-ker-2200x', 'Boreal KL-2200X', 'kerolox', { thrustKN: 2200, isp: 352 }, ['helix'], 'Full-flow prototype with high specific impulse (Isp).'],
    ['e-hyd-15', 'Lumen HL-15', 'hydrolox', { thrustKN: 15, isp: 448 }, ['swift', 'helix'], 'Compact expander-cycle engine.'],
    ['e-hyd-120', 'Lumen HL-120', 'hydrolox', { thrustKN: 120, isp: 446 }, ['helix', 'commons', 'swift'], 'Upper-stage hydrogen engine with a long vacuum nozzle.'],
    ['e-hyd-120b', 'Lumen HL-120B', 'hydrolox', { thrustKN: 120, isp: 432 }, ['brightline', 'tallis'], 'Budget version with a shorter nozzle — less Isp.'],
    ['e-hyd-400', 'Aurora HL-400', 'hydrolox', { thrustKN: 400, isp: 440 }, ['tallis', 'helix'], 'Mid-size hydrogen engine.'],
    ['e-hyd-1800', 'Aurora HL-1800', 'hydrolox', { thrustKN: 1800, isp: 425 }, ['tallis', 'commons'], 'Core-stage hydrogen engine.'],
    ['e-hyd-130x', 'Aurora HL-130X', 'hydrolox', { thrustKN: 130, isp: 462 }, ['helix'], 'Advanced hydrogen injector for high specific impulse (Isp).'],
    ['e-hyp-06', 'Pip HT-0.6', 'hypergolic', { thrustKN: 0.6, isp: 316 }, ['swift', 'commons', 'helix'], 'Orbit-insertion thruster; restartable, storable propellants.'],
    ['e-hyp-06b', 'Pip HT-0.6B', 'hypergolic', { thrustKN: 0.6, isp: 305 }, ['brightline'], 'Older design, lower Isp, very cheap.'],
    ['e-hyp-5', 'Pip HT-5', 'hypergolic', { thrustKN: 5, isp: 312 }, ['commons', 'tallis'], 'Small apogee engine.'],
    ['e-hyp-35', 'Vesta HT-35', 'hypergolic', { thrustKN: 35, isp: 314 }, ['helix', 'swift', 'tallis'], 'Throttleable descent engine.'],
    ['e-hyp-120', 'Vesta HT-120', 'hypergolic', { thrustKN: 120, isp: 306 }, ['tallis', 'brightline'], 'Large storable engine for landers and ascent stages.'],
    ['e-hyp-40x', 'Vesta HT-40X', 'hypergolic', { thrustKN: 40, isp: 334 }, ['helix'], 'High-pressure chamber for efficient storable propulsion.'],
    ['e-ion-025', 'Whisper XI-25', 'ion', { thrustKN: 0.00025, isp: 3000 }, ['helix', 'swift'], 'Gridded xenon thruster for efficient, low-thrust transfers.'],
    ['e-ion-100', 'Whisper XI-100', 'ion', { thrustKN: 0.001, isp: 3200 }, ['helix'], 'High-power gridded ion thruster.'],
  ],
  tank: [
    ['t-sol-5', 'Casing SC-5', 'solid', { fuelT: 5 }, ['brightline', 'tallis'], 'Solid propellant casing, 5 t.'],
    ['t-sol-60', 'Casing SC-60', 'solid', { fuelT: 60 }, ['tallis', 'commons'], 'Solid propellant casing, 60 t.'],
    ['t-sol-300', 'Casing SC-300', 'solid', { fuelT: 300 }, ['tallis'], 'Heavy booster casing, 300 t.'],
    ['t-ker-30', 'Silo KT-30', 'kerolox', { fuelT: 30 }, ['commons', 'swift'], 'Kerosene/oxygen tank set, 30 t.'],
    ['t-ker-120', 'Silo KT-120', 'kerolox', { fuelT: 120 }, ['brightline', 'tallis', 'commons'], 'Kerosene/oxygen tank set, 120 t.'],
    ['t-ker-260', 'Silo KT-260', 'kerolox', { fuelT: 260 }, ['brightline', 'tallis', 'helix'], 'First-stage tank set, 260 t.'],
    ['t-ker-600', 'Silo KT-600', 'kerolox', { fuelT: 600 }, ['tallis'], 'Heavy-lift tank set, 600 t.'],
    ['t-hyd-6', 'Cryo HT-6', 'hydrolox', { fuelT: 6 }, ['swift', 'helix'], 'Insulated hydrogen/oxygen tank, 6 t.'],
    ['t-hyd-22', 'Cryo HT-22', 'hydrolox', { fuelT: 22 }, ['commons', 'helix', 'brightline'], 'Upper-stage cryogenic tank, 22 t.'],
    ['t-hyd-80', 'Cryo HT-80', 'hydrolox', { fuelT: 80 }, ['tallis', 'commons'], 'Cryogenic tank, 80 t.'],
    ['t-hyd-200', 'Cryo HT-200', 'hydrolox', { fuelT: 200 }, ['tallis'], 'Core-stage cryogenic tank, 200 t.'],
    ['t-hyp-025', 'Flask PT-0.25', 'hypergolic', { fuelT: 0.25 }, ['meridian', 'commons'], 'Small storable propellant tank.'],
    ['t-hyp-07', 'Flask PT-0.7', 'hypergolic', { fuelT: 0.7 }, ['commons', 'swift', 'brightline'], 'Lander propellant tank, 0.7 t.'],
    ['t-hyp-16', 'Flask PT-1.6', 'hypergolic', { fuelT: 1.6 }, ['commons', 'helix', 'brightline'], 'Orbiter propellant tank, 1.6 t.'],
    ['t-hyp-4', 'Flask PT-4', 'hypergolic', { fuelT: 4 }, ['tallis', 'commons'], 'Large storable propellant tank, 4 t.'],
    ['t-ion-01', 'Xenon XT-0.1', 'ion', { fuelT: 0.1 }, ['helix'], 'Xenon pressure vessel for electric propulsion.'],
    ['t-ion-05', 'Xenon XT-0.5', 'ion', { fuelT: 0.5 }, ['helix', 'swift'], 'Large xenon vessel for electric propulsion.'],
  ],
  instrument: [
    ['i-cam-3', 'Glimpse C3', 'camera', { performance: 3 }, ['commons', 'brightline'], 'Wide-angle mapping camera.'],
    ['i-cam-45', 'Panorama C4.5', 'camera', { performance: 4.5 }, ['meridian', 'commons', 'swift'], 'Medium-resolution orbital camera.'],
    ['i-cam-6', 'Panorama C6', 'camera', { performance: 6 }, ['meridian', 'helix'], 'High-resolution orbital camera.'],
    ['i-cam-8', 'Hawkeye C8', 'camera', { performance: 8 }, ['helix'], 'Telescope-class orbital camera.'],
    ['i-spe-3', 'Prism S3', 'spectrometer', { performance: 3 }, ['meridian', 'commons'], 'Visible/near-infrared spectrometer.'],
    ['i-spe-5', 'Prism S5', 'spectrometer', { performance: 5 }, ['meridian', 'helix'], 'Imaging spectrometer for mineral maps.'],
    ['i-rad-3', 'Deepsound R3', 'radar', { performance: 3 }, ['meridian'], 'Subsurface sounding radar.'],
    ['i-rad-5', 'Deepsound R5', 'radar', { performance: 5 }, ['helix'], 'Long-wavelength sounding radar.'],
    ['i-lab-32', 'Fieldkit L3.2', 'surfaceLab', { performance: 3.2 }, ['meridian', 'commons', 'brightline'], 'Compact surface chemistry lab.'],
    ['i-lab-45', 'Fieldkit L4.5', 'surfaceLab', { performance: 4.5 }, ['meridian', 'helix'], 'Surface lab with drill and oven.'],
    ['i-lab-6', 'Pathfinder L6', 'surfaceLab', { performance: 6 }, ['helix'], 'Full analytical suite for surface samples.'],
  ],
  power: [
    ['p-sol-06', 'Sunleaf SP-0.6', 'solar', { outputKW: 0.6 }, ['brightline', 'commons'], 'Small body-mounted panels.'],
    ['p-sol-12', 'Sunleaf SP-1.2', 'solar', { outputKW: 1.2 }, ['meridian', 'commons', 'brightline'], 'Deployable panel pair, 1.2 kW at 1 AU.'],
    ['p-sol-25', 'Sunleaf SP-2.5', 'solar', { outputKW: 2.5 }, ['meridian', 'swift', 'brightline'], 'Deployable wings, 2.5 kW at 1 AU.'],
    ['p-sol-6', 'Heliostat SP-6', 'solar', { outputKW: 6 }, ['meridian', 'helix'], 'Large arrays for power-hungry payloads.'],
    ['p-sol-18', 'Heliostat SP-18', 'solar', { outputKW: 18 }, ['helix'], 'Large roll-out solar array.'],
    ['p-rtg-03', 'Ember RTG-0.3', 'rtg', { outputKW: 0.3 }, ['helix'], 'Compact radioisotope generator.'],
    ['p-rtg-08', 'Ember RTG-0.8', 'rtg', { outputKW: 0.8 }, ['helix'], 'Large radioisotope generator.'],
  ],
  antenna: [
    ['a-120', 'Relay HG-120', 'standard', { dataRateKbps: 120 }, ['commons', 'brightline'], 'Small high-gain antenna.'],
    ['a-600', 'Relay HG-600', 'standard', { dataRateKbps: 600 }, ['meridian', 'commons', 'swift'], 'Medium dish, 600 kbps at 1 AU.'],
    ['a-2000', 'Beacon HG-2000', 'standard', { dataRateKbps: 2000 }, ['meridian', 'helix'], 'Large deployable dish.'],
    ['a-5000', 'Beacon KA-5000', 'standard', { dataRateKbps: 5000 }, ['helix'], 'High-throughput Ka-band communications system.'],
  ],
  legs: [
    ['l-1', 'Strider LG-1', 'standard', { maxLandingMassT: 1 }, ['commons', 'brightline'], 'Crushable-core legs for light landers.'],
    ['l-25', 'Strider LG-2.5', 'standard', { maxLandingMassT: 2.5 }, ['commons', 'helix', 'swift'], 'Four-leg set rated to 2.5 t.'],
    ['l-6', 'Strider LG-6', 'standard', { maxLandingMassT: 6 }, ['tallis', 'helix'], 'Heavy landing gear, 6 t.'],
    ['l-15', 'Atlas LG-15', 'standard', { maxLandingMassT: 15 }, ['tallis'], 'Landing gear for very large landers.'],
  ],
  heatShield: [
    ['h-15', 'Aegis HS-1.5', 'standard', { maxEntryMassT: 1.5 }, ['commons', 'brightline'], 'Ablative aeroshell for small probes.'],
    ['h-3', 'Aegis HS-3', 'standard', { maxEntryMassT: 3 }, ['commons', 'helix', 'swift'], 'Aeroshell rated to 3 t entry mass.'],
    ['h-8', 'Aegis HS-8', 'standard', { maxEntryMassT: 8 }, ['helix', 'tallis'], 'Large aeroshell, 8 t.'],
  ],
  radShield: [
    ['r-1', 'Vault RS-1', 'standard', { level: 1 }, ['commons', 'meridian'], 'Spot shielding for electronics.'],
    ['r-2', 'Vault RS-2', 'standard', { level: 2 }, ['meridian', 'brightline'], 'Electronics vault.'],
    ['r-4', 'Vault RS-4', 'standard', { level: 4 }, ['helix', 'meridian'], 'Heavy vault for Jupiter-class radiation.'],
    ['r-6', 'Vault RS-6', 'standard', { level: 6 }, ['helix'], 'Graded-Z shielding for spacecraft electronics.'],
  ],
  heatProtection: [
    ['hp-1', 'Frost TP-1', 'standard', { level: 1 }, ['commons', 'meridian'], 'Multi-layer insulation and heaters.'],
    ['hp-2', 'Frost TP-2', 'standard', { level: 2 }, ['meridian', 'brightline'], 'Active thermal control loop.'],
    ['hp-3', 'Furnace TP-3', 'standard', { level: 3 }, ['helix', 'meridian'], 'High-temperature protection for hot surfaces.'],
    ['hp-5', 'Furnace TP-5', 'standard', { level: 5 }, ['helix'], 'High-temperature protection for Venus-class surface conditions.'],
  ],
};

export const RESOURCES: CatalogueResource[] = (Object.keys(ROWS) as PartKind[]).flatMap((kind) =>
  ROWS[kind].map(([id, name, variant, stats, suppliers, blurb]) => ({
    id, name, partKind: kind, variant, stats,
    massT: round3(estimateMassT(kind, variant, stats)),
    blurb: blurb ?? '',
    supplierIds: suppliers,
  })),
);

export const RESOURCE_BY_ID: Record<string, CatalogueResource> = Object.fromEntries(RESOURCES.map((r) => [r.id, r]));

/** Catalogue Offer for one unit of a Resource from one supplier (authored rule). */
function catalogueOffer(r: CatalogueResource, supplierId: string): Offer {
  const sup = SUPPLIER_BY_ID[supplierId];
  const base = estimateCostM(r.partKind, r.variant, r.stats);
  const leadMonths = clamp(baseLeadMonths(r.partKind, r.variant, r.stats) + sup.leadDeltaMonths, 2, 14);
  return {
    id: `cat-${r.id}-${sup.id}`,
    revision: 1,
    supplierId: sup.id,
    supplierName: sup.name,
    resourceId: r.id,
    resource: { name: r.name, partKind: r.partKind, variant: r.variant, stats: r.stats, massT: r.massT },
    quantity: 1,
    priceM: Math.max(0.1, round1(base * sup.priceFactor)),
    leadTimeDays: Math.round(leadMonths * DAYS_PER_MONTH),
    reliability: round3(clamp(kindReliability(r.partKind, r.variant) + sup.reliabilityDelta, 0.85, 0.995)),
    cancellationPct: sup.cancellationPct,
    source: 'catalogue',
    status: 'available',
  };
}

/** Static catalogue Offers (not stored in state; reusable — sign as often as needed). */
export const CATALOGUE_OFFERS: Offer[] = RESOURCES.flatMap((r) => r.supplierIds.map((sid) => catalogueOffer(r, sid)));
export const CATALOGUE_OFFER_BY_ID: Record<string, Offer> = Object.fromEntries(CATALOGUE_OFFERS.map((o) => [o.id, o]));

export function offersForResource(resourceId: string): Offer[] {
  return CATALOGUE_OFFERS.filter((o) => o.resourceId === resourceId);
}
