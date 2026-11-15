import { useEffect, useRef, useState } from 'preact/hooks';
import { actions, uiStore, useEvaluation, usePlanner, useUi } from '../state/store';
import { formatDay, formatDuration, formatMass, formatMoney } from '../model/units';
import type { Evaluation, PlannerGame, PlaythroughResult } from '../model/types';
import { allParts } from '../model/rocketUtils';
import { CheckIcon, CloseIcon, PauseIcon, PlayIcon, branchColor, plural } from './common';

const SPEEDS = [
  { dps: 30, label: '1×' },
  { dps: 60, label: '2×' },
  { dps: 180, label: '6×' },
];

/** Why a goal failed in the playthrough: its own failure event, the plan's reason, or the failure on its branch. */
function failReasons(game: PlannerGame, ev: Evaluation, result: PlaythroughResult): Map<string, string> {
  const out = new Map<string, string>();
  const failures = result.events.filter((e) => e.kind === 'failure');
  const scrub = failures.find((e) => e.text.startsWith('Launch scrubbed'));
  for (const o of result.goalOutcomes) {
    if (o.success) continue;
    const goal = game.mission.goals.find((g) => g.id === o.goalId);
    if (!goal) continue;
    const r = ev.goals.find((x) => x.goalId === o.goalId);
    const own = failures.find((e) => e.text.includes(`"${goal.name}"`));
    const onBranch = r?.branchId ? failures.find((e) => e.branchId === r.branchId) : undefined;
    const reason = (scrub ? 'launch scrubbed' : undefined) ?? own?.text ?? (!r?.achievable ? r?.reason : undefined) ?? onBranch?.text ?? failures[0]?.text ?? 'Not reached';
    out.set(o.goalId, reason);
  }
  return out;
}

export function PlaythroughOverlay() {
  const pt = useUi((u) => u.playthrough);
  const finished = useUi((u) => !!u.playthrough?.finished);
  const [resultHidden, setResultHidden] = useState(false);
  useEffect(() => {
    if (!finished) setResultHidden(false);
  }, [finished]);
  if (!pt) return null;
  return (
    <>
      <PlaybackPanel onShowResult={resultHidden ? () => setResultHidden(false) : undefined} />
      {finished && !resultHidden && <ResultCard onHide={() => setResultHidden(true)} />}
    </>
  );
}

function PlaybackPanel({ onShowResult }: { onShowResult?: () => void }) {
  const pt = useUi((u) => u.playthrough)!;
  const startISO = usePlanner((g) => g.mission.startDateISO);
  const launchDay = usePlanner((g) => g.plan.launchDay);
  const branches = usePlanner((g) => g.plan.branches);
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const logRef = useRef<HTMLUListElement>(null);
  const shown = pt.result.events.filter((e) => e.day <= pt.day + 1e-9);
  const finished = pt.finished;
  const goalFails = [...failReasons(game, ev, pt.result)];

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown.length, finished]);

  const set = (fn: (p: NonNullable<typeof pt>) => void) => uiStore.update((u) => { if (u.playthrough) fn(u.playthrough); });
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
              <button key={s.dps} class={`btn small${pt.daysPerSecond === s.dps ? ' active' : ''}`} title={`${s.dps} days per second`}
                onClick={() => set((p) => { p.daysPerSecond = s.dps; })}>
                {s.label}
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
        {finished && goalFails.map(([goalId, reason]) => (
          <li key={`fail-${goalId}`} class="ev ev-failure ev-summary">
            <span class="ev-text">✗ {game.mission.goals.find((g) => g.id === goalId)?.name ?? goalId}: {reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultCard({ onHide }: { onHide: () => void }) {
  const pt = useUi((u) => u.playthrough)!;
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const outcomes = pt.result.goalOutcomes;
  const isOpt = (id: string) => game.mission.goals.find((g) => g.id === id)?.optional === true;
  const required = outcomes.filter((o) => !isOpt(o.goalId));
  const optionalOk = outcomes.filter((o) => isOpt(o.goalId) && o.success).length;
  const optionalCount = outcomes.length - required.length;
  const ok = required.filter((o) => o.success).length;
  const failures = pt.result.events.filter((e) => e.kind === 'failure').length;
  const start = game.mission.startDateISO;
  const reasons = failReasons(game, ev, pt.result);
  const scrubbed = pt.result.events.some((e) => e.kind === 'failure' && e.text.startsWith('Launch scrubbed'));
  const notDelivered = allParts(game.rocket).filter((l) => l.part.state !== 'delivered').length;
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
        {scrubbed ? (
          <div class="result-score err-text scrubbed">
            Launch scrubbed — {plural(Math.max(1, notDelivered), 'part was', 'parts were')} not delivered
          </div>
        ) : (
          <div class={`result-score ${ok === required.length ? 'ok-text' : ok === 0 ? 'err-text' : 'warn-text'}`}>
            {ok} / {required.length} goals achieved{optionalCount > 0 ? ` · ${optionalOk} / ${optionalCount} optional` : ''}
          </div>
        )}
        <ul class="outcome-list">
          {outcomes.map((o) => {
            const g = game.mission.goals.find((x) => x.id === o.goalId);
            const reason = reasons.get(o.goalId);
            return (
              <li key={o.goalId} class={o.success ? 'ok' : 'err'}>
                <span class="outcome-icon">{o.success ? <CheckIcon /> : <CloseIcon />}</span>
                <div class="outcome-text">
                  <span>{g?.name ?? o.goalId}{g?.optional ? ' (optional)' : ''}</span>
                  {!o.success && reason && !scrubbed && <span class="outcome-reason">{reason}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <div class="result-summary">
          <div class="kv"><span>Launch</span><span class="num">{formatDay(game.plan.launchDay, start)}</span></div>
          {!scrubbed && <div class="kv"><span>Mission end</span><span class="num">{formatDay(pt.result.endDay, start)} ({formatDuration(pt.result.endDay - game.plan.launchDay)})</span></div>}
          <div class="kv"><span>Launch mass</span><span class="num">{formatMass(ev.totalMassT)}</span></div>
          <div class="kv"><span>Agency spend</span><span class="num">{formatMoney(game.budget.spentM + game.budget.committedM)} of {formatMoney(game.budget.totalM)}</span></div>
          {!scrubbed && <div class="kv"><span>Part failures</span><span class={`num${failures ? ' err-text' : ''}`}>{failures}</span></div>}
        </div>
        <div class="popup-foot">
          <div class="spacer" />
          <button class="btn primary" onClick={onHide}>Close</button>
        </div>
      </div>
    </div>
  );
}
