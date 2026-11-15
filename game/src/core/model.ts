// Shared game model — the part of the state more than one station reads or writes.
// Procurement terms follow D-006 (Task, Resource, Call, Offer, Contract, Allocation,
// Budget); see docs/design/integration.md. Units: day = agency calendar day
// (day 0 = mission start), money M (millions), stats use the planner's stat keys
// (mission-planner/procurement-interface.md).

import type { Effect, NewsItem, StationId } from '../shared/events/types';

export type { Effect, NewsItem, StationId };
export const STATIONS: StationId[] = ['planner', 'procurement', 'science', 'comms'];

// ------------------------------------------------------------------ meta

export type Phase = 'lobby' | 'planning' | 'launched' | 'finished';

export interface Seat {
  /** Peer id of the player sitting at this station, or null if unclaimed. */
  claimedBy: string | null;
  playerName?: string;
}

export interface Meta {
  phase: Phase;
  /** Which hand-authored mission this game plays (core/mission.ts MISSIONS). */
  missionId: string;
  /** Root seed for all randomness (set when the game is created). */
  seed: number;
  /** Advances on every rng() draw inside reducers, so replays are deterministic. */
  rngCounter: number;
  /** Shared id counter for newId() inside reducers. */
  nextId: number;
  seats: Record<StationId, Seat>;
}

export interface Clock {
  day: number;              // fractional agency calendar day
  running: boolean;
  daysPerSecond: number;    // default: 1 real minute = 1 month
}

// ----------------------------------------------------------- procurement (D-006)

export type PartKind =
  | 'engine' | 'tank' | 'instrument' | 'power' | 'antenna' | 'legs'
  | 'heatShield' | 'radShield' | 'heatProtection';

export interface Criterion {
  id: string;
  label: string;                         // "Hydrogen/oxygen engine"
  partKind: PartKind;
  variant: string;                       // propulsion id, instrument variant, 'solar' | 'rtg', 'standard'
  /** Each stat must be met or exceeded (planner slider values). */
  minimums: Record<string, number>;
  quantity: number;                      // engines: engineCount; otherwise 1
}

export type TaskStatus = 'open' | 'completed' | 'withdrawn';

/** A shared goal with completion criteria (D-006). Any station can author one. */
export interface Task {
  id: string;
  revision: number;
  authorRole: StationId;
  title: string;
  criteria: Criterion[];
  neededAt: number;                      // calendar day (planner: planned launch day)
  priority: 'normal' | 'high';
  status: TaskStatus;
  /** Planner link: the design part this task procures. */
  partId?: string;
  /** Research keys / unlock keys the criteria exceed at creation (beyond research). */
  beyondResearch: string[];
  createdAt: number;
  updatedAt: number;
}

/** Catalogue item that can be supplied (static authored content, not in state). */
export interface Resource {
  id: string;
  name: string;
  partKind: PartKind;
  variant: string;
  stats: Record<string, number>;
  massT: number;
  /** Research/unlock keys needed before domestic suppliers can sell it. */
  requires?: string[];
}

export type OfferSource = 'catalogue' | 'call' | 'comms';
export type DeliveryOptionId = 'priority' | 'standard' | 'flexible';
export type Destination = { kind: 'shared' } | { kind: 'department'; department: StationId } | { kind: 'task'; taskId: string; criterionId: string };
export interface OrderDraft { offerId: string; quantity: number; destination: Destination; delivery: DeliveryOptionId; neededAt?: number }
export interface DeliveryOption { id: DeliveryOptionId; daysFactor: number; priceFactor: number }
export interface Amendment { at: number; from: number; to: number; feeM: number; delivery: DeliveryOptionId; eventDelayDays?: number }


export interface Offer {
  id: string;
  revision: number;
  supplierId: string;
  supplierName: string;
  /** Catalogue resource id, or an inline resource for call/comms offers. */
  resourceId?: string;
  resource: Omit<Resource, 'id'>;
  quantity: number;
  priceM: number;                        // total for the quantity
  leadTimeDays: number;
  reliability: number;                   // 0..1
  /** Share of the price kept by the supplier on cancellation. */
  cancellationPct: number;
  expiresAt?: number;
  callId?: string;
  source: OfferSource;
  status: 'available' | 'accepted' | 'withdrawn';
  remainingQuantity?: number;
  wholeOfferOnly?: boolean;
  deliveryOptions?: DeliveryOption[];
}

export interface Call {
  id: string;
  revision: number;
  taskId: string;
  criterionId: string;
  openedAt: number;
  closesAt: number;
  status: 'open' | 'closed' | 'withdrawn';
  offerIds: string[];
  requirement?: Criterion;
  destination?: Destination;
  neededAt?: number;
  windowDays?: 7 | 14 | 30;
  taskRevision?: number;
}

export type ContractStatus = 'active' | 'delivered' | 'cancelled' | 'failed';

export interface Contract {
  id: string;
  revision: number;
  offerSnapshot: Offer;
  signedAt: number;
  expectedAt: number;
  deliveredAt?: number;
  status: ContractStatus;
  refundM?: number;
  delivery?: DeliveryOptionId;
  initialDelivery?: DeliveryOptionId;
  baselineExpectedAt?: number;
  /** Requested standalone delivery date at signing; absent for older contracts. */
  requestedNeededAt?: number;
  amendmentCutoff?: number;
  amendments?: Amendment[];
}


/** Contracted quantity reserved for a Task criterion. */
export interface Allocation {
  id: string;
  revision: number;
  contractId: string;
  taskId: string;
  criterionId: string;
  department?: StationId;
  projectId?: string;
  quantity: number;
  status: 'reserved' | 'available' | 'released';
}

/** available = fundingTotal − spent − committed. */
export interface Budget {
  fundingTotalM: number;
  spentM: number;
  committedM: number;
}

export interface Market {
  tasks: Task[];
  offers: Offer[];
  calls: Call[];
  contracts: Contract[];
  allocations: Allocation[];
  /** Active price / delivery modifiers from comms effects. */
  modifiers: { effect: Extract<Effect, { months: number }>; untilDay: number }[];
}

// --------------------------------------------------------------- research

export type ResearchStatus = 'running' | 'succeeded' | 'failed';

export interface ResearchProject {
  id: string;
  title: string;
  fieldIds: string[];
  /** Shared task this project answers, if any. */
  taskId?: string;
  costM: number;
  startedAt: number;
  endsAt: number;
  status: ResearchStatus;
  /** Chance of success 0..1 (rolled at endsAt). */
  successChance: number;
  /** Applied on success (researchLimit / unlock / flags …). */
  effects: Effect[];
}

export interface ResearchState {
  /** `${kind}.${variant}.${stat}` → max value currently researched. */
  limits: Record<string, number>;
  /** `${kind}.${variant}` unlocked variants. */
  unlocked: string[];
  projects: ResearchProject[];
  /** Active pace modifiers (comms researchPace effects). */
  modifiers: { effect: Extract<Effect, { kind: 'researchPace' }>; untilDay: number }[];
}

// ----------------------------------------------------------------- events

export interface EventsState {
  /** Shared-world flags any station can raise (see docs/design/events.md). */
  flags: string[];
  news: NewsItem[];
}
