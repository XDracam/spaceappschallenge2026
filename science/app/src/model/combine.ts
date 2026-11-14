import type { CombineResult } from './types';
import { GRAPH } from './graph';
import { findRecipe } from '../data/recipes';

export const MAX_BENCH = 3;

export function combine(ids: readonly string[]): CombineResult | null {
  if (ids.length < 2) return null;
  const names = ids.map((id) => GRAPH.byId[id].label).join(' + ');
  const recipe = findRecipe(ids);
  if (recipe) return { kind: 'recipe', names, recipe };
  // Two established fields are textbook territory. Anything touching a frontier or hinted field is a long shot.
  if (ids.every((id) => GRAPH.byId[id].state === 'est')) return { kind: 'known', names };
  return { kind: 'none', names };
}
