import { useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import { formatDate } from '../model/research';

const FROM: Record<string, string> = { planner: 'Planning', procurement: 'Procurement', science: 'Science', comms: 'Comms' };

/** Shared agency news (events.news), newest first. Small by default. */
export function NewsFeed() {
  const news = useGame((g) => g.events.news);
  const [all, setAll] = useState(false);
  const shown = all ? news.slice(0, 40) : news.slice(0, 4);
  return (
    <div class="stack-6 news">
      <div class="row baseline">
        <h2 class="eyebrow">Agency news</h2>
        <span class="grow" />
        {news.length > 4 && <button class="text-btn" onClick={() => setAll(!all)}>{all ? 'Less' : `All ${news.length}`}</button>}
      </div>
      {news.length === 0 && <div class="small muted">Quiet so far.</div>}
      {shown.map((n) => (
        <div key={n.id} class={'news-item from-' + n.from}>
          <div class="tiny muted">{formatDate(n.day)} · {FROM[n.from] ?? n.from}</div>
          <div class="small soft">{n.text}</div>
        </div>
      ))}
    </div>
  );
}
