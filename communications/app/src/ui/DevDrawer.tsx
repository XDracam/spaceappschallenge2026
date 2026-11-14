import { useEffect, useState } from 'preact/hooks';
import { EVENTS } from '../data/content';
import {
  DAYS_PER_MONTH, DEFAULT_DAYS_PER_SECOND, STAND_IN_FLAGS, actions, devActions, uiStore, useClock, useComms, useUi,
} from '../state/store';
import { CloseIcon, SH, STAKEHOLDER_ORDER, STATION_LABEL, cap, effectText } from './common';
import { formatDay } from './format';

const SPEEDS = [1, 4, 16];
const STATION_GROUPS: ('planner' | 'procurement' | 'science')[] = ['planner', 'procurement', 'science'];

/** Slide-over from the right: stand-in controls for the other stations. */
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
        <div class="dev-title">Dev controls<div class="muted tiny">stand-in for the other stations</div></div>
        <button class="round-btn small" title="Close (Esc)" onClick={close}><CloseIcon /></button>
      </div>
      {open && (
        <div class="dev-body thin-scroll">
          <CalendarSection />
          <MissionSection />
          <TrustSection />
          <FlagsSection />
          <FireSection />
          <OutboxSection />
          <ResetSection />
        </div>
      )}
    </aside>
  );
}

function ResetSection() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <section>
      <button class="btn danger" onClick={() => {
        if (!armed) { setArmed(true); return; }
        setArmed(false);
        actions.resetGame();
      }}>{armed ? 'Click again to reset' : 'Reset game'}</button>
    </section>
  );
}

function CalendarSection() {
  const running = useClock((c) => c.running);
  const dps = useClock((c) => c.daysPerSecond);
  const launched = useComms((s) => s.phase === 'launched');
  return (
    <section>
      <h4>Calendar</h4>
      <div class="inline wrap">
        <button class={`btn${running ? '' : ' active'}`} onClick={() => devActions.setRunning(!running)}>
          {running ? '❚❚ Pause' : '▶ Play'}
        </button>
        <div class="seg-group">
          {SPEEDS.map((k) => (
            <button key={k} class={`btn small${Math.abs(dps - DEFAULT_DAYS_PER_SECOND * k) < 1e-9 ? ' active' : ''}`}
              onClick={() => devActions.setSpeed(DEFAULT_DAYS_PER_SECOND * k)}>{k}×</button>
          ))}
        </div>
        <button class="btn" disabled={launched} onClick={() => actions.advance(DAYS_PER_MONTH)}>+1 month</button>
      </div>
      <div class="muted tiny">1× = 1 real minute per month.</div>
    </section>
  );
}

/** Number input that commits on Enter / blur. */
function NumField({ label, value, onCommit, min, max, suffix }: {
  label: string; value: number; onCommit: (v: number) => void; min?: number; max?: number; suffix?: string;
}) {
  const [text, setText] = useState(String(Math.round(value)));
  useEffect(() => { setText(String(Math.round(value))); }, [value]);
  const commit = () => {
    const v = Number(text);
    if (Number.isFinite(v) && v !== Math.round(value)) onCommit(v);
    else setText(String(Math.round(value)));
  };
  return (
    <label class="dev-field">
      <span>{label}</span>
      <input type="number" value={text} min={min} max={max}
        onInput={(e) => setText((e.target as HTMLInputElement).value)}
        onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); }} />
      {suffix && <span class="muted tiny">{suffix}</span>}
    </label>
  );
}

function MissionSection() {
  const launchDay = useComms((s) => s.launchDay);
  const startISO = useComms((s) => s.startDateISO);
  const budget = useComms((s) => s.budgetM);
  const total = useComms((s) => s.budgetTotalM);
  return (
    <section>
      <h4>Planner + shared budget</h4>
      <NumField label="Launch day" value={launchDay} min={0} onCommit={(v) => devActions.setLaunchDay(v)} suffix={formatDay(launchDay, startISO)} />
      <NumField label="Budget left" value={budget} onCommit={(v) => devActions.setBudget(v)} suffix={`M of ${total} M`} />
    </section>
  );
}

function TrustSection() {
  const trust = useComms((s) => s.trust);
  return (
    <section>
      <h4>Trust</h4>
      {STAKEHOLDER_ORDER.map((s) => (
        <label key={s} class="dev-slider" style={{ '--c': SH[s].color } as Record<string, string>}>
          <span>{SH[s].label}</span>
          <input type="range" min={0} max={100} step={1} value={trust[s] ?? 0}
            onInput={(e) => devActions.setTrust(s, Number((e.target as HTMLInputElement).value))} />
          <b class="num">{Math.round(trust[s] ?? 0)}</b>
        </label>
      ))}
    </section>
  );
}

function FlagsSection() {
  const flags = useComms((s) => s.flags);
  return (
    <section>
      <h4>Other stations' state (flags)</h4>
      {STATION_GROUPS.map((st) => {
        const list = STAND_IN_FLAGS.filter((f) => f.station === st);
        if (!list.length) return null;
        return (
          <div key={st} class="flag-group">
            <div class="flag-station">{cap(STATION_LABEL[st])}</div>
            {list.map((f) => (
              <label key={f.flag} class="check">
                <input type="checkbox" checked={flags.includes(f.flag)}
                  onChange={(e) => devActions.setFlag(f.flag, (e.target as HTMLInputElement).checked)} />
                <span>{f.label.replace(/^[^:]+:\s*/, '')}</span>
                <code class="muted tiny">{f.flag}</code>
              </label>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function FireSection() {
  const [id, setId] = useState('');
  const fired = useComms((s) => s.fired);
  return (
    <section>
      <h4>Fire event</h4>
      <div class="inline">
        <select value={id} onChange={(e) => setId((e.target as HTMLSelectElement).value)} disabled={!EVENTS.length} style={{ flex: 1 }}>
          <option value="">{EVENTS.length ? 'Choose an event…' : 'No events authored yet'}</option>
          {EVENTS.map((ev) => (
            <option key={ev.id} value={ev.id}>{fired.includes(ev.id) ? '✓ ' : ''}{ev.title} ({ev.source})</option>
          ))}
        </select>
        <button class="btn" disabled={!id} onClick={() => devActions.fireEvent(id)}>Fire</button>
      </div>
    </section>
  );
}

function OutboxSection() {
  const outbox = useComms((s) => s.outbox);
  const startISO = useComms((s) => s.startDateISO);
  const items = [...outbox].sort((a, b) => b.day - a.day);
  return (
    <section>
      <h4>Outbox · sent to other stations</h4>
      {items.length === 0 && <div class="muted small">Nothing sent yet. Internal effects of your choices land here.</div>}
      <ul class="outbox">
        {items.map((o) => (
          <li key={o.id}>
            <div class="outbox-top">
              <span class="muted num">{formatDay(o.day, startISO)}</span>
              <span class="outbox-to">→ {o.to.map((s) => STATION_LABEL[s]).join(', ')}</span>
            </div>
            <div>{cap(effectText(o.effect))}</div>
            <div class="muted tiny">from {o.source}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
