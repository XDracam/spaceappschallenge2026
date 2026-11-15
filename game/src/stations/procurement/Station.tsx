// procurement station root view (rendered inside <div class="st-procurement">).
// Port of procurement/mockups/catalogue-full-hd.html adapted to the shared state
// and a ~1440×900 screen: needs | catalogue (or Calls / Contracts / Compare) | decision panel.
import './procurement.css';
import { ArtDefs } from './ui/Art';
import { Header } from './ui/Header';
import { Needs } from './ui/Needs';
import { Catalogue } from './ui/Catalogue';
import { Inspector } from './ui/Inspector';
import { CallsView } from './ui/CallsView';
import { ContractsView } from './ui/ContractsView';
import { CompareView } from './ui/CompareView';
import { Dialog } from './ui/Dialog';
import { NewsStrip } from './ui/NewsStrip';
import { PCtx, usePView, useUi } from './ui/uiState';

export function ProcurementStation() {
  const v = usePView();
  const view = useUi((u) => u.view);
  const contractView = useUi((u) => u.contractView);
  const wideTimeline = view === 'contracts' && contractView === 'timeline';
  const contractId = useUi(u => u.contractId);
  const showInspector = !wideTimeline || !!contractId;
  return (
    <PCtx.Provider value={v}>
      <div class="pr-app">
        <ArtDefs />
        <Header />
        <div class={`pr-work${wideTimeline ? ' pr-work-timeline' : ''}${!showInspector ? ' pr-work-timeline-unselected' : ''}`}>
          {!wideTimeline ? <Needs /> : null}
          {view === 'calls' ? <CallsView /> : view === 'contracts' ? <ContractsView /> : view === 'compare' ? <CompareView /> : <Catalogue />}
          {showInspector ? <Inspector /> : null}
        </div>
        <NewsStrip />
        <Dialog />
      </div>
    </PCtx.Provider>
  );
}
