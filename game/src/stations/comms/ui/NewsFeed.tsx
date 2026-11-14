import type { NewsItem } from '../model/types';
import { useGame } from '../../../core/store';
import { START_ISO } from './store';
import { STATION_LABEL } from './common';
import { formatDay } from './format';

/** Bottom strip: shared news feed, newest first; hover expands the full list. */
export function NewsFeed() {
  const news = useGame((s) => s.events.news);
  const startISO = START_ISO;
  const items = [...news].sort((a, b) => b.day - a.day);
  return (
    <section class="news glass" tabIndex={0}>
      <span class="label news-label">News</span>
      <div class="news-strip">
        {items.length === 0 && <span class="muted">No news yet. Outcomes that affect the team appear here for every station.</span>}
        {items.slice(0, 12).map((n) => <NewsLine key={n.id} n={n} />)}
      </div>
      {items.length > 0 && (
        <div class="news-full glass strong thin-scroll">
          <div class="label">All news · {items.length}</div>
          {items.map((n) => (
            <div key={n.id} class={`news-row${n.internal ? ' internal' : ''}`}>
              <span class="news-date muted num">{formatDay(n.day, startISO)}</span>
              <span class={`stn stn-${n.from}`}>{STATION_LABEL[n.from]}</span>
              <span class="news-text">{n.text}</span>
              {n.internal && n.affects.length > 0 && (
                <span class="news-affects muted tiny">→ {n.affects.map((s) => STATION_LABEL[s]).join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NewsLine({ n }: { n: NewsItem }) {
  return (
    <span class={`news-item${n.internal ? ' internal' : ''}`}>
      <span class={`stn stn-${n.from}`}>{STATION_LABEL[n.from]}</span>
      <span class="news-text">{n.text}</span>
    </span>
  );
}
