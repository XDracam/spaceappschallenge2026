// Shell: lobby until this browser sits at a station, then that station's view.
// Each station renders inside <div class="st-<id>"> and must scope its CSS to it.
import { useEffect, useState } from 'preact/hooks';
import { coreActions, attemptRecorded, missionEnded } from '../core/coreActions';
import { clearSaved, downloadSavedRecord, persistenceStatus, retrySave, saveLoadIssue } from '../core/persist';
import { computeMissionResult, missionScore } from '../stations/planner/result';
import { getState, syncStore, useGame } from '../core/store';
import { requestConfirmation } from '../shared/confirmation';
import { Component, type ComponentChildren } from 'preact';
import { lazy, Suspense } from 'preact/compat';
import { useSync } from '../core/store';
import { Lobby } from './Lobby';
import { ResultOverlay } from './ResultOverlay';
import { StationSwitcher } from './StationSwitcher';
import { TaskBoard } from './TaskBoard';
import { ConfirmationPanel } from './ConfirmationPanel';
import { useStore } from '../core/createStore';
import { SoundSettings } from '../audio/SoundSettings';

const VIEWS = {
  planner: lazy(() => import('../stations/planner/Station').then(module => module.PlannerStation)),
  procurement: lazy(() => import('../stations/procurement/Station').then(module => module.ProcurementStation)),
  science: lazy(() => import('../stations/science/Station').then(module => module.ScienceStation)),
  comms: lazy(() => import('../stations/comms/Station').then(module => module.CommsStation)),
};

export function App() {
  const station = useSync(s => s.station);
  return <>
    <div class="shell-stage shell-with-audio">
      <div class="shell-play-area"><GameView /><SaveStatus /></div>
      <footer class="shell-footer">
        <div class="shell-footer-station">{station && <StationSwitcher />}</div>
        <div class="shell-footer-actions">
          <SoundSettings />
          {station && <TaskBoard key={station} />}
        </div>
      </footer>
      <AttemptRecorder />
    </div>
    <ConfirmationPanel />
  </>;
}

function GameView() {
  const station = useSync((s) => s.station);
  const attempt = useGame((s) => `${s.meta.missionId}|${s.meta.attempt}|${s.meta.seed}`);
  if (!station) return <Lobby />;
  const View = VIEWS[station];
  return (
    <div class={`st-root st-${station}`}>
      <StationLoadBoundary key={station}>
        <Suspense fallback={<div class="shell-load-state" role="status">Loading station…</div>}><View /></Suspense>
      </StationLoadBoundary>
      {/* The planner shows its own animated playthrough and result card. */}
      {station !== 'planner' && <ResultOverlay key={attempt} />}
    </div>
  );
}

class StationLoadBoundary extends Component<{ children: ComponentChildren }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section class="shell-load-state" role="alert">
      <h2>This station could not open</h2>
      <p>Reload to retry. If you are hosting, check the local save status before reloading; guests can rejoin the host.</p>
      <button class="shell-btn" onClick={() => location.reload()}>Reload page</button>
    </section>;
  }
}

/** Record the host's deterministic result even when its station card is dismissed. */
function AttemptRecorder() {
  const role = useSync(s => s.role);
  const state = useGame(s => s);
  useEffect(() => {
    const current = getState();
    if (role !== 'client' && missionEnded(current) && !attemptRecorded(current)) {
      coreActions.recordAttempt(missionScore(computeMissionResult(current)));
    }
  }, [role, state]);
  return null;
}

function SaveStatus() {
  const role = useSync(s => s.role);
  const connected = useSync(s => s.connected);
  const syncError = useSync(s => s.error);
  const status = useStore(persistenceStatus, s => s);
  const loadIssue = useStore(saveLoadIssue, value => value);
  const [downloadStatus, setDownloadStatus] = useState('');
  if (loadIssue) return <aside class="shell-save-warning" role="status">
    <span>{loadIssue}</span>
    <button class="shell-btn" onClick={() => setDownloadStatus(downloadSavedRecord() ? 'Save download requested.' : 'The save could not be downloaded. Check browser storage access before resetting.')}>Download saved record</button>
    <button class="shell-btn" onClick={async () => {
      if (await requestConfirmation('Reset the unreadable local save? Download a copy first if you want to keep it. Reset removes only this game’s saved record from this browser.', 'Reset saved game')) clearSaved();
    }}>Reset saved game…</button>
    {downloadStatus && <span>{downloadStatus}</span>}
  </aside>;
  if (syncError && (role !== 'client' || connected)) return <aside class="shell-save-warning" role="status">
    <span>{syncError}</span>
    <button class="shell-btn" onClick={() => syncStore.update(state => { state.error = null; })}>Dismiss</button>
  </aside>;
  if (role !== 'host' || status !== 'failed') return null;
  return <aside class="shell-save-warning" role="status">
    <span>Local save failed. Keep this tab open; reload may lose progress.</span>
    <button class="shell-btn" onClick={retrySave}>Retry save</button>
  </aside>;
}
