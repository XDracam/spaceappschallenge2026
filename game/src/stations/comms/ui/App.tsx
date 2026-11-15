// Communications station screen, layout A (inbox-centred). See communications/README.md.

import { useEffect } from 'preact/hooks';
import { actions, useComms, useLaunched, useUi } from './store';
import { openByUrgency } from './common';
import { Conversation } from './Conversation';
import { DevDrawer } from './DevDrawer';
import { Header } from './Header';
import { Inbox } from './Inbox';
import { NewsFeed } from './NewsFeed';
import { Briefing, LaunchedCard } from './Overlays';
import { ProjectPicker, Projects } from './Projects';
import { TrustBar } from './TrustBar';

export function App() {
  const inbox = useComms((s) => s.inbox);
  const launched = useLaunched();
  const selected = useUi((u) => u.selectedInstanceId);
  const launchCardClosed = useUi((u) => u.launchCardClosed);

  // Auto-select the most urgent open event when nothing (valid) is selected.
  useEffect(() => {
    if (selected && inbox.some((i) => i.instanceId === selected)) return;
    const next = openByUrgency(inbox)[0];
    if (next || selected) actions.select(next ? next.instanceId : null);
  }, [inbox, selected]);

  return (
    <div class="screen">
      <Header />
      <TrustBar />
      <Inbox />
      <Conversation />
      <Projects />
      <NewsFeed />
      <ProjectPicker />
      {launched && !launchCardClosed && <LaunchedCard />}
      {import.meta.env.DEV && <DevDrawer />}
      <Briefing />
    </div>
  );
}
