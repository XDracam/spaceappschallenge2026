// Shell: lobby until this browser sits at a station, then that station's view.
// Each station renders inside <div class="st-<id>"> and must scope its CSS to it.
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

const VIEWS: Record<StationId, ComponentType> = {
  planner: PlannerStation,
  procurement: ProcurementStation,
  science: ScienceStation,
  comms: CommsStation,
};

export function App() {
  const confirmation = useStore(confirmationStore, value => value);
  return <>
    <div class="shell-stage" inert={confirmation ? true : undefined}><GameView /></div>
    <ConfirmationPanel />
  </>;
}

function GameView() {
  const station = useSync((s) => s.station);
  if (!station) return <Lobby />;
  const View = VIEWS[station];
  return (
    <div class={`st-root st-${station}`}>
      <View />
      {/* The planner shows its own animated playthrough and result card. */}
      {station !== 'planner' && <ResultOverlay />}
      <StationSwitcher />
      <TaskBoard key={station} />
    </div>
  );
}
