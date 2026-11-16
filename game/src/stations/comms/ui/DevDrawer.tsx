import { useEffect, useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import { commsActions } from '../logic';
import { uiStore, useComms, useContent, useStartISO, useUi } from './store';
import { CloseIcon, STATION_LABEL } from './common';
import { formatDay, formatMoney } from './format';

/** Slide-over from the right: debug tools (fire an event; inspect shared flags, comms offers, news). */
export function DevDrawer() {
  const open = useUi((u) => u.devOpen);
  const close = () => uiStore.update((u) => { u.devOpen = false; });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <aside class={`dev-drawer glass strong${open ? ' open' : ''}`} aria-hidden={!open}>
      <div class="dev-head">
        <div class="dev-title">Dev tools<div class="muted tiny">debugging the shared game state</div></div>
        <button class="round-btn small" title="Close (Esc)" aria-label="Close developer tools" onClick={close}><CloseIcon /></button>
      </div>
      {open && (
        <div class="dev-body thin-scroll">
          <FireSection />
          <StatusSection />
          <FlagsSection />
          <OffersSection />
          <NewsSection />
        </div>
      )}
    </aside>
  );
}

function FireSection() {
  const [id, setId] = useState('');
  const fired = useComms((c) => c.fired);
  const events = useContent().events;
  return (
    <section>
      <h4>Fire event</h4>
      <div class="inline">
        <select value={id} onChange={(e) => setId((e.target as HTMLSelectElement).value)} disabled={!events.length} style={{ flex: 1 }}>
          <option value="">{events.length ? 'Choose an event…' : 'No events authored yet'}</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{fired.includes(ev.id) ? '✓ ' : ''}{ev.title} ({ev.source})</option>
          ))}
        </select>
        <button class="btn" disabled={!id} onClick={() => commsActions.devFireEvent(id)}>Fire</button>
      </div>
    </section>
  );
}

function StatusSection() {
  const nextPoolDay = useComms((c) => c.nextPoolDay);
  const modifiers = useComms((c) => c.modifiers);
  const budget = useGame((s) => s.budget);
  const startISO = useStartISO();
  return (
    <section>
      <h4>Comms state</h4>
      <div class="muted small">Next pool draw: {formatDay(nextPoolDay, startISO)}</div>
      <div class="muted small">
        Budget: funding {formatMoney(budget.fundingTotalM)} · spent {formatMoney(budget.spentM)} · committed {formatMoney(budget.committedM)}
      </div>
      {modifiers.map((m, i) => (
        <div key={i} class="muted small">
          {m.effect.kind === 'eventOdds' ? `“${m.effect.tag}” ×${m.effect.factor}` : m.effect.kind} until {formatDay(m.untilDay, startISO)}
        </div>
      ))}
    </section>
  );
}

function FlagsSection() {
  const flags = useGame((s) => s.events.flags);
  return (
    <section>
      <h4>Shared flags</h4>
      {flags.length === 0 && <div class="muted small">No flags raised.</div>}
      <div class="inline wrap">{flags.map((f) => <code key={f} class="muted tiny">{f}</code>)}</div>
    </section>
  );
}

function OffersSection() {
  const offers = useGame((s) => s.market.offers);
  const mine = offers.filter((o) => o.source === 'comms');
  return (
    <section>
      <h4>Offers to procurement (from comms)</h4>
      {mine.length === 0 && <div class="muted small">None yet.</div>}
      <ul class="outbox">
        {mine.map((o) => (
          <li key={o.id}>
            <div>{o.resource.variant} {o.resource.partKind} · {formatMoney(o.priceM)} · {o.status}</div>
            <div class="muted tiny">{o.supplierName}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NewsSection() {
  const news = useGame((s) => s.events.news);
  const startISO = useStartISO();
  return (
    <section>
      <h4>Shared news · {news.length}</h4>
      <ul class="outbox">
        {news.slice(0, 30).map((n) => (
          <li key={n.id}>
            <div class="outbox-top">
              <span class="muted num">{formatDay(n.day, startISO)}</span>
              <span class="outbox-to">{STATION_LABEL[n.from]} → {n.affects.map((s) => STATION_LABEL[s]).join(', ')}</span>
            </div>
            <div>{n.text}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
