import { useEffect, useRef } from 'preact/hooks';
import { MapCanvas } from '../map/MapCanvas';
import type { SideTab } from '../state/store';
import { gameStore, getEvaluation, uiStore, useGame, useUi } from '../state/store';
import { playthrough } from '../physics';
import { TopBar } from './TopBar';
import { BottomStrip } from './BottomStrip';
import { RocketTab } from './RocketTab';
import { TasksTab } from './TasksTab';
import { VersionsTab } from './VersionsTab';
import { DevTab } from './DevTab';
import { PopupLayer } from './Popups';
import { backToEdit } from './Heatmap';
import { PlaythroughOverlay } from './Playthrough';
import { closePopup, setMapContainer } from './common';

const TABS: { id: SideTab; label: string }[] = [
  { id: 'rocket', label: 'Rocket' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'versions', label: 'Versions' },
  { id: 'dev', label: 'Dev' },
];

/** The UI store is not persisted: after a reload mid-playthrough, rebuild the (seeded, deterministic) playthrough. */
function restorePlaythrough() {
  const g = gameStore.get();
  if (g.phase === 'planning' || uiStore.get().playthrough) return;
  const result = playthrough(g, getEvaluation(), g.playthroughSeed);
  const finished = g.phase === 'finished';
  uiStore.update((u) => {
    u.popup = null;
    u.playthrough = { result, day: finished ? result.endDay : g.plan.launchDay, playing: !finished, daysPerSecond: 60 };
  });
}

export function App() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    restorePlaythrough();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const p = uiStore.get().popup;
      if (!p) return;
      if (p.kind === 'heatmap') backToEdit(p.maneuverId);
      else closePopup();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMapContainer(mapRef.current);
    return () => setMapContainer(null);
  }, []);

  return (
    <div class="app">
      <TopBar />
      <div class="main">
        <div class="left">
          <div class="map-area" ref={mapRef}>
            <div class="map-host"><MapCanvas /></div>
            <PopupLayer />
            <PlaythroughOverlay />
          </div>
          <BottomStrip />
        </div>
        <SidePanel />
      </div>
    </div>
  );
}

function SidePanel() {
  const tab = useUi((u) => u.sideTab);
  const phase = useGame((g) => g.phase);
  const taskCount = useGame((g) => g.tasks.filter((t) => t.status === 'open' || t.status === 'changed').length);
  const versionCount = useGame((g) => g.versions.length);
  const locked = phase !== 'planning';
  return (
    <aside class="side">
      <nav class="tabs">
        {TABS.map((t) => (
          <button key={t.id} class={`tab${tab === t.id ? ' active' : ''}${t.id === 'dev' ? ' dev' : ''}`}
            onClick={() => uiStore.update((u) => { u.sideTab = t.id; })}>
            {t.label}
            {t.id === 'tasks' && taskCount > 0 && <span class="count">{taskCount}</span>}
            {t.id === 'versions' && versionCount > 0 && <span class="count muted">{versionCount}</span>}
          </button>
        ))}
      </nav>
      {locked && <div class="locked-banner">Planning is closed: the mission has launched.</div>}
      <div class="side-body">
        {tab === 'dev' ? (
          <DevTab />
        ) : (
          <fieldset class="plain" disabled={locked}>
            {tab === 'rocket' && <RocketTab />}
            {tab === 'tasks' && <TasksTab />}
            {tab === 'versions' && <VersionsTab />}
          </fieldset>
        )}
      </div>
    </aside>
  );
}
