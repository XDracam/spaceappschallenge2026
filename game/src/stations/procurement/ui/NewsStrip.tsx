// Bottom strip: shared news feed (s.events.news) + procurement status line.
import { fmtDate } from '../rules';
import { setUi, useNews, useUi } from './uiState';

const FROM: Record<string, string> = { planner: 'Planner', procurement: 'Procurement', science: 'Science', comms: 'Comms' };

export function NewsStrip() {
  const news = useNews(40);
  const open = useUi((u) => u.newsOpen);
  const status = useUi((u) => u.status);
  const latest = news.slice(0, 2);
  return (
    <footer class="pr-news">
      <button type="button" class="pr-news-toggle" aria-expanded={open} onClick={() => setUi({ newsOpen: !open })}>
        News <span class="pr-nav-count">{news.length || ''}</span>
      </button>
      <div class="pr-news-line">
        <span class="pr-status" role="status" aria-atomic="true">{status}</span>
        {latest.map((n) => (
          <span key={n.id} class="pr-news-item"><span class="pr-news-meta">{fmtDate(n.day)} · {FROM[n.from] ?? n.from}</span> {n.text}</span>
        ))}
        {!latest.length && !status ? <span class="muted">No news yet.</span> : null}
      </div>
      {open ? (
        <div class="pr-news-panel" role="log" aria-label="News">
          <div class="pr-news-panel-head"><h3>News</h3><button type="button" class="pr-text-btn" onClick={() => setUi({ newsOpen: false })}>Close</button></div>
          {news.map((n) => (
            <article key={n.id} class={`pr-news-card from-${n.from}`}>
              <span class="pr-news-meta">{fmtDate(n.day)} · {FROM[n.from] ?? n.from}{n.affects.includes('procurement') && n.from !== 'procurement' ? ' · for procurement' : ''}</span>
              <p>{n.text}</p>
            </article>
          ))}
          {!news.length ? <p class="muted">Deliveries, Calls and other stations' updates appear here.</p> : null}
        </div>
      ) : null}
    </footer>
  );
}
