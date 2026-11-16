import { useEffect, useRef } from 'preact/hooks';
import { createStore, useStore } from '../../../core/createStore';
import { useDialog } from '../../../shared/useDialog';
import { useGame } from '../../../core/store';
import { commsInFlightResults } from '../logic';
import { uiStore, useComms, useFlightLost, useMission, useScrubbed } from './store';
import { SH, STAKEHOLDER_ORDER, signedPct } from './common';

const SEEN_KEY = 'comms.briefing.seen';
const briefingStore = createStore({ open: false, missionId: '' });
const seenKey = (missionId: string) => `${SEEN_KEY}.${missionId}`;
function briefingSeen(missionId: string): boolean {
  try { return localStorage.getItem(seenKey(missionId)) === '1'; } catch { return false; }
}
export function openBriefing() {
  briefingStore.set({ ...briefingStore.get(), open: true });
}

/** The briefing is remembered per mission; opening it never changes the calendar. */
export function Briefing() {
  const { open } = useStore(briefingStore, s => s);
  const mission = useMission();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (briefingStore.get().missionId !== mission.id) briefingStore.set({ open: !briefingSeen(mission.id), missionId: mission.id });
  }, [mission.id]);
  const close = () => {
    try { localStorage.setItem(seenKey(mission.id), '1'); } catch { /* storage unavailable */ }
    briefingStore.set({ open: false, missionId: mission.id });
  };
  useDialog({ open, root, onClose: close });
  if (!open) return null;
  return (
    <div class="modal-backdrop briefing-backdrop">
      <div ref={root} tabIndex={-1} class="modal glass strong briefing" role="dialog" aria-modal="true" aria-label="Briefing">
        <div class="tb-label">Communications · briefing</div>
        <div class="briefing-title display">You are the agency's voice</div>
        <p>
          Keep <b style={{ color: SH.government.color }}>government</b>, <b style={{ color: SH.industry.color }}>industry</b>,{' '}
          the <b style={{ color: SH.public.color }}>public</b> and <b style={{ color: SH.partners.color }}>partners</b> on side.
        </p>
        <p>Answer messages before their deadline — ignored ones resolve on their own, usually badly. Each answer shows what it will change, for which teammate, and until when.</p>
        <p>Run two projects at a time: build trust, raise money, win parts, research and test help for your teammates.</p>
        <p>Trust at launch decides the in-flight events that can save or lose a goal (right panel), and counts in the score.</p>
        <div class="briefing-foot">
          <button class="pill primary" onClick={close} autoFocus>Start</button>
        </div>
      </div>
    </div>
  );
}

/** Centred card after launch: in-flight events resolved from trust at launch. */
export function LaunchedCard() {
  const root = useRef<HTMLDivElement>(null);
  const close = () => uiStore.update(u => { u.launchCardClosed = true; });
  useDialog({ open: true, root, onClose: close });
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
      <div ref={root} tabIndex={-1} class={`modal glass strong launched-card${ended ? ' scrubbed' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
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
                <b>{r.title} <span class={`num ${r.good ? 'ok-text' : 'warn-text'}`}>{signedPct(r.goalChanceDelta)}</span></b>
                <span class="muted small">{r.text}</span>
              </div>
            </li>
          ))}
        </ul>
        <div class="briefing-foot">
          <button class="pill primary" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
