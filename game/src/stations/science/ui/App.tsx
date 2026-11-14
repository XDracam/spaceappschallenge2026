import { useEffect } from 'preact/hooks';
import { useScience } from '../state/science';
import { TopBar } from './TopBar';
import { LeftRail } from './LeftRail';
import { FieldMap } from './FieldMap';
import { Inspector } from './Inspector';
import { Bench } from './Bench';
import { LabPanel } from './LabPanel';
import { DraftProject } from './DraftProject';

export function App() {
  const s = useScience();
  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(s.dismissToast, 4000);
    return () => clearTimeout(t);
  }, [s.toast]);

  if (s.screen === 'draft' && s.result && s.result.kind !== 'known') return <DraftProject s={s} />;
  return (
    <div class="sci-app">
      <TopBar s={s} />
      <div class="sci-body">
        <LeftRail s={s} />
        <FieldMap s={s} />
        <Inspector s={s} />
      </div>
      <div class="sci-bottom">
        <Bench s={s} />
        <LabPanel s={s} />
      </div>
      {s.toast && <div class="toast" role="status">{s.toast}</div>}
    </div>
  );
}
