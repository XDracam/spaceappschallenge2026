// Small runtime guards at the saved-state and network boundaries. These validate
// representation, not mission feasibility or balance (the existing rules do that).
import type { Action } from './actions';
import { STATIONS, type StationId } from './model';
import { BODIES } from '../stations/planner/data/bodies';
import { VARIANTS, statDefs } from '../stations/planner/data/parts';
import type { GameState } from './state';
import { STATE_VERSION } from './state';
import { MISSIONS } from './mission';

type Guard = (x: unknown) => boolean;
export const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
export const text = (x: unknown): x is string => typeof x === 'string' && x.length <= 32768;
const id = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 160;
const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 1e12;
const bool = (x: unknown): x is boolean => typeof x === 'boolean';
const integer = (x: unknown): x is number => num(x) && Number.isSafeInteger(x) && x >= 0;
const oneOf = (...values: unknown[]): Guard => x => values.includes(x);
const optional = (guard: Guard): Guard => x => x === undefined || guard(x);
const list = (guard: Guard, max = 10000): Guard => x => Array.isArray(x) && x.length <= max && x.every(guard);
const strings = list(id);
export const station = (x: unknown): x is StationId => STATIONS.includes(x as StationId);
const body = (x: unknown) => typeof x === 'string' && Object.hasOwn(BODIES, x);
const propulsion = oneOf('solid', 'kerolox', 'hydrolox', 'hypergolic', 'ion');
const payload = oneOf('orbiter', 'lander', 'rover', 'sampleReturn', 'crew');
const delivery = oneOf('priority', 'standard', 'flexible');
const phase = oneOf('lobby', 'planning', 'launched', 'finished');
const dict = (guard: Guard): Guard => x => record(x) && Object.values(x).every(guard);
const has = (x: unknown, fields: Record<string, Guard>): boolean => record(x) && Object.entries(fields).every(([k, guard]) => guard(x[k]));
const fields = (shape: Record<string, Guard>): Guard => x => has(x, shape);

/** Protect recursion and object assignment from malformed or oversized JSON. */
export function safeValue(x: unknown, depth = 0): boolean {
  if (depth > 20) return false;
  if (x == null || bool(x) || num(x) || text(x)) return true;
  if (Array.isArray(x)) return x.length <= 10000 && x.every(v => safeValue(v, depth + 1));
  return record(x) && Object.keys(x).length <= 10000 && Object.entries(x).every(([k, v]) =>
    !['__proto__', 'prototype', 'constructor'].includes(k) && k.length <= 160 && safeValue(v, depth + 1));
}

const maneuverFields: Record<string, Record<string, Guard>> = {
  launch: { body, altitudeKm: num }, changeOrbit: { altitudeKm: num },
  transfer: { target: body, departDay: num, travelDays: num },
  flyby: { target: body, periapsisAltKm: num, travelDays: num },
  insertion: { altitudeKm: num, aerocapture: bool }, land: {}, ascent: { altitudeKm: num },
  separate: { spacecraftIds: strings, newBranchId: id }, entry: {},
};
export const maneuver = (x: unknown): boolean => record(x) && id(x.id) && typeof x.type === 'string'
  && Object.hasOwn(maneuverFields, x.type) && has(x, maneuverFields[x.type]);
const maneuverPatch = (x: unknown) => record(x) && Object.keys(x).every(k =>
  ({ altitudeKm: num, body, target: body, departDay: num, travelDays: num, periapsisAltKm: num,
    aerocapture: bool, spacecraftIds: strings, newBranchId: id } as Record<string, Guard>)[k]?.(x[k]));
const destination = (x: unknown) => record(x) && (x.kind === 'shared'
  || x.kind === 'department' && station(x.department)
  || x.kind === 'task' && id(x.taskId) && id(x.criterionId));
const order = fields({ offerId: id, quantity: integer, destination, delivery, neededAt: optional(num) });
const outcome = fields({ achieved: integer, total: integer, scrubbed: bool, bonusEarned: optional(num), bonusTotal: optional(num) });
const requestOptions = fields({ parentNeedId: optional(id), neededAt: optional(num) });
const purpose = oneOf('request', 'funding', 'equipment', 'timing');
const actionArgs: Record<string, Guard[]> = {
  ...(import.meta.env.DEV ? { 'comms/devFireEvent': [id], 'procurement/devAddSampleTasks': [] } : {}),
  'core/tick': [num], 'core/setRunning': [bool], 'core/setSpeed': [num], 'core/startGame': [],
  'core/claimSeat': [station, id, optional(text)], 'core/releaseSeat': [id],
  'core/recordAttempt': [outcome], 'core/restart': [optional(outcome)],
  'core/returnToLobby': [optional(outcome)], 'core/setMission': [id],
  'planner/setPartStat': [id, id, num], 'planner/setEngineCount': [id, num],
  'planner/setStagePropulsion': [id, propulsion], 'planner/renameStage': [id, text],
  'planner/addStage': [id, propulsion], 'planner/removeStage': [id], 'planner/moveStage': [id, oneOf(-1, 1)],
  'planner/addSpacecraft': [payload], 'planner/renameSpacecraft': [id, text], 'planner/setPayloadType': [id, payload],
  'planner/removeSpacecraft': [id], 'planner/addEquipment': [id, oneOf(...Object.keys(VARIANTS)), id],
  'planner/removePart': [id], 'planner/orderPart': [id], 'planner/orderAllParts': [],
  'planner/replacePart': [id, id, bool], 'planner/saveVersion': [optional(text)],
  'planner/restoreVersion': [id], 'planner/deleteVersion': [id], 'planner/setLaunchDay': [num],
  'planner/addManeuver': [id, maneuver], 'planner/updateManeuver': [id, maneuverPatch],
  'planner/removeManeuver': [id], 'planner/renameBranch': [id, text], 'planner/launchNow': [],
  'procurement/leaseFacility': [id, oneOf(3, 6, 12, 'buy')], 'procurement/hireTeam': [id],
  'procurement/signOffer': [id, optional(id), optional(id), optional(integer)],
  'procurement/signOrder': [order, text], 'procurement/amendDelivery': [id, delivery, text],
  'procurement/openCall': [id, id], 'procurement/cancelContract': [id, text],
  'procurement/replaceContract': [id, order, text], 'procurement/allocate': [id, id, id, optional(integer)],
  'science/startTech': [id, id], 'science/startTest': [id, id], 'science/askFacility': [id, id],
  'science/askTeam': [], 'science/withdrawSupplyRequest': [id], 'science/cancelProject': [id],
  'comms/answer': [id, id], 'comms/startProject': [id],
  'coordination/create': [text, text, station, optional(id), optional(id), optional(purpose), optional(integer), optional(requestOptions)],
  'coordination/edit': [id, integer, text, text, station, optional(purpose), optional(requestOptions)],
  'coordination/setStatus': [id, integer, oneOf('open', 'completed', 'withdrawn')],
};

export function validAction(x: unknown): x is Action {
  if (!record(x) || typeof x.type !== 'string' || !Array.isArray(x.args) || !safeValue(x) || JSON.stringify(x).length > 65536
    || !(station(x.by) || x.by === 'host')) return false;
  const guards = actionArgs[x.type];
  if (!guards || x.args.length > guards.length || !guards.every((guard, i) => guard((x.args as unknown[])[i] === null ? undefined : (x.args as unknown[])[i]))) return false;
  if (x.type === 'planner/addEquipment') {
    const [, kind, variant] = x.args as [unknown, keyof typeof VARIANTS, string];
    if (!VARIANTS[kind].includes(variant)) return false;
  }
  return true;
}

const kindVariant = (x: unknown): boolean => record(x) && typeof x.kind === 'string' && Object.hasOwn(VARIANTS, x.kind)
  && typeof x.variant === 'string' && VARIANTS[x.kind as keyof typeof VARIANTS].includes(x.variant);
const part = (x: unknown): boolean => kindVariant(x) && has(x, { id, name: text, stats: dict(num), state: oneOf('draft', 'ordered', 'contracted', 'delivered', 'late') })
  && record(x) && statDefs(x.kind as keyof typeof VARIANTS, x.variant as string).every(def => record(x.stats) && num(x.stats[def.key]));
const stage = fields({ id, name: text, propulsion, engine: part, engineCount: integer, tanks: list(part) });
const rocket = fields({ stages: list(stage), spacecraft: list(fields({ id, name: text, payloadType: payload, stages: list(stage), equipment: list(part) })) });
const plan = fields({ launchDay: num, branches: list(fields({ id, name: text, spacecraftIds: strings, carriesRocketStages: bool,
  parent: optional(fields({ branchId: id, maneuverId: id })), maneuvers: list(maneuver) })) });
const hardware = (x: unknown): boolean => record(x) && kindVariant({ kind: x.partKind, variant: x.variant });
const criterion = (x: unknown): boolean => hardware(x) && has(x, { id, label: text, minimums: dict(num), quantity: integer });
const resource = (x: unknown): boolean => hardware(x) && has(x, { name: text, stats: dict(num), massT: num });
const offer = fields({ id, revision: integer, supplierId: id, supplierName: text, resource, quantity: integer,
  priceM: num, leadTimeDays: num, reliability: num, cancellationPct: num, source: oneOf('catalogue', 'call', 'comms'), status: oneOf('available', 'accepted', 'withdrawn'),
  expiresAt: optional(num), remainingQuantity: optional(integer), wholeOfferOnly: optional(bool),
  deliveryOptions: optional(list(fields({ id: delivery, daysFactor: num, priceFactor: num }))) });
const effectFields: Record<string, Record<string, Guard>> = {
  trust: { stakeholder: oneOf('government', 'industry', 'public', 'partners'), delta: num }, budget: { deltaM: num },
  deliveryDelay: { months: num, scope: oneOf('all', 'next') }, priceModifier: { pct: num, months: num },
  offer: { partKind: id, variant: id, supplier: text, priceM: num, deliveryMonths: num, reliability: num, note: text, stats: optional(dict(num)), massT: optional(num) },
  researchPace: { pct: num, months: num }, researchLimit: { key: id, value: num }, unlock: { key: id },
  techAccess: { tech: id, access: oneOf('block', 'enable'), note: text },
  service: { service: oneOf('groundStation', 'launchSlot', 'testFacility'), note: text },
  missionConstraint: { text }, flag: { flag: id, on: bool }, eventOdds: { tag: id, factor: num, months: num },
};
const effect = (x: unknown): boolean => record(x) && typeof x.kind === 'string' && Object.hasOwn(effectFields, x.kind) && has(x, effectFields[x.kind]);
const modifier = fields({ effect, untilDay: num });

/** Validate current-format saves/snapshots before any component reads their fields. */
export function validGameState(x: unknown): x is GameState {
  if (!safeValue(x)) return false;
  return has(x, {
    version: oneOf(STATE_VERSION),
    meta: fields({ phase, missionId: v => MISSIONS.some(m => m.id === v), seed: integer, rngCounter: integer,
      nextId: integer, attempt: integer, attempts: list(fields({ attempt: integer, missionId: id, achieved: integer,
        total: integer, scrubbed: bool, score: fields({ total: num, parts: dict(num) }), spentM: num, fundingTotalM: num, launchDay: v => v === null || num(v) })),
      seats: v => record(v) && STATIONS.every(st => has(v[st], { claimedBy: v => v === null || id(v), playerName: optional(text) })) }),
    clock: fields({ day: num, running: bool, daysPerSecond: num }),
    budget: fields({ fundingTotalM: num, spentM: num, committedM: num }),
    market: fields({ tasks: list(fields({ id, revision: integer, authorRole: station, title: text, criteria: list(criterion), neededAt: num,
      priority: oneOf('normal', 'high'), status: oneOf('open', 'completed', 'withdrawn'), beyondResearch: strings, createdAt: num, updatedAt: num })), offers: list(offer),
      calls: list(fields({ id, revision: integer, taskId: text, criterionId: text, openedAt: num, closesAt: num, status: oneOf('open', 'closed', 'withdrawn'), offerIds: strings, requirement: optional(criterion), destination: optional(destination), neededAt: optional(num) })),
      contracts: list(fields({ id, revision: integer, offerSnapshot: offer, signedAt: num, expectedAt: num, status: oneOf('active', 'delivered', 'cancelled', 'failed'), deliveredAt: optional(num), refundM: optional(num), tested: optional(bool),
        delivery: optional(delivery), initialDelivery: optional(delivery), baselineExpectedAt: optional(num), amendmentCutoff: optional(num), requestedNeededAt: optional(num),
        amendments: optional(list(fields({ at: num, from: num, to: num, feeM: num, delivery, eventDelayDays: optional(num) }))) })),
      allocations: list(fields({ id, revision: integer, contractId: id, taskId: text, criterionId: text, quantity: num, department: optional(station), status: oneOf('reserved', 'available', 'released') })), modifiers: list(modifier) }),
    research: fields({ limits: dict(num), unlocked: strings, access: dict(oneOf('blocked', 'enabled')),
      projects: list(fields({ id, title: text, costM: num, startedAt: num, endsAt: num, status: oneOf('running', 'succeeded', 'failed'), techId: optional(id), partId: optional(id), taskId: optional(id), successChance: num, effects: list(effect) })),
      modifiers: list(modifier), facilities: list(fields({ id, facilityId: id, from: num, until: optional(num), costM: num })),
      teams: list(fields({ id, offerId: id, from: num, until: optional(num), costM: num })),
      supplyRequests: list(fields({ id, kind: oneOf('facility', 'team'), techIds: optional(strings), facilityId: optional(id), requestedAt: num, status: oneOf('open', 'done', 'withdrawn') })) }),
    events: fields({ flags: strings, news: list(fields({ id, day: num, from: station, text, affects: list(station), internal: bool })) }),
    coordination: list(fields({ id, revision: integer, title: text, description: text, authorRole: station,
      assignee: station, status: oneOf('open', 'completed', 'withdrawn'), createdAt: num, updatedAt: num,
      purpose: optional(purpose), sourceText: optional(text), parentNeedId: optional(id), neededAt: optional(num) })),
    planner: fields({ rocket, plan, playthroughSeed: integer, versions: list(fields({ id, name: text, savedDay: num,
      rocket, plan, summary: fields({ totalMassT: num, totalCostM: num, goalChances: dict(num), failed: bool }) })) }),
    procurement: fields({ notes: list(text), lateWarned: strings }),
    science: fields({ slots: integer, researched: strings, info: dict(fields({ techId: id, endedAt: optional(num), cancelled: optional(bool), paused: optional(bool), pausedWhy: optional(oneOf('comms', 'equipment')) })) }),
    comms: fields({ trust: v => has(v, { government: num, industry: num, public: num, partners: num }),
      inbox: list(fields({ instanceId: id, eventId: id, arrivedDay: num, deadlineDay: num, status: oneOf('open', 'answered', 'expired') })),
      projects: list(fields({ instanceId: id, defId: id, startDay: num, endDay: num })), modifiers: list(modifier),
      fired: strings, done: optional(strings), nextPoolDay: num, launched: bool, inFlight: list(fields({ eventId: id, good: bool })) }),
  });
}
