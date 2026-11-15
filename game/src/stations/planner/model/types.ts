// Shared types for the mission planner. Every module (physics, map, ui, state)
// codes against these. Units unless noted:
//   distance km, time = calendar day (day 0 = mission start), delta-v m/s,
//   mass t (metric tonnes), thrust kN, Isp s, power kW, data rate kbps,
//   money M (millions).

export type Vec2 = { x: number; y: number };

// ---------------------------------------------------------------- bodies

export type BodyId =
  | 'sun' | 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'phobos' | 'deimos'
  | 'vesta' | 'ceres' | 'jupiter' | 'io' | 'europa' | 'ganymede' | 'callisto';

export type Atmosphere = 'none' | 'thin' | 'thick' | 'gas';

export interface Body {
  id: BodyId;
  name: string;
  parent: BodyId | null;       // null only for the Sun
  orbitRadiusKm: number;       // circular orbit radius around parent (0 for Sun)
  phaseAtEpochDeg: number;     // angle of the body on its orbit at day 0, counter-clockwise from +x
  radiusKm: number;
  muKm3s2: number;             // gravitational parameter
  surfaceGravity: number;      // m/s^2
  atmosphere: Atmosphere;
  landable: boolean;
  lowOrbitAltKm: number;       // default parking orbit altitude
  minOrbitAltKm: number;       // lowest allowed orbit altitude
  maxOrbitAltKm: number;       // highest allowed orbit altitude (inside sphere of influence)
  launchDvMs: number;          // surface -> low orbit incl. gravity/drag losses (0 if not landable)
  landDvMs: number;            // low orbit -> surface, fully propulsive (0 if not landable)
  landDvWithShieldMs: number;  // with heat shield on atmosphere bodies; equals landDvMs otherwise
  radiationPerDay: number;     // radiation dose units per day in low orbit / on surface
  surfaceHeat: boolean;        // Venus: surface lifetime limited by heat protection
  color: string;               // map colour
}

// ------------------------------------------------------------ propulsion

export type PropulsionId = 'solid' | 'kerolox' | 'hydrolox' | 'hypergolic' | 'ion';

export interface Propulsion {
  id: PropulsionId;
  name: string;
  ispRange: [number, number];        // slider range (s)
  thrustRangeKN: [number, number];   // slider range (kN)
  engineBaseMassT: number;           // engine mass = base + thrust * massPerKN * ispFactor
  engineMassPerKN: number;
  tankDryFraction: number;           // tank dry mass = fraction * fuel capacity
  boilOffPerMonth: number;           // fraction of remaining fuel lost per 30 days after launch
  canLaunchOrLand: boolean;          // false for ion (TWR far below 1)
  engineCostPerKN: number;           // M per kN (scaled by ispFactor)
  engineBaseCost: number;            // M
  fuelCostPerT: number;              // M per tonne of tank capacity (tank structure + fuel)
  baseReliability: number;           // per engine unit, before contracts
}

// ----------------------------------------------------------------- parts

export type PartKind =
  | 'engine' | 'tank' | 'instrument' | 'power' | 'antenna' | 'legs'
  | 'heatShield' | 'radShield' | 'heatProtection';

/**
 * Lifecycle of a part in the design (see rocket-configurator.md#part-lifecycle).
 * Derived from the shared market (stations/planner/derive.ts), never stored:
 * the slice keeps every part as 'draft'.
 */
export type PartState = 'draft' | 'ordered' | 'contracted' | 'delivered' | 'late';

export interface Part {
  id: string;
  kind: PartKind;
  /** engine/tank: PropulsionId; instrument: InstrumentVariant; power: 'solar' | 'rtg'; others: 'standard' */
  variant: string;
  name: string;
  /** Slider values. Keys per kind are defined in data/parts.ts (PART_STATS). */
  stats: Record<string, number>;
  /** Derived (see PartState). */
  state: PartState;
  /** Derived: the shared Task procuring this part (latest one). */
  taskId?: string;
  /** Derived: the shared Contract allocated to it. */
  contractId?: string;
  supplyDetails?: { need: number; contributions: { supplier: string; quantity: number; status: string; day: number; compatible: boolean }[]; incompatible: boolean };
  /** Set once contracted: the real part's mass, replacing the derived mass. */
  actualMassT?: number;
  /** Set once contracted: the real part's reliability. */
  reliability?: number;
}

export type InstrumentVariant = 'camera' | 'spectrometer' | 'radar' | 'surfaceLab';

export interface Stage {
  id: string;
  name: string;
  propulsion: PropulsionId;
  engine: Part;          // kind 'engine', variant = propulsion
  engineCount: number;   // identical engine units
  tanks: Part[];         // exactly one tank (kind 'tank', variant = propulsion); size it with its slider
}

export type PayloadType = 'orbiter' | 'lander' | 'rover' | 'sampleReturn' | 'crew';

export interface Spacecraft {
  id: string;
  name: string;
  payloadType: PayloadType;
  stages: Stage[];       // fired in order after all rocket stages are gone
  equipment: Part[];     // instrument, power, antenna, legs, heatShield, radShield, heatProtection
}

export interface Rocket {
  stages: Stage[];          // bottom (booster) first
  spacecraft: Spacecraft[]; // payload; all attached until separated
}

// ------------------------------------------------------------- maneuvers

export type ManeuverType =
  | 'launch' | 'changeOrbit' | 'transfer' | 'flyby' | 'insertion'
  | 'land' | 'ascent' | 'separate' | 'entry';

interface ManeuverCommon { id: string }

/** Surface -> circular orbit. First maneuver of the root branch (from Earth). */
export interface LaunchManeuver extends ManeuverCommon { type: 'launch'; body: BodyId; altitudeKm: number }
/** Hohmann between two circular orbits around the same body. */
export interface ChangeOrbitManeuver extends ManeuverCommon { type: 'changeOrbit'; altitudeKm: number }
/**
 * From an orbit to another body. Departure day and travel time are sliders.
 * Valid targets: siblings of the current body (same parent, Lambert around the parent),
 * children of the current body (moons; Hohmann from the parking orbit),
 * or the parent of a moon (escape the moon to the parent's low orbit).
 * Ends in an 'approach' state at the target.
 */
export interface TransferManeuver extends ManeuverCommon {
  type: 'transfer'; target: BodyId; departDay: number; travelDays: number;
}
/** From an approach at a body: swing by it toward a new target. */
export interface FlybyManeuver extends ManeuverCommon {
  type: 'flyby'; target: BodyId; periapsisAltKm: number; travelDays: number;
}
/** From an approach: capture into a circular orbit. Aerocapture needs a heat shield and an atmosphere. */
export interface InsertionManeuver extends ManeuverCommon { type: 'insertion'; altitudeKm: number; aerocapture: boolean }
/** From an orbit: land. Needs landing legs; atmosphere + heat shield makes it cheaper. */
export interface LandManeuver extends ManeuverCommon { type: 'land' }
/** From a surface: back to a circular orbit. */
export interface AscentManeuver extends ManeuverCommon { type: 'ascent'; altitudeKm: number }
/** Split: the listed spacecraft leave on a new branch (newBranchId); the rest stay on this branch. */
export interface SeparateManeuver extends ManeuverCommon { type: 'separate'; spacecraftIds: string[]; newBranchId: string }
/** From an approach: direct atmospheric entry and landing (needs heat shield). */
export interface EntryManeuver extends ManeuverCommon { type: 'entry' }

export type Maneuver =
  | LaunchManeuver | ChangeOrbitManeuver | TransferManeuver | FlybyManeuver
  | InsertionManeuver | LandManeuver | AscentManeuver | SeparateManeuver | EntryManeuver;

export interface Branch {
  id: string;
  name: string;
  /** Spacecraft that fly on this branch at its start (root: all). */
  spacecraftIds: string[];
  /** Root branch carries the rocket stages; branches created by separation do not. */
  carriesRocketStages: boolean;
  /** For branches created by a separate maneuver. */
  parent?: { branchId: string; maneuverId: string };
  maneuvers: Maneuver[];
}

export interface MissionPlan {
  launchDay: number;     // agency calendar day of launch
  branches: Branch[];    // branches[0] is the root
}

/** An entry in the maneuver-type menu opened by clicking an orbit / state on the map. */
export interface ManeuverOption {
  type: ManeuverType;
  target?: BodyId;
  label: string;          // e.g. "Transfer to Mars", "Land on Mars"
  enabled: boolean;
  reason?: string;        // why disabled
  /** Less likely next steps (other destinations, flybys): shown under "More…" in the menu. */
  secondary?: boolean;
  /** For 'separate': the spacecraft this option releases onto a new branch. */
  spacecraftId?: string;
  /** For 'changeOrbit': target altitude (e.g. a goal orbit); unset = a default step. */
  altitudeKm?: number;
}

// --------------------------------------------------------- flight states

export type FlightState =
  | { kind: 'surface'; body: BodyId; day: number }
  | { kind: 'orbit'; body: BodyId; altitudeKm: number; day: number }
  /** Arriving at `body` on a hyperbolic path; vInf is relative to the body (km/s, inertial axes). */
  | { kind: 'approach'; body: BodyId; day: number; vInf: Vec2; from: BodyId }
  | { kind: 'lost'; day: number; reason: string };

// ------------------------------------------------------------- mission

export type GoalKind = 'orbit' | 'land' | 'orbitData' | 'surfaceData' | 'return';

export interface Goal {
  id: string;
  name: string;
  kind: GoalKind;
  body: BodyId;
  instrument?: InstrumentVariant;   // for data goals
  minPerformance?: number;          // for data goals
  stayDays?: number;                // time at the body that counts for hazards (default 365)
  /** orbit / orbitData goals: required circular orbit altitude (km). Unset = any orbit at the body. */
  altitudeKm?: number;
  /** Allowed deviation from altitudeKm (km, default 1000). */
  altitudeToleranceKm?: number;
  /** Name of that orbit for menus and hints, e.g. "geostationary orbit". */
  orbitName?: string;
  /**
   * Optional goal: not needed for the mission to count as complete. It never blocks the launch and does not
   * lower the goal share of the score; achieving it earns bonus points (core/score.ts).
   */
  optional?: boolean;
  /** Relative weight of an optional goal in the bonus score part (default 1). Only used with `optional`. */
  bonusPoints?: number;
}

export interface MissionDef {
  id: string;
  name: string;
  briefing: string;
  /** Ideas this mission adds over the easier ones, one beginner sentence each (shown in the planner's briefing). */
  ideas?: string[];
  startDateISO: string;          // calendar day 0
  /** Mission completion deadline: goals achieved after this day do not count. */
  completionDeadlineDay: number;
  budgetM: number;
  goals: Goal[];
  /** Research limits: key `${kind}.${variant}.${statKey}` -> max value currently researched. */
  research: Record<string, number>;
  /** Unlocked part variants: key `${kind}.${variant}`. Locked variants can still be planned with. */
  unlocked: string[];
  /** Multiplies the duration of every research project (science tech tree). Short missions use < 1. Default 1. */
  researchTimeFactor?: number;
  initialRocket: Rocket;
  initialPlan: MissionPlan;
}

// ---------------------------------------------------------- procurement
// The planner's read-only view of a shared contract (core/model.ts Contract)
// allocated to one of its parts (derived in stations/planner/derive.ts).

export interface PartContract {
  id: string;
  taskId: string;
  partId: string;
  partName: string;
  supplier: string;
  priceM: number;
  signedDay: number;
  /** Delivered day, or the expected delivery day while active. */
  deliveryDay: number;
  reliability: number;               // 0..1, as it will fly (a part test by Science halves the risk)
  /** Science has tested the delivered part. */
  tested?: boolean;
  actualStats: Record<string, number>;
  actualMassT: number;
  cancellationPct: number;
  status: 'running' | 'delivered' | 'cancelled';
  refundM?: number;
}

export interface SavedVersion {
  id: string;
  name: string;
  savedDay: number;
  rocket: Rocket;
  plan: MissionPlan;
  summary: { totalMassT: number; totalCostM: number; goalChances: Record<string, number>; failed: boolean };
}

export type GamePhase = 'planning' | 'launched';

/**
 * Planner-shaped view of the shared GameState, the input of physics (evaluate,
 * playthrough, maneuver options) and the planner UI. Built by
 * stations/planner/derive.ts (plannerGame); never stored or mutated.
 */
export interface PlannerGame {
  mission: MissionDef;
  /** Effective rocket: derived part states; contracted parts carry their real stats, mass and reliability. */
  rocket: Rocket;
  plan: MissionPlan;
  /** Contracts allocated to planner parts (incl. parts no longer in the design). */
  contracts: PartContract[];
  /** Research limits / unlocked variants (shared research state). */
  research: Record<string, number>;
  unlocked: string[];
  versions: SavedVersion[];
  phase: GamePhase;
  playthroughSeed: number;
  groundStation: boolean;
  /** Shared agency budget (M). available = total − spent − committed. */
  budget: { totalM: number; spentM: number; committedM: number; availableM: number };
}

// ------------------------------------------------------------ evaluation
// Output of physics/evaluate.ts (the live simulation test).

export type Severity = 'error' | 'warning' | 'info';
export type IssueCode =
  | 'dv' | 'twr' | 'equipment' | 'hazard' | 'power' | 'data'
  | 'research' | 'locked' | 'delivery' | 'invalid' | 'budget' | 'deadline';

export interface Issue {
  severity: Severity;
  code: IssueCode;
  message: string;
  branchId?: string;
  maneuverId?: string;
  partId?: string;
}

export interface TrajectorySegment {
  /** Points are in the inertial frame of this body, relative to its centre (km). */
  centerBody: BodyId;
  points: Vec2[];
  startDay: number;
  endDay: number;
}

export interface StageBurn { stageId: string; dvMs: number }

export interface ManeuverResult {
  maneuverId: string;
  branchId: string;
  type: ManeuverType;
  label: string;                 // e.g. "Transfer to Mars"
  dvRequiredMs: number;
  dvAvailableBeforeMs: number;   // remaining delta-v of the stack before this maneuver
  ok: boolean;                   // false = this is where the branch fails
  startDay: number;
  endDay: number;
  stateBefore: FlightState;
  stateAfter: FlightState;
  burns: StageBurn[];            // which stages paid for this maneuver
  twr?: number;                  // for launch/land/ascent
  issues: Issue[];
  trajectory?: TrajectorySegment;
}

export interface StageBand {
  stageId: string;
  stageName: string;
  ownerName: string;   // "Rocket" or spacecraft name
  dvTotalMs: number;   // delta-v this stage could provide in this branch's stack
  dvUsedMs: number;
}

export interface BranchResult {
  branchId: string;
  maneuvers: ManeuverResult[];
  failedAtManeuverId?: string;
  finalState: FlightState;
  stageBands: StageBand[];
  dvRequiredTotalMs: number;
  dvAvailableTotalMs: number;
}

export interface GoalResult {
  goalId: string;
  achievable: boolean;       // plan reaches it with no blocking error
  successChance: number;     // 0..1, product of reliabilities of parts used up to the goal (0 if not achievable)
  /** The parts behind successChance, each once (p = reliability; a cluster of engines counts as one). */
  factors?: { partId: string; p: number }[];
  branchId?: string;
  reason?: string;           // why not achievable
}

export interface Evaluation {
  branches: BranchResult[];
  goals: GoalResult[];
  issues: Issue[];           // all issues incl. per-maneuver ones, plus part/budget/delivery issues
  totalMassT: number;        // launch mass
  totalCostM: number;        // estimated cost of all draft/ordered parts + contract prices
  uncontractedCostM: number; // estimated cost of the draft/ordered parts only (still to be paid)
}

// ----------------------------------------------------------- playthrough

export interface PlaythroughEvent {
  day: number;
  branchId: string;
  maneuverId?: string;
  kind: 'maneuver' | 'failure' | 'goal' | 'info';
  text: string;
}

export interface PlaythroughResult {
  events: PlaythroughEvent[];       // sorted by day
  goalOutcomes: { goalId: string; success: boolean }[];
  endDay: number;
}
