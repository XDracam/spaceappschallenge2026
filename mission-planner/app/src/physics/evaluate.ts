import type {
  Body, BodyId, Branch, BranchResult, Evaluation, FlightState, GameState, GoalResult, Issue, IssueCode,
  ManeuverResult, Part, PartKind, Severity, Spacecraft, StageBand, TrajectorySegment,
} from '../model/types';
import { BODIES } from '../data/bodies';
import {
  CAN_LAND, INSTRUMENTS, antennaRateKbps, beyondResearch, estimatedCostM, instrumentDataKbps, instrumentPowerKW,
  partReliability, powerOutputKW, radiationTolerance, stagePowerNeedKW, statDefs, venusSurfaceHours,
} from '../data/parts';
import { allParts } from '../model/rocketUtils';
import { DAY_S, G0, formatDay, formatMass, formatMoney } from '../model/units';
import { earthDistanceKm, sunDistanceKm, transferRelation } from './ephemeris';
import { escapeDvKms, hohmann, ionTrajectory, ionTransferDvMs, solveFlyby, solveTransfer } from './transfers';
import {
  activeStage, applyBoilOff, buildStack, burn, remainingDvMs, splitStack, stackMassT, stagePotentials,
  type BurnResult, type StackRt,
} from './stack';
import { maneuverLabel } from './labels';
import { norm } from './vec';

// The live simulation test: flies the current rocket through the current plan.

// ------------------------------------------------------------ internals

/** One reliability roll: a part used for the first time on a branch. */
export interface Factor {
  partId: string;
  name: string;
  p: number;
  branchId: string;
  maneuverId: string;
  day: number;
}

export interface Step {
  result: ManeuverResult;
  scIds: string[];            // spacecraft on the branch after the maneuver
  factorCount: number;        // reliability factors used up to and including this maneuver
  newFactors: Factor[];       // first used at this maneuver
  blocked: boolean;           // a blocking error at or before this maneuver (incl. parent branches)
  visitedBefore: Set<BodyId>; // bodies reached before this maneuver (incl. parent branches)
  doseBefore: number;         // radiation dose accumulated before this maneuver's end state
}

export interface BranchInternal {
  branchId: string;
  parentBranchId?: string;
  parentManeuverId?: string;
  steps: Step[];
  factors: Factor[];
}

export interface GoalPick {
  goalId: string;
  branchId: string;
  maneuverId: string;
  day: number;
  extra: Factor[];            // goal-only parts (instrument, power, antenna)
}

export interface EvalInternal {
  branches: Map<string, BranchInternal>;
  picks: Map<string, GoalPick>;
  rootId: string;
}

const internals = new WeakMap<Evaluation, EvalInternal>();

export function internalOf(evaluation: Evaluation): EvalInternal | undefined {
  return internals.get(evaluation);
}

// -------------------------------------------------------------- helpers

const ATMO = (b: Body) => b.atmosphere === 'thin' || b.atmosphere === 'thick';

function equipmentOf(scs: Spacecraft[], kind: PartKind): Part[] {
  return scs.flatMap((sc) => sc.equipment.filter((p) => p.kind === kind));
}

function best(parts: Part[], stat: string): Part | undefined {
  let out: Part | undefined;
  for (const p of parts) if (!out || p.stats[stat] > out.stats[stat]) out = p;
  return out;
}

function level(sc: Spacecraft, kind: PartKind): number {
  return sc.equipment.filter((p) => p.kind === kind).reduce((m, p) => Math.max(m, p.stats.level ?? 0), 0);
}

function powerKW(scs: Spacecraft[], sunDistKm: number): number {
  return equipmentOf(scs, 'power').reduce((s, p) => s + powerOutputKW(p, sunDistKm), 0);
}

const product = (fs: { p: number }[]) => fs.reduce((s, f) => s * f.p, 1);

function hazardProblems(body: Body, kind: 'orbit' | 'surface', scs: Spacecraft[], dose: number, checkRadiation: boolean): { code: IssueCode; msg: string }[] {
  const out: { code: IssueCode; msg: string }[] = [];
  for (const sc of scs) {
    if (checkRadiation && body.radiationPerDay > 0) {
      const tol = radiationTolerance(level(sc, 'radShield'));
      if (dose > tol) out.push({ code: 'hazard', msg: `Radiation at ${body.name} exceeds shielding on ${sc.name} (dose ${Math.round(dose)}, tolerates ${Math.round(tol)})` });
    }
    if (kind === 'surface' && body.surfaceHeat) {
      const h = venusSurfaceHours(level(sc, 'heatProtection'));
      if (h < 2) out.push({ code: 'hazard', msg: `${sc.name} survives only ${h} h on the ${body.name} surface (needs 2 h of heat protection)` });
    }
  }
  return out;
}

function dataProblems(sc: Spacecraft, body: BodyId, day: number): { code: IssueCode; msg: string }[] {
  const out: { code: IssueCode; msg: string }[] = [];
  const name = BODIES[body].name;
  const instruments = sc.equipment.filter((p) => p.kind === 'instrument');
  const needKW = instruments.reduce((s, p) => s + instrumentPowerKW(p), 0);
  const haveKW = powerKW([sc], sunDistanceKm(body, day));
  if (haveKW + 1e-9 < needKW) {
    out.push({ code: 'power', msg: `${sc.name}: instruments need ${needKW.toFixed(2)} kW, power at ${name} gives ${haveKW.toFixed(2)} kW` });
  }
  const needKbps = instruments.reduce((s, p) => s + instrumentDataKbps(p), 0);
  const dist = earthDistanceKm(body, day);
  const haveKbps = sc.equipment.filter((p) => p.kind === 'antenna').reduce((s, p) => s + antennaRateKbps(p, dist), 0);
  if (haveKbps + 1e-9 < needKbps) {
    out.push({ code: 'data', msg: `${sc.name}: instruments produce ${Math.round(needKbps)} kbps, antenna sends ${Math.round(haveKbps)} kbps from ${name}` });
  }
  return out;
}

// --------------------------------------------------------- branch flight

interface Ctx {
  game: GameState;
  branchById: Map<string, Branch>;
  results: Map<string, BranchResult>;
  internals: Map<string, BranchInternal>;
}

interface Start {
  state: FlightState;
  stack: StackRt;
  factors: Factor[];
  failed: boolean;      // out of delta-v upstream: fly "on paper" only
  blocked: boolean;     // blocking error upstream
  visited: Set<BodyId>;
  dose: number;
  parent?: { branchId: string; maneuverId: string };
}

function runBranch(ctx: Ctx, branch: Branch, start: Start): void {
  if (ctx.internals.has(branch.id)) return;
  const { game } = ctx;
  const isRoot = game.plan.branches[0]?.id === branch.id;
  const stack = start.stack;
  const bandStages = [...stack.stages];
  const factors = [...start.factors];
  const factorIds = new Set(factors.map((f) => f.partId));
  const visited = new Set(start.visited);
  let state = start.state;
  let failed = start.failed;
  let blocked = start.blocked;
  let dose = start.dose;
  let failedAt: string | undefined;
  const results: ManeuverResult[] = [];
  const steps: Step[] = [];
  const children: { branch: Branch; start: Start }[] = [];
  const internal: BranchInternal = {
    branchId: branch.id, parentBranchId: start.parent?.branchId, parentManeuverId: start.parent?.maneuverId, steps, factors,
  };
  ctx.internals.set(branch.id, internal);

  branch.maneuvers.forEach((m, index) => {
    const before = state;
    const issues: Issue[] = [];
    const add = (severity: Severity, code: IssueCode, message: string) =>
      issues.push({ severity, code, message, branchId: branch.id, maneuverId: m.id });
    let label = maneuverLabel(game, m, before);
    let startDay = before.day;
    if (m.type === 'launch' && isRoot && index === 0) startDay = game.plan.launchDay;
    else if (m.type === 'transfer') startDay = m.departDay;
    let endDay = startDay;
    let dv = 0;
    let after: FlightState = before;
    let trajectory: TrajectorySegment | undefined;
    let gravity: number | null = null;
    let twrMode: 'launch' | 'all' | null = null;
    let ion = false;
    let shieldUse = false;
    let legsUse = false;
    let twr: number | undefined;
    let childStack: StackRt | undefined;
    const newFactors: Factor[] = [];
    const addFactor = (part: Part, p: number, name: string) => {
      if (factorIds.has(part.id)) return;
      factorIds.add(part.id);
      const f: Factor = { partId: part.id, name, p, branchId: branch.id, maneuverId: m.id, day: startDay };
      factors.push(f);
      newFactors.push(f);
    };
    const lost = (reason: string) => {
      add('error', 'invalid', reason);
      after = { kind: 'lost', day: startDay, reason };
    };
    const checkAlt = (b: Body, alt: number) => {
      if (alt < b.minOrbitAltKm - 1e-9 || alt > b.maxOrbitAltKm + 1e-9) {
        add('error', 'invalid', `Altitude ${Math.round(alt)} km is outside ${b.name}'s range (${b.minOrbitAltKm}–${b.maxOrbitAltKm} km)`);
      }
    };

    if (before.kind === 'lost') {
      const res: ManeuverResult = {
        maneuverId: m.id, branchId: branch.id, type: m.type, label, dvRequiredMs: 0, dvAvailableBeforeMs: 0, ok: false,
        startDay: before.day, endDay: before.day, stateBefore: before, stateAfter: before, burns: [], issues: [],
      };
      if (!failedAt) failedAt = m.id;
      results.push(res);
      steps.push({ result: res, scIds: stack.spacecraft.map((s) => s.id), factorCount: factors.length, newFactors, blocked: true, visitedBefore: new Set(visited), doseBefore: dose });
      return;
    }

    const body = BODIES[before.body];
    if ((before.kind === 'orbit' || before.kind === 'surface') && startDay > before.day) {
      dose += body.radiationPerDay * (startDay - before.day);
    }
    if (!failed) applyBoilOff(stack, startDay);
    const dvBefore = failed ? 0 : remainingDvMs(stack);
    const massStart = stackMassT(stack);

    switch (m.type) {
      case 'launch': {
        if (!(isRoot && index === 0)) add('error', 'invalid', 'Launch must be the first maneuver of the main branch');
        if (before.kind !== 'surface') { lost('Launch needs to start from a surface'); break; }
        checkAlt(body, m.altitudeKm);
        const R = body.radiusKm;
        dv = body.launchDvMs + (m.altitudeKm > body.lowOrbitAltKm ? hohmann(body.muKm3s2, R + body.lowOrbitAltKm, R + m.altitudeKm).dvMs : 0);
        gravity = body.surfaceGravity;
        twrMode = 'launch';
        after = { kind: 'orbit', body: body.id, altitudeKm: m.altitudeKm, day: endDay };
        break;
      }
      case 'ascent': {
        if (before.kind !== 'surface') { lost('Ascent needs to start from a surface'); break; }
        checkAlt(body, m.altitudeKm);
        const R = body.radiusKm;
        const h = m.altitudeKm > body.lowOrbitAltKm ? hohmann(body.muKm3s2, R + body.lowOrbitAltKm, R + m.altitudeKm) : { dvMs: 0, tofDays: 0 };
        dv = body.launchDvMs + h.dvMs;
        endDay = startDay + h.tofDays;
        gravity = body.surfaceGravity;
        twrMode = 'all';
        after = { kind: 'orbit', body: body.id, altitudeKm: m.altitudeKm, day: endDay };
        break;
      }
      case 'changeOrbit': {
        if (before.kind !== 'orbit') { lost('Orbit change needs a circular orbit'); break; }
        checkAlt(body, m.altitudeKm);
        const R = body.radiusKm;
        const h = hohmann(body.muKm3s2, R + before.altitudeKm, R + m.altitudeKm);
        dv = h.dvMs;
        endDay = startDay + h.tofDays;
        after = { kind: 'orbit', body: body.id, altitudeKm: m.altitudeKm, day: endDay };
        break;
      }
      case 'transfer': {
        if (before.kind !== 'orbit') { lost('A transfer needs to start from an orbit'); break; }
        const rel = transferRelation(before.body, m.target);
        if (!rel) { lost(`No transfer from ${body.name} to ${BODIES[m.target].name}`); break; }
        if (m.departDay < before.day - 1e-6) add('error', 'invalid', 'Departure before arrival in orbit');
        const act = failed ? undefined : activeStage(stack);
        if (act && act.stage.propulsion === 'ion') {
          ion = true;
          label = maneuverLabel(game, m, before, true);
          dv = ionTransferDvMs(before.body, before.altitudeKm, m.target) ?? 0;
          endDay = startDay + m.travelDays;
          trajectory = ionTrajectory(before.body, before.altitudeKm, m.target, startDay, m.travelDays);
          after = { kind: 'orbit', body: m.target, altitudeKm: BODIES[m.target].lowOrbitAltKm, day: endDay };
        } else {
          const tr = solveTransfer(before.body, before.altitudeKm, m.target, startDay, m.travelDays);
          if (!tr) { lost('No transfer trajectory for these dates'); break; }
          dv = tr.dvDepartMs;
          endDay = tr.arrivalDay;
          trajectory = tr.trajectory;
          after = { kind: 'approach', body: m.target, day: endDay, vInf: tr.vInfArr, from: before.body };
        }
        break;
      }
      case 'flyby': {
        if (before.kind !== 'approach') { lost('A flyby needs an arriving trajectory'); break; }
        if (transferRelation(before.body, m.target) !== 'sibling') { lost(`Cannot fly by ${body.name} toward ${BODIES[m.target].name}`); break; }
        if (m.periapsisAltKm < body.minOrbitAltKm) add('error', 'invalid', `Flyby passes below ${body.name}'s minimum altitude (${body.minOrbitAltKm} km)`);
        const fb = solveFlyby(before.body, before.vInf, before.day, m.target, m.periapsisAltKm, m.travelDays);
        if (!fb) { lost('No flyby trajectory for this travel time'); break; }
        dv = fb.dvMs;
        endDay = fb.arrivalDay;
        trajectory = fb.trajectory;
        after = { kind: 'approach', body: m.target, day: endDay, vInf: fb.vInfArr, from: before.body };
        break;
      }
      case 'insertion': {
        if (before.kind !== 'approach') { lost('Orbit insertion needs an arriving trajectory'); break; }
        checkAlt(body, m.altitudeKm);
        if (m.aerocapture) {
          if (!ATMO(body)) add('error', 'invalid', `${body.name} has no atmosphere suitable for aerocapture`);
          shieldUse = true;
          dv = 50;
        } else {
          dv = escapeDvKms(body.muKm3s2, body.radiusKm + m.altitudeKm, norm(before.vInf)) * 1000;
        }
        after = { kind: 'orbit', body: body.id, altitudeKm: m.altitudeKm, day: endDay };
        break;
      }
      case 'entry': {
        if (before.kind !== 'approach') { lost('Atmospheric entry needs an arriving trajectory'); break; }
        if (!ATMO(body) || !body.landable) add('error', 'invalid', `No atmospheric entry possible at ${body.name}`);
        shieldUse = true;
        legsUse = body.id !== 'earth';
        dv = body.landDvWithShieldMs * 0.5;
        after = { kind: 'surface', body: body.id, day: endDay };
        break;
      }
      case 'land': {
        if (before.kind !== 'orbit') { lost('Landing needs to start from an orbit'); break; }
        if (!body.landable) { lost(`${body.name} cannot be landed on`); break; }
        if (!stack.spacecraft.some((sc) => CAN_LAND.includes(sc.payloadType))) {
          add('error', 'equipment', 'No spacecraft on this branch can land (needs a lander-type payload)');
        }
        const sh = best(equipmentOf(stack.spacecraft, 'heatShield'), 'maxEntryMassT');
        if (ATMO(body) && sh && sh.stats.maxEntryMassT >= massStart) {
          shieldUse = true;
          dv = body.landDvWithShieldMs;
        } else {
          dv = body.landDvMs;
          if (ATMO(body) && body.landDvWithShieldMs < body.landDvMs) {
            add('warning', 'equipment', sh
              ? `Heat shield rated for ${formatMass(sh.stats.maxEntryMassT)} is too small for ${formatMass(massStart)}: landing is fully propulsive`
              : `No heat shield: landing on ${body.name} is fully propulsive`);
          }
        }
        legsUse = body.id !== 'earth';
        gravity = body.surfaceGravity;
        twrMode = 'all';
        after = { kind: 'surface', body: body.id, day: endDay };
        break;
      }
      case 'separate': {
        const onBranch = new Set(stack.spacecraft.map((s) => s.id));
        const ids = m.spacecraftIds.filter((id) => onBranch.has(id));
        if (ids.length !== m.spacecraftIds.length) add('error', 'invalid', 'Some separated spacecraft are not on this branch');
        if (!ids.length) add('error', 'invalid', 'Nothing to separate');
        else childStack = splitStack(stack, ids);
        after = { ...before, day: startDay };
        break;
      }
    }

    const alive = after.kind !== 'lost';

    // Heat shield: must carry the whole stack at entry.
    if (shieldUse && alive) {
      const sh = best(equipmentOf(stack.spacecraft, 'heatShield'), 'maxEntryMassT');
      if (!sh) add('error', 'equipment', 'Needs a heat shield on this spacecraft (Rocket → + Landing)');
      else if (sh.stats.maxEntryMassT < massStart) {
        add('error', 'equipment', `Heat shield is too small: rated for ${formatMass(sh.stats.maxEntryMassT)}, but the spacecraft weighs ${formatMass(massStart)}. Use a bigger heat shield (Rocket tab).`);
      } else addFactor(sh, partReliability(sh), sh.name);
    }

    // Burn.
    let burnRes: BurnResult | undefined;
    if (!failed && alive && dv > 0) {
      burnRes = burn(stack, dv, gravity ?? G0);
      if (burnRes.short) {
        const km = (v: number) => `${(v / 1000).toFixed(2)} km/s`;
        const aero = m.type === 'insertion' && !m.aerocapture && ATMO(body);
        add('error', 'dv', `Out of fuel: needs ${km(dv)}, has ${km(dvBefore)}. Add fuel to an upper stage${aero ? ', or use aerobraking' : ''}.`);
      }
      for (const f of burnRes.fired) {
        const st = f.st.stage;
        addFactor(st.engine, Math.pow(partReliability(st.engine), st.engineCount), `${st.name} engine${st.engineCount > 1 ? 's' : ''}`);
        for (const t of st.tanks) addFactor(t, partReliability(t), `${st.name} tank`);
      }
      if (twrMode === 'launch') {
        twr = burnRes.fired[0]?.twr ?? 0;
        if (twr <= 1) add('error', 'twr', `Too weak to lift off (lift ratio ${twr.toFixed(2)}, needs above 1). Add engines to the first stage.`);
        else if (twr < 1.2) add('warning', 'twr', `Barely strong enough to lift off (lift ratio ${twr.toFixed(2)}, below 1.2). Consider more engines.`);
      } else if (twrMode === 'all') {
        twr = burnRes.fired.length ? Math.min(...burnRes.fired.map((f) => f.twr)) : 0;
        if (twr <= 1) add('error', 'twr', `Engines too weak for ${label} (lift ratio ${twr.toFixed(2)}, needs above 1 in ${body.name}'s gravity). Add engines.`);
      }
      if (ion) {
        const ionFired = burnRes.fired.filter((f) => f.st.stage.propulsion === 'ion');
        const need = ionFired.reduce((s, f) => Math.max(s, stagePowerNeedKW(f.st.stage)), 0);
        const have = powerKW(stack.spacecraft, sunDistanceKm(body.id, startDay));
        if (need > have + 1e-9) add('error', 'power', `Ion engine needs ${need.toFixed(2)} kW, power supply gives ${have.toFixed(2)} kW`);
        const burnDays = ionFired.reduce((s, f) => s + (f.fuelUsed * f.st.isp * G0) / f.st.thrustKN / DAY_S, 0);
        if (m.type === 'transfer' && m.travelDays < burnDays) {
          add('error', 'invalid', `Ion burn needs ${Math.ceil(burnDays)} days (travel time is ${Math.round(m.travelDays)} days)`);
        }
      }
    }

    // Landing legs: must carry the touchdown mass.
    if (legsUse && alive) {
      const legs = best(equipmentOf(stack.spacecraft, 'legs'), 'maxLandingMassT');
      const mTouch = stackMassT(stack);
      if (!legs) add('error', 'equipment', 'Needs landing legs (Rocket → + Landing)');
      else if (legs.stats.maxLandingMassT < mTouch) {
        add('error', 'equipment', `Landing legs are too weak: rated for ${formatMass(legs.stats.maxLandingMassT)}, touchdown mass is ${formatMass(mTouch)}. Use stronger legs (Rocket tab).`);
      } else addFactor(legs, partReliability(legs), legs.name);
    }

    const hasError = issues.some((i) => i.severity === 'error');
    const ok = !hasError && !failed && alive;
    if (!ok && !failedAt) failedAt = m.id;
    if (issues.some((i) => i.code === 'dv')) failed = true;
    blocked = blocked || !ok;

    const res: ManeuverResult = {
      maneuverId: m.id, branchId: branch.id, type: m.type, label,
      dvRequiredMs: dv, dvAvailableBeforeMs: dvBefore, ok, startDay, endDay,
      stateBefore: before, stateAfter: after, burns: burnRes?.burns ?? [], issues,
    };
    if (twr !== undefined) res.twr = twr;
    if (trajectory) res.trajectory = trajectory;
    results.push(res);
    const visitedBefore = new Set(visited);
    if (after.kind !== 'lost') visited.add(after.body);
    steps.push({
      result: res, scIds: stack.spacecraft.map((s) => s.id), factorCount: factors.length, newFactors,
      blocked, visitedBefore, doseBefore: dose,
    });
    state = after;

    if (m.type === 'separate' && childStack) {
      const child = ctx.branchById.get(m.newBranchId);
      if (child) {
        children.push({
          branch: child,
          start: {
            state: after, stack: childStack, factors: [...factors], failed, blocked,
            visited: new Set(visited), dose, parent: { branchId: branch.id, maneuverId: m.id },
          },
        });
      }
    }
  });

  if (start.blocked && !failedAt && branch.maneuvers.length) failedAt = branch.maneuvers[0].id;

  // Stage bands: used delta-v plus what is left at the end of the branch.
  const pots = stagePotentials(stack);
  const inStack = new Set(stack.stages);
  const stageBands: StageBand[] = bandStages
    .filter((st) => inStack.has(st) || st.dvUsed > 0)
    .map((st) => ({
      stageId: st.stage.id, stageName: st.stage.name, ownerName: st.ownerName,
      dvUsedMs: st.dvUsed, dvTotalMs: st.dvUsed + (inStack.has(st) ? pots.get(st) ?? 0 : 0),
    }));

  const result: BranchResult = {
    branchId: branch.id,
    maneuvers: results,
    finalState: state,
    stageBands,
    dvRequiredTotalMs: results.reduce((s, r) => s + r.dvRequiredMs, 0),
    dvAvailableTotalMs: stageBands.reduce((s, b) => s + b.dvTotalMs, 0),
  };
  if (failedAt) result.failedAtManeuverId = failedAt;
  ctx.results.set(branch.id, result);

  for (const c of children) runBranch(ctx, c.branch, c.start);
}

// ---------------------------------------------------------------- evaluate

export function evaluateFull(game: GameState): { evaluation: Evaluation; internal: EvalInternal } {
  const plan = game.plan;
  const mission = game.mission;
  const root = plan.branches[0];
  const ctx: Ctx = {
    game,
    branchById: new Map(plan.branches.map((b) => [b.id, b])),
    results: new Map(),
    internals: new Map(),
  };
  const scById = new Map(game.rocket.spacecraft.map((s) => [s.id, s]));
  let totalMassT = 0;

  if (root) {
    const ids = root.spacecraftIds.filter((id) => scById.has(id));
    const stack = buildStack(game.rocket, ids, root.carriesRocketStages, plan.launchDay);
    totalMassT = stackMassT(stack);
    const first = root.maneuvers[0];
    const launchBody: BodyId = first && first.type === 'launch' ? first.body : 'earth';
    runBranch(ctx, root, {
      state: { kind: 'surface', body: launchBody, day: plan.launchDay },
      stack, factors: [], failed: false, blocked: false, visited: new Set([launchBody]), dose: 0,
    });
  }

  const destIssues: Issue[] = [];
  const seen = new Set<string>();
  const pushDest = (branchId: string, res: ManeuverResult, code: IssueCode, msg: string) => {
    const key = `${branchId}|${res.maneuverId}|${msg}`;
    if (seen.has(key)) return;
    seen.add(key);
    const issue: Issue = { severity: 'error', code, message: msg, branchId, maneuverId: res.maneuverId };
    res.issues.push(issue);
    destIssues.push(issue);
  };

  const orderedInternals = plan.branches.map((b) => ctx.internals.get(b.id)).filter((x): x is BranchInternal => !!x);

  // ---- goals
  const picks = new Map<string, GoalPick>();
  const lateGoals: string[] = [];
  const goals: GoalResult[] = mission.goals.map((goal) => {
    const gBody = BODIES[goal.body];
    const stay = goal.stayDays ?? 365;
    let pick: (GoalPick & { chance: number }) | undefined;
    let failReason: string | undefined;
    let reachedBlocked = false;
    let reachedNoInstrument = false;
    let reachedLate = false;
    const consider = (bi: BranchInternal, step: Step, chance: number, extra: Factor[]) => {
      if (step.result.endDay > mission.completionDeadlineDay) {
        reachedLate = true;
        return;
      }
      if (!pick || chance > pick.chance + 1e-12) {
        pick = { goalId: goal.id, branchId: bi.branchId, maneuverId: step.result.maneuverId, day: step.result.endDay, extra, chance };
      }
    };
    for (const bi of orderedInternals) {
      for (const step of bi.steps) {
        const s = step.result.stateAfter;
        if (s.kind === 'lost') continue;
        const type = step.result.type;
        const landed = type === 'land' || type === 'entry';
        let match = false;
        switch (goal.kind) {
          case 'orbit': match = s.kind === 'orbit' && s.body === goal.body; break;
          case 'land': match = s.kind === 'surface' && s.body === goal.body && landed; break;
          case 'return': match = s.kind === 'surface' && s.body === 'earth' && landed && step.visitedBefore.has(goal.body); break;
          case 'orbitData': match = s.kind === 'orbit' && s.body === goal.body; break;
          case 'surfaceData': match = s.kind === 'surface' && s.body === goal.body; break;
        }
        if (!match) continue;
        if (step.blocked) { reachedBlocked = true; continue; }
        const base = product(bi.factors.slice(0, step.factorCount));
        const scs = step.scIds.map((id) => scById.get(id)).filter((x): x is Spacecraft => !!x);
        if (goal.kind === 'orbit' || goal.kind === 'return') {
          consider(bi, step, base, []);
          continue;
        }
        if (goal.kind === 'land') {
          const problems = hazardProblems(gBody, 'surface', scs, 0, false);
          if (problems.length) {
            failReason ??= problems[0].msg;
            for (const p of problems) pushDest(bi.branchId, step.result, p.code, p.msg);
            continue;
          }
          consider(bi, step, base, []);
          continue;
        }
        // data goals
        const kind = goal.kind === 'orbitData' ? 'orbit' : 'surface';
        let hasInstrument = false;
        for (const sc of scs) {
          const inst = sc.equipment.find((p) => p.kind === 'instrument' && p.variant === goal.instrument
            && (p.stats.performance ?? 0) >= (goal.minPerformance ?? 0) - 1e-9);
          if (!inst) continue;
          hasInstrument = true;
          const dose = step.doseBefore + gBody.radiationPerDay * stay;
          const problems = [
            ...hazardProblems(gBody, kind, [sc], dose, true),
            ...dataProblems(sc, goal.body, step.result.endDay),
          ];
          if (problems.length) {
            if (!failReason) {
              failReason = problems[0].msg;
              for (const p of problems) pushDest(bi.branchId, step.result, p.code, p.msg);
            }
            continue;
          }
          const used = new Set(bi.factors.slice(0, step.factorCount).map((f) => f.partId));
          const extraParts = [inst, ...sc.equipment.filter((p) => p.kind === 'power' || p.kind === 'antenna')];
          const extra: Factor[] = extraParts.filter((p) => !used.has(p.id)).map((p) => ({
            partId: p.id, name: `${sc.name} ${p.name}`, p: partReliability(p),
            branchId: bi.branchId, maneuverId: step.result.maneuverId, day: step.result.endDay,
          }));
          consider(bi, step, base * product(extra), extra);
        }
        if (!hasInstrument) reachedNoInstrument = true;
      }
    }
    if (pick) {
      const { chance, ...rest } = pick;
      picks.set(goal.id, rest);
      return { goalId: goal.id, achievable: true, successChance: chance, branchId: pick.branchId };
    }
    let reason = failReason;
    if (!reason && reachedLate) {
      reason = `Reached after the mission deadline (${formatDay(mission.completionDeadlineDay, mission.startDateISO)})`;
      lateGoals.push(goal.name);
    }
    if (!reason && reachedBlocked) reason = 'The plan fails before this goal is reached';
    if (!reason && reachedNoInstrument && goal.instrument) {
      reason = `No spacecraft there carries a ${INSTRUMENTS[goal.instrument].name.toLowerCase()} with performance ≥ ${goal.minPerformance ?? 0}`;
    }
    if (!reason) {
      reason = {
        orbit: `The plan does not reach ${gBody.name} orbit`,
        land: `The plan does not land on ${gBody.name}`,
        orbitData: `The plan does not reach ${gBody.name} orbit with the instrument`,
        surfaceData: `The plan does not land the instrument on ${gBody.name}`,
        return: `The plan does not return to Earth from ${gBody.name}`,
      }[goal.kind];
    }
    return { goalId: goal.id, achievable: false, successChance: 0, reason };
  });

  // ---- hazards where branches end up
  for (const bi of orderedInternals) {
    const last = bi.steps[bi.steps.length - 1];
    if (!last) continue;
    const s = last.result.stateAfter;
    if (s.kind !== 'orbit' && s.kind !== 'surface') continue;
    const b = BODIES[s.body];
    if (b.radiationPerDay <= 0 && !(s.kind === 'surface' && b.surfaceHeat)) continue;
    const stays = mission.goals.filter((g) => g.body === s.body).map((g) => g.stayDays ?? 365);
    const stay = stays.length ? Math.max(...stays) : 365;
    const scs = last.scIds.map((id) => scById.get(id)).filter((x): x is Spacecraft => !!x);
    for (const p of hazardProblems(b, s.kind, scs, last.doseBefore + b.radiationPerDay * stay, true)) {
      pushDest(bi.branchId, last.result, p.code, p.msg);
    }
  }

  // ---- parts, cost, delivery, deadline
  const globalIssues: Issue[] = [];
  const gIssue = (severity: Severity, code: IssueCode, message: string, partId?: string) => {
    const i: Issue = { severity, code, message };
    if (partId) i.partId = partId;
    globalIssues.push(i);
  };
  let totalCostM = 0;
  const inDesign = new Set<string>();
  for (const loc of allParts(game.rocket)) {
    const p = loc.part;
    inDesign.add(p.id);
    if (p.state !== 'draft' && p.state !== 'sent') continue;
    totalCostM += estimatedCostM(p) * (loc.role === 'engine' && loc.stage ? loc.stage.engineCount : 1);
    const keys = beyondResearch(p, game.research, game.unlocked);
    const locked = keys.filter((k) => k.split('.').length === 2);
    const limits = keys.filter((k) => k.split('.').length >= 3);
    if (locked.length) gIssue('warning', 'locked', `${p.name} is not unlocked yet (${locked.join(', ')})`, p.id);
    if (limits.length) {
      const defs = statDefs(p.kind, p.variant);
      const text = limits.map((k) => {
        const statKey = k.split('.').slice(2).join('.');
        const def = defs.find((d) => d.key === statKey);
        const f = def?.displayFactor ?? 1;
        const unit = def?.displayUnit ?? def?.unit ?? '';
        const fmt = (v: number) => `${+(v * f).toPrecision(4)}${unit ? ' ' + unit : ''}`;
        return `${def?.label ?? statKey} ${fmt(p.stats[statKey])} > limit ${fmt(game.research[k])}`;
      });
      gIssue('warning', 'research', `${p.name} beyond research: ${text.join(', ')}`, p.id);
    }
    gIssue('info', 'delivery', p.state === 'draft' ? `${p.name}: not procured yet` : `${p.name}: task sent, not procured yet`, p.id);
  }
  for (const c of game.contracts) {
    totalCostM += c.priceM - (c.refundM ?? 0);
    if (c.status === 'running' && inDesign.has(c.partId) && c.deliveryDay > plan.launchDay) {
      gIssue('error', 'delivery',
        `Delivery of ${c.partSnapshot?.name ?? 'part'} (${formatDay(c.deliveryDay, mission.startDateISO)}) is after the launch date (${formatDay(plan.launchDay, mission.startDateISO)})`,
        c.partId);
    }
  }
  if (totalCostM > mission.budgetM) {
    gIssue('warning', 'budget', `Estimated cost ${formatMoney(totalCostM)} exceeds the budget of ${formatMoney(mission.budgetM)}`);
  }
  const deadline = formatDay(mission.completionDeadlineDay, mission.startDateISO);
  if (plan.launchDay > mission.completionDeadlineDay) {
    gIssue('error', 'deadline', `Launch date ${formatDay(plan.launchDay, mission.startDateISO)} is after the mission deadline ${deadline}`);
  }
  if (lateGoals.length) {
    gIssue('error', 'deadline', `Too late for the mission deadline ${deadline}: ${lateGoals.join(', ')}`);
  }

  // ---- assemble
  const branches: BranchResult[] = plan.branches.map((b) => ctx.results.get(b.id) ?? {
    branchId: b.id, maneuvers: [],
    finalState: { kind: 'lost', day: plan.launchDay, reason: 'Branch is not connected to the plan' } as FlightState,
    stageBands: [], dvRequiredTotalMs: 0, dvAvailableTotalMs: 0,
    ...(b.maneuvers[0] ? { failedAtManeuverId: b.maneuvers[0].id } : {}),
  });
  const issues: Issue[] = [];
  for (const br of branches) {
    for (const r of br.maneuvers) for (const i of r.issues) if (!destIssues.includes(i)) issues.push(i);
  }
  issues.push(...destIssues, ...globalIssues);

  const evaluation: Evaluation = { branches, goals, issues, totalMassT, totalCostM };
  const internal: EvalInternal = { branches: ctx.internals, picks, rootId: root?.id ?? '' };
  internals.set(evaluation, internal);
  return { evaluation, internal };
}

export function evaluate(game: GameState): Evaluation {
  return evaluateFull(game).evaluation;
}

/** Internal details of an evaluation (recomputed from the game if it came from elsewhere). */
export function internalFor(game: GameState, evaluation: Evaluation): { evaluation: Evaluation; internal: EvalInternal } {
  const internal = internals.get(evaluation);
  if (internal) return { evaluation, internal };
  return evaluateFull(game);
}
