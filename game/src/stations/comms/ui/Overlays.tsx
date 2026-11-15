import { useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import { commsInFlightResults } from '../logic';
import { uiStore, useComms, useFlightLost, useScrubbed } from './store';
import { SH, STAKEHOLDER_ORDER } from './common';

const SEEN_KEY = 'comms.briefing.seen';

function briefingSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* storage unavailable */ }
}

/** One-time first-load briefing (the shared calendar keeps running). */
export function Briefing() {
  const [open, setOpen] = useState(() => !briefingSeen());
  if (!open) return null;
  const close = () => {
    markSeen();
    setOpen(false);
  };
  return (
    <div class="modal-backdrop briefing-backdrop">
      <div class="modal glass strong briefing" role="dialog" aria-label="Briefing">
        <div class="tb-label">Communications · briefing</div>
        <div class="briefing-title display">You are the agency's voice</div>
        <p>
          Keep <b style={{ color: SH.government.color }}>government</b>, <b style={{ color: SH.industry.color }}>industry</b>,{' '}
          the <b style={{ color: SH.public.color }}>public</b> and <b style={{ color: SH.partners.color }}>partners</b> on side.
        </p>
        <p>Answer messages before their deadline — ignored ones resolve on their own, usually badly.</p>
        <p>Run 2–3 projects to build trust, raise money or negotiate parts and research from partners.</p>
        <p>Some choices affect your teammates — they're marked <span class="tag-int">Affects procurement</span>.</p>
        <div class="briefing-foot">
          <button class="pill primary" onClick={close} autoFocus>Start</button>
        </div>
      </div>
    </div>
  );
}

/** Centred card after launch: in-flight events resolved from trust at launch. */
export function LaunchedCard() {
  // Resolved at launch (or from the current state if comms has not ticked since the launch).
  // A scrubbed launch never flew, and a flight that lost every goal ended before them: no in-flight events to show.
  const scrubbed = useScrubbed();
  const lost = useFlightLost();
  const ended = scrubbed || lost;
  const resolved = commsInFlightResults(useGame((s) => s));
  const inFlight = ended ? [] : resolved;
  const trust = useComms((s) => s.trust);
  const label = scrubbed ? 'Launch scrubbed' : lost ? 'Flight lost' : 'Mission launched';
  return (
    <div class="modal-backdrop launched-backdrop">
      <div class={`modal glass strong launched-card${ended ? ' scrubbed' : ''}`} role="dialog" aria-label={label}>
        <div class={`tb-label ${ended ? 'err-text' : 'ok-text'}`}>{label}</div>
        <div class="briefing-title display">{scrubbed ? 'The rocket never left the pad.' : lost ? 'The flight ended before your relationships could count.' : 'Your relationships carry into the flight.'}</div>
        <div class="launch-trust">
          {STAKEHOLDER_ORDER.map((s) => (
            <div key={s}><span class="label">{SH[s].label}</span><b class="num" style={{ color: SH[s].color }}>{Math.round(trust[s] ?? 0)}</b></div>
          ))}
        </div>
        {inFlight.length === 0 && !ended && <p class="muted">No in-flight events were resolved.</p>}
        <ul class="outcome-list">
          {inFlight.map((r) => (
            <li key={r.eventId} class={r.good ? 'ok' : 'err'}>
              <span class="outcome-icon">{r.good ? '✓' : '!'}</span>
              <div class="outcome-text">
                <b>{r.title}</b>
                <span class="muted small">{r.text}</span>
              </div>
            </li>
          ))}
        </ul>
        <div class="briefing-foot">
          <button class="pill primary" onClick={() => uiStore.update((u) => { u.launchCardClosed = true; })}>Close</button>
        </div>
      </div>
    </div>
  );
}
