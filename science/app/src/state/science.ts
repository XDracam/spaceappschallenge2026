import { useState } from 'preact/hooks';
import type { CombineResult, Discipline, LogEntry } from '../model/types';
import { MAX_BENCH, combine, resultLabel } from '../model/combine';
import { findRecipe } from '../data/recipes';
import { GRAPH } from '../model/graph';

export type Mode = 'inspect' | 'combine';
export type Screen = 'map' | 'draft';
export const ZOOMS = [
  { value: 0.36, label: 'Overview' },
  { value: 0.75, label: 'Map' },
  { value: 1.1, label: 'Detail' },
] as const;

const START_BENCH = ['a5', 'b1'];

function seededResult(): CombineResult {
  const recipe = findRecipe(START_BENCH)!;
  return { kind: 'recipe', names: START_BENCH.map((id) => GRAPH.byId[id].label).join(' + '), recipe };
}

const SEED_LOG: LogEntry[] = [
  { names: 'Methane variability + Biosignature gases', out: 'Project idea' },
  { names: 'Cloud microphysics + Dust storm dynamics', out: 'Textbook' },
  { names: 'Impact cratering + Radiometric surface dating', out: 'Textbook' },
];

/** All local UI state of the science station. Nothing here is shared with other stations yet. */
export function useScience() {
  const [screen, setScreen] = useState<Screen>('map');
  const [selected, setSelected] = useState('a5');
  const [mode, setMode] = useState<Mode>('combine');
  const [zoom, setZoom] = useState<number>(ZOOMS[0].value);
  const [bench, setBench] = useState<string[]>(START_BENCH);
  const [hidden, setHidden] = useState<Partial<Record<Discipline, boolean>>>({});
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<CombineResult | null>(seededResult);
  const [log, setLog] = useState<LogEntry[]>(SEED_LOG);

  const toggleBench = (id: string) => {
    if (GRAPH.byId[id].state === 'fog') return;
    setBench((b) => (b.includes(id) ? b.filter((x) => x !== id) : b.length < MAX_BENCH ? [...b, id] : b));
    setResult(null);
  };

  return {
    screen, selected, mode, zoom, bench, hidden, search, result, log,
    openDraft: () => setScreen('draft'),
    closeDraft: () => setScreen('map'),
    setMode, setZoom, setSearch,
    toggleDiscipline: (d: Discipline) => setHidden((h) => ({ ...h, [d]: !h[d] })),
    select: setSelected,
    /** In Combine mode a click also puts the field on the bench. */
    pickNode: (id: string) => {
      setSelected(id);
      if (mode === 'combine') toggleBench(id);
    },
    toggleBench,
    clearBench: () => { setBench([]); setResult(null); },
    runCombine: () => {
      const r = combine(bench);
      if (!r) return;
      setResult(r);
      setLog((l) => [{ names: r.names, out: resultLabel(r) }, ...l.filter((e) => e.names !== r.names)].slice(0, 6));
    },
  };
}

export type Science = ReturnType<typeof useScience>;
