import { useEffect, useMemo, useRef } from 'preact/hooks';
import { MapCanvas } from '../map/MapCanvas';
import { getState } from '../../../core/store';
import { actions, getPlanner, stepPlaythrough, uiStore, usePlanner, useUi } from '../state/store';
import { BODIES } from '../data/bodies';
import { computeMissionResult } from '../result';
import { TopBar } from './TopBar';
import { BottomStrip, GoalDialogHost } from './BottomStrip';
import { RocketTab } from './RocketTab';
import { VersionsTab } from './VersionsTab';
import { PopupLayer } from './Popups';
import { backToEdit } from './Heatmap';
import { PlaythroughOverlay } from './Playthrough';
import { Briefing } from './Briefing';
import { NextStep } from './NextStep';
import { useAdvanced } from './advanced';
import {
  CARDS_H, CloseIcon, EDGE, HEADER_H, PANEL_W, PLAYBACK_W, closePopup, localUi, setMapContainer, useLocalUi,
} from './common';

/**
 * After launch (shared phase 'launched'), show the playthrough of the shared
 * mission result. The animation is UI-local; the result is deterministic, so
 * every station sees the same outcome.
 */
function syncPlaythrough(launched: boolean) {
  const has = !!uiStore.get().playthrough;
  if (launched && !has) actions.startPlaythrough(computeMissionResult(getState()));
  else if (!launched && has) uiStore.update((u) => { u.playthrough = null; });
}

const TAB_TITLE = { rocket: 'Rocket', versions: 'Versions' } as const;

export function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const panelOpen = useLocalUi((s) => s.panelOpen);
  const hasPlayback = useUi((u) => !!u.playthrough);
  const playbackRunning = useUi((u) => !!u.playthrough?.playing && !u.playthrough.finished);
  const launched = usePlanner((g) => g.phase === 'launched');

  useEffect(() => syncPlaythrough(launched), [launched]);

  // Map opens on the mission's arena: Earth's system when every goal is there, else the solar system.
  const missionId = usePlanner((g) => g.mission.id);
  useEffect(() => {
    const goals = getPlanner().mission.goals;
    const nearEarth = goals.length > 0 && goals.every((g) => g.body === 'earth' || BODIES[g.body].parent === 'earth');
    uiStore.update((u) => { u.viewCenter = nearEarth ? 'earth' : 'sun'; });
  }, [missionId]);

  // Playthrough animation clock (the agency calendar itself is host-driven, core/clock.ts).
  useEffect(() => {
    if (!playbackRunning) return;
    let raf = 0;
    let last = 0;
    const frame = (t: number) => {
      const dt = last ? Math.min(0.25, (t - last) / 1000) : 0;
      last = t;
      stepPlaythrough(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playbackRunning]);

  useEffect(() => {
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

  // The playthrough needs the map: close the side panel when it starts.
  useEffect(() => {
    if (hasPlayback) localUi.update((s) => { s.panelOpen = false; });
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
        <PlaythroughOverlay />
        <PopupLayer />
        <Briefing />
        <GoalDialogHost />
      </div>
    </div>
  );
}

function SidePanel() {
  const tab = useUi((u) => u.sideTab);
  const open = useLocalUi((s) => s.panelOpen);
  const phase = usePlanner((g) => g.phase);
  const locked = phase !== 'planning';
  // Versions only while the Advanced switch is on.
  const advanced = useAdvanced();
  const shown = tab === 'versions' && advanced ? 'versions' : 'rocket';
  return (
    <aside id="planner-side-panel" class={`side glass${open ? '' : ' closed'}`} aria-hidden={!open}>
      <div class="side-head">
        <h2 class="panel-title">{TAB_TITLE[shown]}</h2>
        <button class="round-btn small" title="Close panel" aria-label="Close Rocket or Versions panel" onClick={() => localUi.update((s) => { s.panelOpen = false; })}>
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
