import { useEffect, useRef, useState } from 'preact/hooks';
import { actions, budgetSpentM, uiStore, useEvaluation, useGame, useUi } from '../state/store';
import { formatDay, formatDuration, formatMass, formatMoney } from '../model/units';
import { CheckIcon, CloseIcon, PauseIcon, PlayIcon, branchColor } from './common';

const SPEEDS = [30, 60, 180];

export function PlaythroughOverlay() {
  const pt = useUi((u) => u.playthrough);
  const phase = useGame((g) => g.phase);
  const [resultHidden, setResultHidden] = useState(false);
  useEffect(() => {
    if (phase !== 'finished') setResultHidden(false);
  }, [phase]);
  if (!pt) return null;
  return (
    <>
      <PlaybackPanel onShowResult={resultHidden ? () => setResultHidden(false) : undefined} />
      {phase === 'finished' && !resultHidden && <ResultCard onHide={() => setResultHidden(true)} />}
    </>
  );
}

function PlaybackPanel({ onShowResult }: { onShowResult?: () => void }) {
  const pt = useUi((u) => u.playthrough)!;
  const phase = useGame((g) => g.phase);
  const startISO = useGame((g) => g.mission.startDateISO);
  const launchDay = useGame((g) => g.plan.launchDay);
  const branches = useGame((g) => g.plan.branches);
  const logRef = useRef<HTMLUListElement>(null);
  const shown = pt.result.events.filter((e) => e.day <= pt.day + 1e-9);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown.length]);

  const set = (fn: (p: NonNullable<typeof pt>) => void) => uiStore.update((u) => { if (u.playthrough) fn(u.playthrough); });
  const finished = phase === 'finished';
  const progress = pt.result.endDay > launchDay ? (pt.day - launchDay) / (pt.result.endDay - launchDay) : 1;

  return (
    <div class="playback">
      <div class="pb-head">
        <div>
          <div class="tb-label">{finished ? 'Playthrough finished' : 'Final playthrough'}</div>
          <div class="pb-date num">{formatDay(pt.day, startISO)}</div>
          <div class="muted small num">T+{formatDuration(pt.day - launchDay)}</div>
        </div>
        <div class="spacer" />
        {!finished && (
          <div class="inline">
            <button class="btn icon-btn" title={pt.playing ? 'Pause' : 'Play'} onClick={() => set((p) => { p.playing = !p.playing; })}>
              {pt.playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            {SPEEDS.map((s) => (
              <button class={`btn small${pt.daysPerSecond === s ? ' active' : ''}`} onClick={() => set((p) => { p.daysPerSecond = s; })}>
                {s} d/s
              </button>
            ))}
            <button class="btn small warn" onClick={() => actions.finishPlaythrough()}>Skip to end</button>
          </div>
        )}
        {finished && onShowResult && <button class="btn small primary" onClick={onShowResult}>Show result</button>}
      </div>
      <div class="pb-progress"><div style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} /></div>
      <ul class="event-log" ref={logRef}>
        {shown.length === 0 && <li class="muted">Waiting for events…</li>}
        {shown.map((e, i) => {
          const bi = branches.findIndex((b) => b.id === e.branchId);
          return (
            <li key={i} class={`ev ev-${e.kind}`}>
              <span class="dot" style={{ background: branchColor(Math.max(0, bi)) }} />
              <span class="ev-date num">{formatDay(e.day, startISO)}</span>
              <span class="ev-text">{e.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ResultCard({ onHide }: { onHide: () => void }) {
  const pt = useUi((u) => u.playthrough)!;
  const game = useGame((g) => g);
  const ev = useEvaluation();
  const outcomes = pt.result.goalOutcomes;
  const ok = outcomes.filter((o) => o.success).length;
  const failures = pt.result.events.filter((e) => e.kind === 'failure').length;
  const start = game.mission.startDateISO;
  return (
    <div class="modal-backdrop result-backdrop">
      <div class="modal result-card">
        <div class="popup-head">
          <div class="popup-title">
            <div class="tb-label">Mission result</div>
            <b class="result-title">{game.mission.name}</b>
          </div>
          <button class="btn icon-btn ghost" title="Hide (the event log stays visible)" onClick={onHide}>
            <CloseIcon />
          </button>
        </div>
        <div class={`result-score ${ok === outcomes.length ? 'ok-text' : ok === 0 ? 'err-text' : 'warn-text'}`}>
          {ok} / {outcomes.length} goals achieved
        </div>
        <ul class="outcome-list">
          {outcomes.map((o) => {
            const g = game.mission.goals.find((x) => x.id === o.goalId);
            return (
              <li class={o.success ? 'ok' : 'err'}>
                <span class="outcome-icon">{o.success ? <CheckIcon /> : <CloseIcon />}</span>
                {g?.name ?? o.goalId}
              </li>
            );
          })}
        </ul>
        <div class="result-summary">
          <div class="kv"><span>Launch</span><span class="num">{formatDay(game.plan.launchDay, start)}</span></div>
          <div class="kv"><span>Mission end</span><span class="num">{formatDay(pt.result.endDay, start)} ({formatDuration(pt.result.endDay - game.plan.launchDay)})</span></div>
          <div class="kv"><span>Launch mass</span><span class="num">{formatMass(ev.totalMassT)}</span></div>
          <div class="kv"><span>Committed spend</span><span class="num">{formatMoney(budgetSpentM(game))} of {formatMoney(game.mission.budgetM)}</span></div>
          <div class="kv"><span>Part failures</span><span class={`num${failures ? ' err-text' : ''}`}>{failures}</span></div>
        </div>
        <div class="popup-foot">
          <div class="spacer" />
          <button class="btn primary" onClick={() => actions.resetGame()}>New game</button>
        </div>
      </div>
    </div>
  );
}
