export type Discipline = 'geo' | 'bio' | 'atm' | 'ins' | 'rad' | 'mat' | 'orb';

/** established: known. frontier: open questions. hint: partly seen. fog: unknown, nobody looked. */
export type FieldState = 'est' | 'fr' | 'hint' | 'fog';

export type Odds = 'Good' | 'Medium' | 'Long shot';

/** What a successful project gives. Limit gains are deltas on the planner's research limit. */
export type Gain =
  /** Raise a research limit (key `${kind}.${variant}.${stat}`) by delta at Balanced scope. */
  | { kind: 'limit'; key: string; delta: number }
  /** Unlock a part variant (key `${kind}.${variant}`). Not reachable with a Safe scope. */
  | { kind: 'unlock'; key: string };

/** A part science can ask Procurement for when it takes its own measurements. */
export interface TestPart {
  label: string;
  partKind: 'instrument' | 'power' | 'antenna';
  variant: string;
  minimums: Record<string, number>;
}

export interface Recipe {
  ids: string[];
  title: string;
  pitch: string;
  method: string;
  needs: string;
  /** Base duration at Balanced scope with new measurements. */
  months: number;
  /** Base cost in M. */
  costM: number;
  odds: Odds;
  /** Engineering payoff: raises planner research limits or unlocks parts. Empty = pure science. */
  gains: Gain[];
  /** Pure science: what success means (news line). */
  finding?: string;
  /** Flags raised on success (shared events.flags). */
  flags?: string[];
  /** Optional: a test unit science can request from Procurement (method 'new'). */
  testPart?: TestPart;
}

export interface GraphNode {
  id: string;
  label: string;
  discipline: Discipline;
  /** Position inside the discipline list. */
  index: number;
  state: FieldState;
  /** Layout size in graph units. */
  w: number;
  h: number;
  x: number;
  y: number;
}

/** 0: inside a discipline. 1: between disciplines. 2: to an unknown field. */
export type EdgeKind = 0 | 1 | 2;
export type Edge = [from: string, to: string, kind: EdgeKind];

export interface Graph {
  width: number;
  height: number;
  nodes: GraphNode[];
  byId: Record<string, GraphNode>;
  edges: Edge[];
  adjacency: Record<string, string[]>;
  titles: { discipline: Discipline; name: string; color: string; x: number; y: number }[];
}

export type CombineResult =
  | { kind: 'recipe'; names: string; recipe: Recipe }
  | { kind: 'known'; names: string }
  | { kind: 'none'; names: string };
