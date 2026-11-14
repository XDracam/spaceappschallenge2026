import type { BodyId, Branch, FlightState, PlannerGame, Maneuver, ManeuverOption, Spacecraft } from '../model/types';
import { BODIES } from '../data/bodies';
import { CAN_LAND } from '../data/parts';
import { childrenIdsOf, siblingsOf, transferRelation } from './ephemeris';
import { bestFlybyTravel, hohmannTravelDays, transferGrid, transferRanges, type TransferGrid } from './transfers';
import { altitudeGoalsAt, altitudeOk, goalOrbitChangeLabel } from './goals';

// Maneuver menu and default maneuvers.

/** Spacecraft still on a branch after all its separations. */
export function branchSpacecraftAtEnd(game: PlannerGame, branch: Branch): string[] {
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

/** True if `id` is `ancestor` or orbits it (directly or via a parent). */
function isWithin(id: BodyId, ancestor: BodyId): boolean {
  for (let b: BodyId | null = id; b; b = BODIES[b].parent) if (b === ancestor) return true;
  return false;
}

/** Does a transfer from `from` to `t` bring the spacecraft closer to one of the goal bodies? */
function leadsToward(from: BodyId, t: BodyId, goalBodies: Set<BodyId>): boolean {
  const parent = BODIES[from].parent;
  for (const g of goalBodies) {
    if (g === from) continue;
    if (g === t) return true;
    if (t === parent) {
      if (!isWithin(g, from)) return true;   // leaving a moon toward somewhere else
    } else if (isWithin(g, t)) return true;  // the goal is a moon of the target
  }
  return false;
}

/**
 * Next-step menu for the end of a branch. Options that lead toward a mission goal body, or are the
 * goal action at the current body, come first; everything else is `secondary` (shown under "More…").
 */
export function availableManeuvers(game: PlannerGame, branch: Branch, state: FlightState): ManeuverOption[] {
  const isRoot = game.plan.branches[0]?.id === branch.id;
  if (isRoot && branch.maneuvers.length === 0) {
    const body: BodyId = state.kind !== 'lost' ? state.body : 'earth';
    return [{ type: 'launch', label: `Launch from ${BODIES[body].name}`, enabled: true }];
  }
  if (state.kind === 'lost') return [];
  const body = BODIES[state.body];
  const goalBodies = new Set(game.mission.goals.map((g) => g.body));
  const landBodies = new Set(game.mission.goals.filter((g) => g.kind === 'land' || g.kind === 'surfaceData').map((g) => g.body));
  const atGoal = goalBodies.has(body.id);
  const scIds = branchSpacecraftAtEnd(game, branch);
  const scs = scIds
    .map((id) => game.rocket.spacecraft.find((s) => s.id === id))
    .filter((s): s is Spacecraft => !!s);
  const opts: ManeuverOption[] = [];
  /** Disabled options never count as primary. */
  const push = (o: ManeuverOption, primary: boolean) => {
    opts.push(primary && o.enabled ? o : { ...o, secondary: true });
  };
  switch (state.kind) {
    case 'orbit': {
      // A goal here needs a specific orbit (e.g. geostationary): offer it in one click.
      const altGoals = altitudeGoalsAt(game.mission, body.id);
      const missed = altGoals.find((g) => !altitudeOk(g, state.altitudeKm));
      if (missed) {
        push({
          type: 'changeOrbit', altitudeKm: missed.altitudeKm, enabled: true,
          label: goalOrbitChangeLabel(missed, state.altitudeKm),
        }, true);
      }
      // Release: one option per spacecraft; the first one always stays on this branch.
      for (const sc of scs.slice(1)) {
        push({ type: 'separate', spacecraftId: sc.id, label: `Release ${sc.name}`, enabled: true }, atGoal);
      }
      if (body.landable) {
        const canLand = scs.some((sc) => CAN_LAND.includes(sc.payloadType));
        push({
          type: 'land', label: `Land on ${body.name}`, enabled: canLand,
          ...(canLand ? {} : { reason: 'No lander on this branch' }),
        }, landBodies.has(body.id));
      }
      for (const t of transferTargets(body.id)) {
        push({ type: 'transfer', target: t, label: `Transfer to ${BODIES[t].name}`, enabled: true }, leadsToward(body.id, t, goalBodies));
      }
      push({ type: 'changeOrbit', label: 'Change orbit height', enabled: true }, altGoals.length > 0);
      break;
    }
    case 'approach': {
      push({ type: 'insertion', label: `Enter orbit at ${body.name}`, enabled: true }, atGoal);
      if (hasAtmosphere(body.id) && body.landable) {
        push({
          type: 'entry', enabled: true,
          label: body.id === 'earth' ? 'Splash down on Earth' : `Land directly on ${body.name} (no orbit)`,
        }, landBodies.has(body.id));
      }
      for (const t of siblingsOf(body.id)) {
        push({ type: 'flyby', target: t, label: `Swing past ${body.name} toward ${BODIES[t].name}`, enabled: true }, false);
      }
      break;
    }
    case 'surface': {
      const can = body.launchDvMs > 0;
      const elsewhere = [...goalBodies].some((g) => g !== body.id);
      push({
        type: 'ascent', label: `Lift off from ${body.name}`, enabled: can,
        ...(can ? {} : { reason: `No ascent possible from ${body.name}` }),
      }, elsewhere);
      break;
    }
  }
  // Primary first; original order kept within each group.
  return [...opts.filter((o) => !o.secondary), ...opts.filter((o) => o.secondary)];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Earliest window whose cost is within 5 % of the grid's best (so defaults don't skip a near-equal window).
 * Only cells arriving by `maxArrivalDay` count, unless none does.
 */
function earliestGoodWindow(g: TransferGrid, maxArrivalDay = Infinity): TransferGrid['best'] {
  const scan = (limit: number): TransferGrid['best'] => {
    let best: TransferGrid['best'] = { departDay: g.departDays[0], travelDays: g.travelDays[0], dvMs: Infinity };
    const cols = g.departDays.map((departDay, ix) => {
      let dvMs = Infinity;
      let travelDays = g.travelDays[0];
      for (let iy = 0; iy < g.travelDays.length; iy++) {
        if (departDay + g.travelDays[iy] > limit) continue;
        if (g.dvMs[iy][ix] < dvMs) {
          dvMs = g.dvMs[iy][ix];
          travelDays = g.travelDays[iy];
        }
      }
      if (dvMs < best.dvMs) best = { departDay, travelDays, dvMs };
      return { departDay, travelDays, dvMs };
    });
    if (!Number.isFinite(best.dvMs)) return best;
    for (let ix = 0; ix < cols.length; ix++) {
      const c = cols[ix];
      if (c.dvMs <= best.dvMs * 1.05 && (ix === cols.length - 1 || c.dvMs <= cols[ix + 1].dvMs)) return c;
    }
    return best;
  };
  const within = scan(maxArrivalDay);
  return Number.isFinite(within.dvMs) ? within : scan(Infinity);
}

export function createManeuver(
  game: PlannerGame, branch: Branch, state: FlightState, option: ManeuverOption, newId: (prefix: string) => string,
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
      if (option.altitudeKm !== undefined) {
        return { id, type: 'changeOrbit', altitudeKm: Math.round(clamp(option.altitudeKm, body.minOrbitAltKm, body.maxOrbitAltKm)) };
      }
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
        const deadline = game.mission.completionDeadlineDay;
        const r = transferRanges(from.body, target, from.day);
        const nx = 60;
        const ny = 40;
        const g = transferGrid(from, target, r.depart, r.travel, nx, ny);
        let bestPt = earliestGoodWindow(g, deadline);
        if (Number.isFinite(bestPt.dvMs)) {
          const dx = (r.depart[1] - r.depart[0]) / (nx - 1);
          const dy = (r.travel[1] - r.travel[0]) / (ny - 1);
          const fine = transferGrid(
            from, target,
            [Math.max(from.day, bestPt.departDay - dx), bestPt.departDay + dx],
            [Math.max(1, bestPt.travelDays - dy), bestPt.travelDays + dy], 15, 15,
          );
          const arrivalLimit = Math.max(deadline, bestPt.departDay + bestPt.travelDays);
          if (fine.best.dvMs < bestPt.dvMs && fine.best.departDay + fine.best.travelDays <= arrivalLimit) bestPt = fine.best;
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
      const pick = option.spacecraftId && ids.includes(option.spacecraftId) ? option.spacecraftId : ids[ids.length - 1];
      return { id, type: 'separate', spacecraftIds: pick ? [pick] : [], newBranchId: newId('branch') };
    }
  }
}
