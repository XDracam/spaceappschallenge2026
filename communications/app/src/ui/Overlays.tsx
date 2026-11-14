import { useEffect, useState } from 'preact/hooks';
import { IN_FLIGHT } from '../data/content';
import { commsStore, devActions, useComms } from '../state/store';
import { SH, STAKEHOLDER_ORDER } from './common';

const SEEN_KEY = 'comms.briefing.seen';

function briefingSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* storage unavailable */ }
}

/** One-time first-load briefing. */
export function Briefing() {
  const [open, setOpen] = useState(() => !briefingSeen());
  // The agency calendar waits while the briefing is open.
  useEffect(() => {
    if (open) devActions.setRunning(false);
  }, [open]);
  if (!open) return null;
  const close = () => {
    markSeen();
    setOpen(false);
    if (commsStore.get().phase === 'planning') devActions.setRunning(true);
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
  const inFlight = useComms((s) => s.inFlight);
  const trust = useComms((s) => s.trust);
  return (
    <div class="modal-backdrop launched-backdrop">
      <div class="modal glass strong launched-card" role="dialog" aria-label="Mission launched">
        <div class="tb-label ok-text">Mission launched</div>
        <div class="briefing-title display">Your relationships carry into the flight.</div>
        <div class="launch-trust">
          {STAKEHOLDER_ORDER.map((s) => (
            <div key={s}><span class="label">{SH[s].label}</span><b class="num" style={{ color: SH[s].color }}>{Math.round(trust[s] ?? 0)}</b></div>
          ))}
        </div>
        {inFlight.length === 0 && <p class="muted">No in-flight events were resolved.</p>}
        <ul class="outcome-list">
          {inFlight.map((r) => {
            const def = IN_FLIGHT.find((d) => d.id === r.eventId);
            return (
              <li key={r.eventId} class={r.good ? 'ok' : 'err'}>
                <span class="outcome-icon">{r.good ? '✓' : '!'}</span>
                <div class="outcome-text">
                  <b>{def?.title ?? r.eventId}</b>
                  <span class="muted small">{def ? (r.good ? def.good.text : def.bad.text) : ''}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <p class="muted tiny">Reset the game from the Dev drawer to play again.</p>
      </div>
    </div>
  );
}
