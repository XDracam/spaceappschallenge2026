// Shell: lobby until this browser sits at a station, then that station's view.
// Each station renders inside <div class="st-<id>"> and must scope its CSS to it.
import { useEffect } from 'preact/hooks';
import { coreActions, attemptRecorded, missionEnded } from '../core/coreActions';
import { persistenceStatus, retrySave } from '../core/persist';
import { computeMissionResult, missionScore } from '../stations/planner/result';
import { getState, useGame } from '../core/store';
import type { ComponentType } from 'preact';
import type { StationId } from '../core/model';
import { useSync } from '../core/store';
import { PlannerStation } from '../stations/planner/Station';
import { ProcurementStation } from '../stations/procurement/Station';
import { ScienceStation } from '../stations/science/Station';
import { CommsStation } from '../stations/comms/Station';
import { Lobby } from './Lobby';
import { ResultOverlay } from './ResultOverlay';
import { StationSwitcher } from './StationSwitcher';
import { TaskBoard } from './TaskBoard';
import { ConfirmationPanel } from './ConfirmationPanel';
import { confirmationStore } from '../shared/confirmation';
import { useStore } from '../core/createStore';
import { SoundSettings } from '../audio/SoundSettings';

const VIEWS: Record<StationId, ComponentType> = {
  planner: PlannerStation,
  procurement: ProcurementStation,
  science: ScienceStation,
  comms: CommsStation,
};

export function App() {
  const confirmation = useStore(confirmationStore, value => value);
  const station = useSync(s => s.station);
  return <>
    <div class="shell-stage shell-with-audio" inert={confirmation ? true : undefined}>
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
      <View />
      {/* The planner shows its own animated playthrough and result card. */}
      {station !== 'planner' && <ResultOverlay key={attempt} />}
    </div>
  );
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
  const status = useStore(persistenceStatus, s => s);
  if (role !== 'host' || status !== 'failed') return null;
  return <aside class="shell-save-warning" role="status">
    <span>Local save failed. Keep this tab open; reload may lose progress.</span>
    <button class="shell-btn" onClick={retrySave}>Retry save</button>
  </aside>;
}
