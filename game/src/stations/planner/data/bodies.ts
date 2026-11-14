import type { Body, BodyId } from '../model/types';
import { AU_KM } from '../model/units';

// Hand-crafted body data (D-005). Rounded real values; circular coplanar orbits.
// Phases at day 0 are chosen, not real: Mars leads Earth by ~155 deg so the
// first Earth->Mars Hohmann window opens around day 240 (synodic period ~780 d).

export const BODIES: Record<BodyId, Body> = {
  sun: {
    id: 'sun', name: 'Sun', parent: null, orbitRadiusKm: 0, phaseAtEpochDeg: 0,
    radiusKm: 696_000, muKm3s2: 1.32712e11, surfaceGravity: 274, atmosphere: 'gas', landable: false,
    lowOrbitAltKm: 0, minOrbitAltKm: 0, maxOrbitAltKm: 0,
    launchDvMs: 0, landDvMs: 0, landDvWithShieldMs: 0, radiationPerDay: 0, surfaceHeat: false, color: '#ffcc33',
  },
  mercury: {
    id: 'mercury', name: 'Mercury', parent: 'sun', orbitRadiusKm: 0.387 * AU_KM, phaseAtEpochDeg: 60,
    radiusKm: 2440, muKm3s2: 22_032, surfaceGravity: 3.7, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 200, minOrbitAltKm: 100, maxOrbitAltKm: 50_000,
    launchDvMs: 3060, landDvMs: 3060, landDvWithShieldMs: 3060, radiationPerDay: 0, surfaceHeat: false, color: '#a9a29a',
  },
  venus: {
    id: 'venus', name: 'Venus', parent: 'sun', orbitRadiusKm: 0.723 * AU_KM, phaseAtEpochDeg: 200,
    radiusKm: 6052, muKm3s2: 324_859, surfaceGravity: 8.87, atmosphere: 'thick', landable: true,
    lowOrbitAltKm: 300, minOrbitAltKm: 250, maxOrbitAltKm: 300_000,
    launchDvMs: 27_000, landDvMs: 27_000, landDvWithShieldMs: 300, radiationPerDay: 0, surfaceHeat: true, color: '#e8c27a',
  },
  earth: {
    id: 'earth', name: 'Earth', parent: 'sun', orbitRadiusKm: 1.0 * AU_KM, phaseAtEpochDeg: 0,
    radiusKm: 6371, muKm3s2: 398_600, surfaceGravity: 9.81, atmosphere: 'thick', landable: true,
    lowOrbitAltKm: 200, minOrbitAltKm: 160, maxOrbitAltKm: 300_000,
    launchDvMs: 9400, landDvMs: 9400, landDvWithShieldMs: 100, radiationPerDay: 0, surfaceHeat: false, color: '#4f8fe8',
  },
  moon: {
    id: 'moon', name: 'Moon', parent: 'earth', orbitRadiusKm: 384_400, phaseAtEpochDeg: 90,
    radiusKm: 1737, muKm3s2: 4902.8, surfaceGravity: 1.62, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 100, minOrbitAltKm: 15, maxOrbitAltKm: 50_000,
    launchDvMs: 1870, landDvMs: 1870, landDvWithShieldMs: 1870, radiationPerDay: 0, surfaceHeat: false, color: '#c8c8c8',
  },
  mars: {
    id: 'mars', name: 'Mars', parent: 'sun', orbitRadiusKm: 1.524 * AU_KM, phaseAtEpochDeg: 154.8,
    radiusKm: 3390, muKm3s2: 42_828, surfaceGravity: 3.71, atmosphere: 'thin', landable: true,
    lowOrbitAltKm: 250, minOrbitAltKm: 120, maxOrbitAltKm: 100_000,
    launchDvMs: 4100, landDvMs: 4100, landDvWithShieldMs: 600, radiationPerDay: 0, surfaceHeat: false, color: '#d0603a',
  },
  phobos: {
    id: 'phobos', name: 'Phobos', parent: 'mars', orbitRadiusKm: 9376, phaseAtEpochDeg: 30,
    radiusKm: 11, muKm3s2: 7.1e-4, surfaceGravity: 0.0057, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 5, minOrbitAltKm: 2, maxOrbitAltKm: 10,
    launchDvMs: 10, landDvMs: 10, landDvWithShieldMs: 10, radiationPerDay: 0, surfaceHeat: false, color: '#8a7766',
  },
  deimos: {
    id: 'deimos', name: 'Deimos', parent: 'mars', orbitRadiusKm: 23_463, phaseAtEpochDeg: 210,
    radiusKm: 6, muKm3s2: 9.6e-5, surfaceGravity: 0.003, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 3, minOrbitAltKm: 2, maxOrbitAltKm: 15,
    launchDvMs: 6, landDvMs: 6, landDvWithShieldMs: 6, radiationPerDay: 0, surfaceHeat: false, color: '#9b8b78',
  },
  vesta: {
    id: 'vesta', name: 'Vesta', parent: 'sun', orbitRadiusKm: 2.362 * AU_KM, phaseAtEpochDeg: 300,
    radiusKm: 263, muKm3s2: 17.3, surfaceGravity: 0.25, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 50, minOrbitAltKm: 20, maxOrbitAltKm: 2000,
    launchDvMs: 250, landDvMs: 250, landDvWithShieldMs: 250, radiationPerDay: 0, surfaceHeat: false, color: '#b7a58f',
  },
  ceres: {
    id: 'ceres', name: 'Ceres', parent: 'sun', orbitRadiusKm: 2.767 * AU_KM, phaseAtEpochDeg: 100,
    radiusKm: 470, muKm3s2: 62.6, surfaceGravity: 0.28, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 100, minOrbitAltKm: 30, maxOrbitAltKm: 5000,
    launchDvMs: 400, landDvMs: 400, landDvWithShieldMs: 400, radiationPerDay: 0, surfaceHeat: false, color: '#9e9e9e',
  },
  jupiter: {
    id: 'jupiter', name: 'Jupiter', parent: 'sun', orbitRadiusKm: 5.203 * AU_KM, phaseAtEpochDeg: 250,
    radiusKm: 69_911, muKm3s2: 1.26687e8, surfaceGravity: 24.8, atmosphere: 'gas', landable: false,
    lowOrbitAltKm: 300_000, minOrbitAltKm: 5000, maxOrbitAltKm: 3_000_000,
    launchDvMs: 0, landDvMs: 0, landDvWithShieldMs: 0, radiationPerDay: 20, surfaceHeat: false, color: '#d9b38c',
  },
  io: {
    id: 'io', name: 'Io', parent: 'jupiter', orbitRadiusKm: 421_700, phaseAtEpochDeg: 0,
    radiusKm: 1822, muKm3s2: 5959.9, surfaceGravity: 1.8, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 100, minOrbitAltKm: 50, maxOrbitAltKm: 5000,
    launchDvMs: 1850, landDvMs: 1850, landDvWithShieldMs: 1850, radiationPerDay: 36, surfaceHeat: false, color: '#e6d65a',
  },
  europa: {
    id: 'europa', name: 'Europa', parent: 'jupiter', orbitRadiusKm: 671_034, phaseAtEpochDeg: 120,
    radiusKm: 1561, muKm3s2: 3202.7, surfaceGravity: 1.31, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 100, minOrbitAltKm: 50, maxOrbitAltKm: 5000,
    launchDvMs: 1450, landDvMs: 1450, landDvWithShieldMs: 1450, radiationPerDay: 5.4, surfaceHeat: false, color: '#d8cfc0',
  },
  ganymede: {
    id: 'ganymede', name: 'Ganymede', parent: 'jupiter', orbitRadiusKm: 1_070_412, phaseAtEpochDeg: 230,
    radiusKm: 2634, muKm3s2: 9887.8, surfaceGravity: 1.43, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 100, minOrbitAltKm: 50, maxOrbitAltKm: 10_000,
    launchDvMs: 1970, landDvMs: 1970, landDvWithShieldMs: 1970, radiationPerDay: 0.08, surfaceHeat: false, color: '#a89a8a',
  },
  callisto: {
    id: 'callisto', name: 'Callisto', parent: 'jupiter', orbitRadiusKm: 1_882_709, phaseAtEpochDeg: 330,
    radiusKm: 2410, muKm3s2: 7179.3, surfaceGravity: 1.24, atmosphere: 'none', landable: true,
    lowOrbitAltKm: 100, minOrbitAltKm: 50, maxOrbitAltKm: 20_000,
    launchDvMs: 1800, landDvMs: 1800, landDvWithShieldMs: 1800, radiationPerDay: 0.01, surfaceHeat: false, color: '#6f665c',
  },
};

export const BODY_LIST: Body[] = Object.values(BODIES);

export function bodyById(id: BodyId): Body {
  return BODIES[id];
}

export function childrenOf(id: BodyId): Body[] {
  return BODY_LIST.filter((b) => b.parent === id);
}

/** Bodies that get their own nested map view (have moons). */
export const SYSTEM_VIEW_BODIES: BodyId[] = ['earth', 'mars', 'jupiter'];
