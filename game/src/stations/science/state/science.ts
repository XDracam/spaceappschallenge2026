import { useMemo, useState } from 'preact/hooks';
import type { CombineResult, Discipline } from '../model/types';
import { MAX_BENCH, combine } from '../model/combine';
import { GRAPH } from '../model/graph';
import { useGame } from '../../../core/store';
import { scienceActions } from '../logic';
import { findRecipe, recipeKey, recipesFor } from '../data/recipes';
import { keyCovered, plannerRequests } from '../model/research';

export type Screen = 'map' | 'draft';
export type LabTab = 'running' | 'results';
export const ZOOMS = [
  { value: 0.36, label: 'Overview' },
  { value: 0.75, label: 'Map' },
  { value: 1.1, label: 'Detail' },
] as const;

/**
 * Local UI state of the science station (selection, zoom, bench, screen…). Shared game
 * state is read with useGame() and changed only through scienceActions.
 */
export function useScience() {
  const [screen, setScreen] = useState<Screen>('map');
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(ZOOMS[0].value);
  const [bench, setBench] = useState<string[]>([]);
  const [hidden, setHidden] = useState<Partial<Record<Discipline, boolean>>>({});
  const [result, setResult] = useState<CombineResult | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [labTab, setLabTab] = useState<LabTab>('running');
  const [toast, setToast] = useState<string | null>(null);

  const tasks = useGame((s) => s.market.tasks);
  const research = useGame((s) => s.research);
  const requests = useMemo(() => plannerRequests(tasks), [tasks]);
  const activeTask = requests.find((t) => t.id === activeTaskId) ?? null;

  /** Fields of the recipes that can answer the active request's open keys (marked on the map). */
  const relatedFields = useMemo(() => {
    const out = new Set<string>();
    if (!activeTask) return out;
    const open = activeTask.beyondResearch.filter((k) => !keyCovered(research, activeTask, k));
    for (const k of open.length ? open : activeTask.beyondResearch) for (const r of recipesFor(k)) r.ids.forEach((id) => out.add(id));
    return out;
  }, [activeTask, research]);

  const setBenchTo = (ids: string[]) => {
    setBench(ids);
    const r = combine(ids);
    setResult(r);
    return r;
  };

  return {
    screen, selected, zoom, bench, hidden, result, requests, activeTask, relatedFields, labTab, toast,
    openDraft: () => setScreen('draft'),
    closeDraft: () => setScreen('map'),
    setZoom,
    setLabTab,
    dismissToast: () => setToast(null),
    toggleDiscipline: (d: Discipline) => setHidden((h) => ({ ...h, [d]: !h[d] })),
    /** Passing null clears the selection, for example after a click on empty map. */
    select: setSelected,
    /** The bench changes only through an explicit click on its buttons, never by selecting a field. */
    addToBench: (id: string) => {
      if (GRAPH.byId[id].state === 'fog') return;
      setBench((b) => (b.includes(id) || b.length >= MAX_BENCH ? b : [...b, id]));
      setResult(null);
    },
    removeFromBench: (id: string) => { setBench((b) => b.filter((x) => x !== id)); setResult(null); },
    clearBench: () => { setBench([]); setResult(null); },
    runCombine: () => {
      const r = combine(bench);
      if (!r) return;
      setResult(r);
      if (r.kind === 'recipe') scienceActions.discover(recipeKey(bench));
    },
    /** Put a known idea's fields on the bench and open its draft. */
    draftIdea: (key: string) => {
      const ids = key.split('+');
      if (!findRecipe(ids)) return;
      setBenchTo(ids);
      setScreen('draft');
    },
    /** After a project started: back to the map with an empty bench. */
    projectStarted: (title: string) => {
      setBench([]);
      setResult(null);
      setScreen('map');
      setLabTab('running');
      setToast(`Project started: ${title}`);
    },
    /** Pick a request, or toggle it off. Its related fields are marked on the map. */
    selectTask: (id: string | null) => {
      const next = id === activeTaskId ? null : id;
      setActiveTaskId(next);
    },
  };
}

export type Science = ReturnType<typeof useScience>;
