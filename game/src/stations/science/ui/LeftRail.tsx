import type { Science } from '../state/science';
import { TaskPanel } from './TaskPanel';
import { NewsFeed } from './NewsFeed';

export function LeftRail({ s }: { s: Science }) {
  return (
    <aside class="rail glass">
      <div class="rail-scroll thin-scroll">
        <TaskPanel s={s} />
      </div>
      <div class="rail-news thin-scroll">
        <NewsFeed />
      </div>
    </aside>
  );
}
