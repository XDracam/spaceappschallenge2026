export type Discipline = 'geo' | 'bio' | 'atm' | 'ins' | 'rad' | 'mat' | 'orb';

/** established: known. frontier: open questions. hint: partly seen. fog: unknown, nobody looked. */
export type FieldState = 'est' | 'fr' | 'hint' | 'fog';

export type Odds = 'Good' | 'Medium' | 'Long shot';

export interface Recipe {
  ids: string[];
  title: string;
  pitch: string;
  method: string;
  needs: string;
  time: string;
  odds: Odds;
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

/** open: waiting for science. running: research under way. done: result delivered to the requester. */
export type TaskStatus = 'open' | 'running' | 'done';

/** A request from another station. Today only Mission Planning posts them. */
export interface ResearchTask {
  id: string;
  title: string;
  /** research: raise a limit. unlock: make a part available. */
  kind: 'research' | 'unlock';
  requestedBy: 'Mission Planning';
  part: string;
  detail: string;
  why: string;
  /** Fields most relevant to answering the task. */
  fieldIds: string[];
  /** Days from now until the result is needed. */
  dueInDays: number;
  duration: string;
  status: TaskStatus;
}
