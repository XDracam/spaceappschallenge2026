import { useEffect, useMemo, useRef } from 'preact/hooks';
import { MapCanvas } from '../map/MapCanvas';
import { gameStore, getEvaluation, uiStore, useGame, useUi } from '../state/store';
import { playthrough } from '../physics';
import { TopBar } from './TopBar';
import { BottomStrip } from './BottomStrip';
import { RocketTab } from './RocketTab';
import { VersionsTab } from './VersionsTab';
import { DevTab } from './DevTab';
import { PopupLayer } from './Popups';
import { backToEdit } from './Heatmap';
import { PlaythroughOverlay } from './Playthrough';
import { Briefing } from './Briefing';
import { NextStep } from './NextStep';
import {
  CARDS_H, CloseIcon, EDGE, HEADER_H, PANEL_W, PLAYBACK_W, closePopup, localUi, setMapContainer, useLocalUi,
} from './common';

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

const TAB_TITLE = { rocket: 'Rocket', versions: 'Versions' } as const;

export function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  // The side panel and the Dev drawer occupy the same right-hand column.
  const panelOpen = useLocalUi((s) => s.panelOpen || s.devOpen);
  const hasPlayback = useUi((u) => !!u.playthrough);

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

  // The playthrough needs the map: close the side panel and the dev drawer when it starts.
  useEffect(() => {
    if (hasPlayback) localUi.update((s) => { s.panelOpen = false; s.devOpen = false; });
  }, [hasPlayback]);

  const insets = useMemo(() => ({
    top: HEADER_H,
    right: panelOpen ? PANEL_W + EDGE * 2 : 0,
    bottom: CARDS_H + EDGE * 2,
    left: hasPlayback ? PLAYBACK_W + EDGE * 2 : 0,
  }), [panelOpen, hasPlayback]);
  useEffect(() => {
    localUi.update((s) => { s.insets = insets; });
  }, [insets.top, insets.right, insets.bottom, insets.left]);

  return (
    <div class={`app${panelOpen ? ' panel-open' : ''}`}>
      <div class="map-area" ref={mapRef}>
        <div class="map-host"><MapCanvas insets={insets} /></div>
        <div class="map-vignette" />
        <NextStep />
        <TopBar />
        <SidePanel />
        <BottomStrip />
        <DevDrawer />
        <PlaythroughOverlay />
        <PopupLayer />
        <Briefing />
      </div>
    </div>
  );
}

function SidePanel() {
  const tab = useUi((u) => u.sideTab);
  const open = useLocalUi((s) => s.panelOpen);
  const phase = useGame((g) => g.phase);
  const locked = phase !== 'planning';
  // No Procurement panel on the planner station (D-006); 'tasks' and 'dev' fall back to Rocket.
  const shown = tab === 'versions' ? 'versions' : 'rocket';
  return (
    <aside class={`side glass${open ? '' : ' closed'}`} aria-hidden={!open}>
      <div class="side-head">
        <h2 class="panel-title">{TAB_TITLE[shown]}</h2>
        <button class="round-btn small" title="Close panel" onClick={() => localUi.update((s) => { s.panelOpen = false; })}>
          <CloseIcon />
        </button>
      </div>
      {locked && <div class="locked-banner">Planning is closed: the mission has launched.</div>}
      <div class="side-body thin-scroll">
        <fieldset class="plain" disabled={locked}>
          {shown === 'rocket' && <RocketTab />}
          {shown === 'versions' && <VersionsTab />}
        </fieldset>
      </div>
    </aside>
  );
}

function DevDrawer() {
  const open = useLocalUi((s) => s.devOpen);
  return (
    <aside class={`dev-drawer glass strong${open ? ' open' : ''}`} aria-hidden={!open}>
      <div class="side-head">
        <div>
          <h2 class="panel-title">Dev controls</h2>
          <div class="muted tiny">Stand-in for procurement, science, comms</div>
        </div>
        <button class="round-btn small" title="Close dev controls" onClick={() => localUi.update((s) => { s.devOpen = false; })}>
          <CloseIcon />
        </button>
      </div>
      <div class="side-body thin-scroll">{open && <DevTab />}</div>
    </aside>
  );
}
