// procurement station root view (rendered inside <div class="st-procurement">).
// Port of procurement/mockups/catalogue-full-hd.html adapted to the shared state
// and a ~1440×900 screen: needs | catalogue (or Contracts) | decision panel.
import { ArtDefs } from './ui/Art';
import { Header } from './ui/Header';
import { Needs } from './ui/Needs';
import { Catalogue } from './ui/Catalogue';
import { Inspector } from './ui/Inspector';
import { ContractsView } from './ui/ContractsView';
import { ResearchSupport } from './ui/ResearchSupport';
import { Dialog } from './ui/Dialog';
import { NewsStrip } from './ui/NewsStrip';
import { PCtx, usePView, useUi } from './ui/uiState';

export function ProcurementStation() {
  const v = usePView();
  const view = useUi((u) => u.view);
  const contractsOpen = view === 'contracts';
  const contractId = useUi(u => u.contractId);
  const researchOpen = view === 'research';
  const showInspector = !researchOpen && (!contractsOpen || v.market.contracts.some(k => k.id === contractId));
  return (
    <PCtx.Provider value={v}>
      <div class="pr-app">
        <ArtDefs />
        <Header />
        <div class={`pr-work${contractsOpen || researchOpen ? ' pr-work-contracts' : ''}${!showInspector ? ' pr-work-contracts-unselected' : ''}`}>
          {!contractsOpen && !researchOpen ? <Needs /> : null}
          {researchOpen ? <ResearchSupport /> : contractsOpen ? <ContractsView /> : <Catalogue />}
          {showInspector ? <Inspector /> : null}
        </div>
        <NewsStrip />
        <Dialog />
      </div>
    </PCtx.Provider>
  );
}
