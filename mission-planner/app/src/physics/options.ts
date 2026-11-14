import type { BodyId, Branch, FlightState, GameState, Maneuver, ManeuverOption, Spacecraft } from '../model/types';
import { BODIES } from '../data/bodies';
import { CAN_LAND } from '../data/parts';
import { childrenIdsOf, siblingsOf, transferRelation } from './ephemeris';
import { bestFlybyTravel, hohmannTravelDays, transferGrid, transferRanges, type TransferGrid } from './transfers';

// Maneuver menu and default maneuvers.

/** Spacecraft still on a branch after all its separations. */
export function branchSpacecraftAtEnd(game: GameState, branch: Branch): string[] {
  const exists = new Set(game.rocket.spacecraft.map((s) => s.id));
  const gone = new Set(branch.maneuvers.flatMap((m) => (m.type === 'separate' ? m.spacecraftIds : [])));
  return branch.spacecraftIds.filter((id) => exists.has(id) && !gone.has(id));
}

export function transferTargets(body: BodyId): BodyId[] {
  const out = [...siblingsOf(body), ...childrenIdsOf(body)];
  const parent = BODIES[body].parent;
  if (parent && parent !== 'sun') out.push(parent);
  return out;
}

const hasAtmosphere = (id: BodyId) => BODIES[id].atmosphere === 'thin' || BODIES[id].atmosphere === 'thick';

export function availableManeuvers(game: GameState, branch: Branch, state: FlightState): ManeuverOption[] {
  const isRoot = game.plan.branches[0]?.id === branch.id;
  if (isRoot && branch.maneuvers.length === 0) {
    const body: BodyId = state.kind !== 'lost' ? state.body : 'earth';
    return [{ type: 'launch', label: `Launch from ${BODIES[body].name}`, enabled: true }];
  }
  if (state.kind === 'lost') return [];
  const body = BODIES[state.body];
  const scIds = branchSpacecraftAtEnd(game, branch);
  const scs = scIds
    .map((id) => game.rocket.spacecraft.find((s) => s.id === id))
    .filter((s): s is Spacecraft => !!s);
  const opts: ManeuverOption[] = [];
  switch (state.kind) {
    case 'orbit': {
      opts.push({ type: 'changeOrbit', label: 'Change orbit', enabled: true });
      for (const t of transferTargets(body.id)) {
        opts.push({ type: 'transfer', target: t, label: `Transfer to ${BODIES[t].name}`, enabled: true });
      }
      if (body.landable) {
        const canLand = scs.some((sc) => CAN_LAND.includes(sc.payloadType));
        opts.push({
          type: 'land', label: `Land on ${body.name}`, enabled: canLand,
          ...(canLand ? {} : { reason: 'No lander on this branch' }),
        });
      }
      if (scIds.length >= 2) opts.push({ type: 'separate', label: 'Separate', enabled: true });
      break;
    }
    case 'approach': {
      opts.push({ type: 'insertion', label: `Orbit insertion at ${body.name}`, enabled: true });
      for (const t of siblingsOf(body.id)) {
        opts.push({ type: 'flyby', target: t, label: `Flyby of ${body.name} toward ${BODIES[t].name}`, enabled: true });
      }
      if (hasAtmosphere(body.id) && body.landable) {
        opts.push({ type: 'entry', label: body.id === 'earth' ? 'Earth entry' : `Atmospheric entry at ${body.name}`, enabled: true });
      }
      break;
    }
    case 'surface': {
      const can = body.launchDvMs > 0;
      opts.push({
        type: 'ascent', label: `Ascent from ${body.name}`, enabled: can,
        ...(can ? {} : { reason: `No ascent possible from ${body.name}` }),
      });
      break;
    }
  }
  return opts;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Earliest window whose cost is within 5 % of the grid's best (so defaults don't skip a near-equal window). */
function earliestGoodWindow(g: TransferGrid): TransferGrid['best'] {
  if (!Number.isFinite(g.best.dvMs)) return g.best;
  const cols = g.departDays.map((departDay, ix) => {
    let dvMs = Infinity;
    let travelDays = g.travelDays[0];
    for (let iy = 0; iy < g.travelDays.length; iy++) {
      if (g.dvMs[iy][ix] < dvMs) {
        dvMs = g.dvMs[iy][ix];
        travelDays = g.travelDays[iy];
      }
    }
    return { departDay, travelDays, dvMs };
  });
  for (let ix = 0; ix < cols.length; ix++) {
    const c = cols[ix];
    if (c.dvMs <= g.best.dvMs * 1.05 && (ix === cols.length - 1 || c.dvMs <= cols[ix + 1].dvMs)) return c;
  }
  return g.best;
}

export function createManeuver(
  game: GameState, branch: Branch, state: FlightState, option: ManeuverOption, newId: (prefix: string) => string,
): Maneuver {
  const id = newId('mnv');
  const bodyId: BodyId = state.kind !== 'lost' ? state.body : 'earth';
  const body = BODIES[bodyId];
  switch (option.type) {
    case 'launch':
      return { id, type: 'launch', body: bodyId, altitudeKm: body.lowOrbitAltKm };
    case 'ascent':
      return { id, type: 'ascent', altitudeKm: body.lowOrbitAltKm };
    case 'changeOrbit': {
      const cur = state.kind === 'orbit' ? state.altitudeKm : body.lowOrbitAltKm;
      return { id, type: 'changeOrbit', altitudeKm: Math.round(clamp(cur * 2, body.minOrbitAltKm, body.maxOrbitAltKm)) };
    }
    case 'transfer': {
      const target = option.target ?? transferTargets(bodyId)[0] ?? 'mars';
      const from = state.kind === 'orbit'
        ? state
        : { kind: 'orbit' as const, body: bodyId, altitudeKm: body.lowOrbitAltKm, day: state.day };
      const rel = transferRelation(from.body, target);
      const earliest = Math.ceil(from.day);
      if (rel === 'sibling') {
        const r = transferRanges(from.body, target, from.day);
        const nx = 60;
        const ny = 40;
        const g = transferGrid(from, target, r.depart, r.travel, nx, ny);
        let bestPt = earliestGoodWindow(g);
        if (Number.isFinite(bestPt.dvMs)) {
          const dx = (r.depart[1] - r.depart[0]) / (nx - 1);
          const dy = (r.travel[1] - r.travel[0]) / (ny - 1);
          const fine = transferGrid(
            from, target,
            [Math.max(from.day, bestPt.departDay - dx), bestPt.departDay + dx],
            [Math.max(1, bestPt.travelDays - dy), bestPt.travelDays + dy], 15, 15,
          );
          if (fine.best.dvMs < bestPt.dvMs) bestPt = fine.best;
          return {
            id, type: 'transfer', target,
            departDay: Math.max(earliest, Math.round(bestPt.departDay)),
            travelDays: Math.max(1, Math.round(bestPt.travelDays)),
          };
        }
        return { id, type: 'transfer', target, departDay: earliest, travelDays: Math.round(hohmannTravelDays(from.body, target)) };
      }
      const tof = hohmannTravelDays(from.body, target, from.altitudeKm);
      return { id, type: 'transfer', target, departDay: earliest, travelDays: Math.round(tof * 100) / 100 };
    }
    case 'flyby': {
      const target = option.target ?? siblingsOf(bodyId)[0] ?? 'earth';
      const periapsisAltKm = Math.max(300, body.minOrbitAltKm);
      const range = transferRanges(bodyId, target, state.day).travel;
      const travel = state.kind === 'approach'
        ? bestFlybyTravel(bodyId, state.vInf, state.day, target, periapsisAltKm, range)
        : (range[0] + range[1]) / 2;
      return { id, type: 'flyby', target, periapsisAltKm, travelDays: Math.max(1, Math.round(travel)) };
    }
    case 'insertion':
      return { id, type: 'insertion', altitudeKm: body.lowOrbitAltKm, aerocapture: false };
    case 'land':
      return { id, type: 'land' };
    case 'entry':
      return { id, type: 'entry' };
    case 'separate': {
      const ids = branchSpacecraftAtEnd(game, branch);
      return { id, type: 'separate', spacecraftIds: ids.length ? [ids[ids.length - 1]] : [], newBranchId: newId('branch') };
    }
  }
}
