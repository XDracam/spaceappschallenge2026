import { useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import { DAYS_PER_MONTH } from '../../../core/state';
import type { Science } from '../state/science';
import { scienceActions } from '../logic';
import { describeEffect, formatDate, formatMonth, running, sci, scopeDef, methodDef } from '../model/research';

/**
 * Research calendar: running projects as bars on the agency calendar (today and the
 * planned launch marked), free teams, and finished results.
 */
export function LabPanel({ s }: { s: Science }) {
  const research = useGame((g) => g.research);
  const day = useGame((g) => g.clock.day);
  const launchDay = useGame((g) => g.planner.plan.launchDay);
  const slots = useGame((g) => sci(g).slots);
  const info = useGame((g) => sci(g).info);
  const [confirm, setConfirm] = useState<string | null>(null);

  const run = running(research);
  const done = research.projects
    .filter((p) => p.status !== 'running')
    .sort((a, b) => (info[b.id]?.endedAt ?? b.endsAt) - (info[a.id]?.endedAt ?? a.endsAt));

  const start = Math.min(day, ...run.map((p) => p.startedAt));
  const end = Math.max(launchDay, day + 4 * DAYS_PER_MONTH, ...run.map((p) => p.endsAt)) + 10;
  const pctOf = (d: number) => ((d - start) / (end - start)) * 100;
  const x = (d: number) => `${pctOf(d).toFixed(2)}%`;
  /** Axis labels stay inside the panel near its edges. */
  const labelStyle = (d: number) => ({ left: x(d), transform: `translateX(${pctOf(d) < 12 ? '0' : pctOf(d) > 80 ? '-100%' : '-50%'})` });
  const ticks: number[] = [];
  for (let m = Math.ceil(start / DAYS_PER_MONTH); m * DAYS_PER_MONTH < end; m++) ticks.push(m * DAYS_PER_MONTH);

  return (
    <section class="lab" aria-label="Research calendar">
      <div class="row baseline">
        <h2 class="bench-title">Research calendar</h2>
        <span class="grow" />
        <div class="seg small-seg" role="group" aria-label="Show">
          <button class={s.labTab === 'running' ? 'on' : ''} aria-pressed={s.labTab === 'running'} onClick={() => s.setLabTab('running')}>
            Running <span class="num">{run.length}/{slots}</span>
          </button>
          <button class={s.labTab === 'results' ? 'on' : ''} aria-pressed={s.labTab === 'results'} onClick={() => s.setLabTab('results')}>
            Results <span class="num">{done.length}</span>
          </button>
        </div>
      </div>

      {s.labTab === 'running' ? (
        <div class="cal">
          <div class="cal-axis">
            {ticks.map((t) => <span key={t} class="cal-tick" style={{ left: x(t) }} />)}
            <span class="cal-label" style={labelStyle(day)}>today</span>
            {launchDay > start && launchDay < end && <span class="cal-label launch" style={labelStyle(launchDay)}>launch {formatMonth(launchDay)}</span>}
          </div>
          <div class="cal-rows thin-scroll">
            <span class="cal-line today" style={{ left: x(day) }} />
            {launchDay > start && launchDay < end && <span class="cal-line launch" style={{ left: x(launchDay) }} />}
            {run.map((p) => {
              const prog = Math.min(1, Math.max(0, (day - p.startedAt) / Math.max(1, p.endsAt - p.startedAt)));
              const late = p.endsAt > launchDay;
              const i = info[p.id];
              return (
                <div key={p.id} class="cal-row">
                  <div class="row baseline">
                    <strong class="ellipsis grow" title={p.title}>{p.title}</strong>
                    <span class="num small blue">{Math.round(prog * 100)}%</span>
                    {confirm === p.id ? (
                      <span class="row nowrap">
                        <button class="btn small danger" onClick={() => { scienceActions.cancelProject(p.id); setConfirm(null); }}>Stop it</button>
                        <button class="btn small ghost" onClick={() => setConfirm(null)}>Keep</button>
                      </span>
                    ) : (
                      <button class="btn small ghost" title="Stop this project (half the unspent cost comes back)" onClick={() => setConfirm(p.id)}>Stop</button>
                    )}
                  </div>
                  <div class="cal-track">
                    <span class={'cal-bar' + (late ? ' late' : '')} style={{ left: x(p.startedAt), width: `calc(${x(p.endsAt)} - ${x(p.startedAt)})` }}>
                      <span class="cal-fill" style={{ width: `${(prog * 100).toFixed(1)}%` }} />
                    </span>
                  </div>
                  <div class="tiny muted ellipsis">
                    result ~{formatMonth(p.endsAt)} · odds {Math.round(p.successChance * 100)}% · {p.costM} M
                    {i && <> · {scopeDef(i.scope).title.split(':')[0]}, {methodDef(i.method).title.toLowerCase()}</>}
                    {late && <span class="orange"> · after launch</span>}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, slots - run.length) }, (_, k) => (
              <div key={'free' + k} class="cal-row free small muted">Free team: combine fields on the bench and draft a project.</div>
            ))}
          </div>
        </div>
      ) : (
        <div class="results thin-scroll">
          {done.length === 0 && <div class="small muted">No finished projects yet.</div>}
          {done.map((p) => {
            const i = info[p.id];
            const st = i?.cancelled ? 'cancelled' : p.status;
            const gains = p.effects.filter((e) => e.kind !== 'flag');
            return (
              <div key={p.id} class={'result-row ' + st}>
                <span class="mark" aria-hidden="true">{st === 'succeeded' ? '✓' : st === 'cancelled' ? '–' : '✗'}</span>
                <div class="grow stack-2">
                  <div class="row baseline"><strong class="ellipsis grow">{p.title}</strong><span class="small muted nowrap">{formatDate(i?.endedAt ?? p.endsAt)}</span></div>
                  <div class="small muted">
                    {st === 'succeeded'
                      ? gains.length ? gains.map((e) => describeEffect(e)).join('; ') : 'Published finding'
                      : st === 'cancelled' ? 'Stopped by the lab' : 'No result'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
