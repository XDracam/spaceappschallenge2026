// Types for the engineering tech tree (D-020). Pure data, no framework imports.

export type Branch = 'propulsion' | 'power' | 'instruments' | 'antenna' | 'protection';

/** What a finished tech gives the planner: a higher research limit, or an unlocked part type. */
export type Grant =
  | { kind: 'limit'; key: string; value: number }
  | { kind: 'unlock'; key: string };

/** A tech that needs comms to approve it before research can start (comms enables it with a techAccess effect). */
export interface Gate {
  by: 'government' | 'industry' | 'public' | 'partners';
  why: string;
}

export interface Tech {
  id: string;
  name: string;
  branch: Branch;
  /** One or two sentences: what the technology is. */
  blurb: string;
  /** All of these must be researched first. Alternatives are separate techs with the same grant. */
  requires: string[];
  /** Empty for pure stepping stones. */
  gives: Grant[];
  costM: number;
  months: number;
  /** Chance of success 0..1. A failed project leaves the tech available to retry; its cost is lost. */
  chance: number;
  /** Already known at the start of the game. */
  start?: boolean;
  gate?: Gate;
}

/** Derived state of a tech for the current game. */
export type TechStatus =
  | 'researched'
  | 'running'
  | 'available'
  | 'blocked'
  | 'covered'
  | 'locked'
  | 'fog';

export interface TreeLayout {
  /** Node centre in tree units. */
  pos: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
  lanes: { branch: Branch; y: number; h: number }[];
  depth: Record<string, number>;
}
