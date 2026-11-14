import { useScience } from '../state/science';
import { TopBar } from './TopBar';
import { LeftRail } from './LeftRail';
import { FieldMap } from './FieldMap';
import { Inspector } from './Inspector';
import { Bench } from './Bench';
import { DraftProject } from './DraftProject';

export function App() {
  const s = useScience();
  if (s.screen === 'draft' && s.result) {
    return <DraftProject result={s.result} bench={s.bench} onBack={s.closeDraft} />;
  }
  return (
    <div class="app">
      <TopBar />
      <div class="body">
        <LeftRail s={s} />
        <FieldMap s={s} />
        <Inspector s={s} />
      </div>
      <Bench s={s} />
    </div>
  );
}
