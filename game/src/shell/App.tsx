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

const VIEWS: Record<StationId, ComponentType> = {
  planner: PlannerStation,
  procurement: ProcurementStation,
  science: ScienceStation,
  comms: CommsStation,
};

export function App() {
  const station = useSync((s) => s.station);
  if (!station) return <Lobby />;
  const View = VIEWS[station];
  return (
    <div class={`st-root st-${station}`}>
      <View />
      {/* The planner shows its own animated playthrough and result card. */}
      {station !== 'planner' && <ResultOverlay />}
      <StationSwitcher />
    </div>
  );
}
