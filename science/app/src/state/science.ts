import { useState } from 'preact/hooks';
import type { CombineResult, Discipline, ResearchTask, TaskStatus } from '../model/types';
import { MAX_BENCH, combine } from '../model/combine';
import { INITIAL_TASKS } from '../data/tasks';
import { GRAPH } from '../model/graph';

export type Screen = 'map' | 'draft';
export const ZOOMS = [
  { value: 0.36, label: 'Overview' },
  { value: 0.75, label: 'Map' },
  { value: 1.1, label: 'Detail' },
] as const;

/** All local UI state of the science station. Nothing here is shared with other stations yet. */
export function useScience() {
  const [screen, setScreen] = useState<Screen>('map');
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(ZOOMS[0].value);
  const [bench, setBench] = useState<string[]>([]);
  const [hidden, setHidden] = useState<Partial<Record<Discipline, boolean>>>({});
  const [result, setResult] = useState<CombineResult | null>(null);
  const [tasks, setTasks] = useState<ResearchTask[]>(INITIAL_TASKS);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  return {
    screen, selected, zoom, bench, hidden, result, tasks, activeTask,
    openDraft: () => setScreen('draft'),
    closeDraft: () => setScreen('map'),
    setZoom,
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
      if (r) setResult(r);
    },
    /** Pick a task, or toggle it off. Its linked fields are marked on the map and the first one is selected. */
    selectTask: (id: string | null) => {
      const next = id === activeTaskId ? null : id;
      setActiveTaskId(next);
      const t = tasks.find((x) => x.id === next);
      if (t) setSelected(t.fieldIds[0]);
    },
    setTaskStatus: (id: string, status: TaskStatus) =>
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t))),
  };
}

export type Science = ReturnType<typeof useScience>;
