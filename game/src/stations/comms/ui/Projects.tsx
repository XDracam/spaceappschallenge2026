import { useEffect, useRef, useState } from 'preact/hooks';
import { useDialog } from '../../../shared/useDialog';
import type { ActiveProject, Effect, ProjectDef, ProjectKind } from '../model/types';
import type { Condition } from '../../../shared/events/types';
import { useConfirmedGame, useGame, useSync } from '../../../core/store';
import { SCORE_WEIGHTS } from '../../../core/score';
import { FLAG_GROUND_STATION } from '../data/helpers';
import { commsInFlightResults } from '../logic';
import { doneProjects, type ProjectBlock } from '../state/world';
import { DAYS_PER_MONTH, actions, uiStore, useBudgetLeft, useContent, useLaunched, useUi } from './store';
import {
  ChangeList, CloseIcon, SH, characterById, previewLines, projectById, signedPct,
} from './common';
import { formatDuration, formatMoney, plural } from './format';

const KIND_LABEL: Record<ProjectKind, string> = {
  gala: 'Gala / outreach', campaign: 'Press campaign', lobbying: 'Lobbying', negotiation: 'Negotiation',
};

/** Main colour of a project: the stakeholder its result helps most. */
function projectColor(def: ProjectDef | undefined): string {
  const t = def?.effects.find((e) => e.kind === 'trust' && e.delta > 0);
  return t && t.kind === 'trust' ? SH[t.stakeholder].color : 'var(--accent)';
}

const BLOCK_TEXT: Record<ProjectBlock, string> = {
  unknown: 'Unknown project', launched: 'Mission launched', running: 'Already running', done: 'Already done',
  noSlot: 'No free slot', trust: 'Requirement not met', budget: 'Not enough budget',
};

const openPicker = () => uiStore.update((u) => { u.projectPickerOpen = true; });

/** Right column: running projects in their slots, then what trust decides at launch. */
export function Projects() {
  const projects = useConfirmedGame((s) => s.comms.projects);
  const launched = useLaunched();
  const slots = actions.projectSlots();
  const free = Math.max(0, slots - projects.length);
  const day = useConfirmedGame(s => s.clock.day);
  const gameKey = useConfirmedGame(s => `${s.meta.missionId}|${s.meta.seed}|${s.meta.attempt}`);
  const previousGame = useRef(gameKey);
  const previous = useRef<Map<string, { name: string; milestone: number }> | null>(null);
  const [progressNotice, setProgressNotice] = useState('');
  useEffect(() => {
    if (previousGame.current !== gameKey) { previous.current = null; previousGame.current = gameKey; }
    const current = new Map(projects.map(p => [p.instanceId, {
      name: projectById(p.defId)?.name ?? p.defId,
      milestone: Math.floor(Math.max(0, Math.min(1, (day - p.startDay) / Math.max(1e-6, p.endDay - p.startDay))) * 4) * 25,
    }]));
    if (previous.current) {
      const notices: string[] = [];
      for (const [id, p] of current) {
        const before = previous.current.get(id);
        if (!before) notices.push(`${p.name} started.`);
        else if (p.milestone > before.milestone) notices.push(`${p.name}: ${p.milestone}% complete.`);
      }
      for (const [id, p] of previous.current) if (!current.has(id)) notices.push(`${p.name} completed.`);
      if (notices.length) setProgressNotice(notices.join(' '));
    }
    previous.current = current;
  }, [projects, day, gameKey]);

  return (
    <section class="projects glass" aria-label="Communications projects">
      <span class="comms-a11y-only" role="status" aria-atomic="true">{progressNotice}</span>
      <div class="panel-scroll thin-scroll">
        <div class="panel-head"><span class="label">Projects · {projects.length} of {slots}</span></div>
        {projects.map((p) => <ProjectCard key={p.instanceId} p={p} />)}
        {Array.from({ length: free }, (_, i) => (
          <button key={`free${i}`} class="slot-empty" aria-disabled={launched} onClick={() => { if (!launched) openPicker(); }}>
            <span class="slot-plus" aria-hidden="true">+</span> {launched ? "Mission launched · projects closed" : "Start a project"}
          </button>
        ))}
        <FlightOutlook />
      </div>
    </section>
  );
}

function ProjectCard({ p }: { p: ActiveProject }) {
  const def = projectById(p.defId);
  const state = useGame((s) => s);
  const day = Math.floor(state.clock.day * 4) / 4;
  const launchDay = state.planner.plan.launchDay;
  const launched = useLaunched();
  const span = Math.max(1e-6, p.endDay - p.startDay);
  const frac = Math.max(0, Math.min(1, (day - p.startDay) / span));
  const partner = characterById(def?.partnerCharacterId);
  const color = projectColor(def);
  return (
    <div class="proj" style={{ '--c': color } as Record<string, string>}>
      <div class="proj-top">
        <b>{def?.name ?? p.defId}</b>
        <span class="muted num nowrap">{formatDuration(Math.max(0, p.endDay - day))} left</span>
      </div>
      <div class="proj-sub muted">
        {def ? KIND_LABEL[def.kind] : 'Project'}{partner ? ` · with ${partner.name}` : ''}
      </div>
      {def && <ChangeList lines={previewLines(state, def.effects, { shield: false, at: p.endDay })} />}
      {(launched || p.endDay >= launchDay) && <p class="project-timing-warning small">{launched ? 'Unfinished at launch — completion effects were not applied.' : 'Finishes on or after the planned launch. Completion effects need a later actual launch; this slot stays occupied until completion.'}</p>}
      <div class="pbar" role="progressbar" aria-label={`${def?.name ?? p.defId} progress`} aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={Math.round(frac * 100)} aria-valuetext={`${Math.round(frac * 100)}% complete; ${formatDuration(Math.max(0, p.endDay - day))} left`}>
        <i style={{ width: `${frac * 100}%` }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------ flight outlook

const FLAG_WORDS: Record<string, [string, string]> = {
  [FLAG_GROUND_STATION]: ["Meridian's dish booked", "no partner dish booked"],
  'contract.cheapest': ['a cheapest-bid contract', 'no cheapest-bid contract'],
  'plan.launchMoved': ['the launch date moved', 'launch date never moved'],
  'research.breakthrough': ['a Science breakthrough', 'no Science breakthrough'],
};

/** A launch condition in words, with today's values: "Government above 60 (now 55)". */
function conditionText(c: Condition, trust: Record<string, number>): string {
  switch (c.kind) {
    case 'trustAbove': return `${SH[c.stakeholder].short} above ${c.value} (now ${Math.round(trust[c.stakeholder] ?? 0)})`;
    case 'trustBelow': return `${SH[c.stakeholder].short} below ${c.value} (now ${Math.round(trust[c.stakeholder] ?? 0)})`;
    case 'flag': return FLAG_WORDS[c.flag]?.[0] ?? c.flag;
    case 'notFlag': return FLAG_WORDS[c.flag]?.[1] ?? `not ${c.flag}`;
    case 'all': return c.of.map((x) => conditionText(x, trust)).join(' and ');
    case 'any': return c.of.map((x) => conditionText(x, trust)).join(' or ');
    case 'budgetBelow': return `budget below ${c.valueM} M`;
    case 'dayAfter': return `after day ${c.day}`;
  }
}

/**
 * What the relationships are worth for the mission, read live: the in-flight events as they
 * would resolve if the launch were now, their net effect on the goals, and the trust part of
 * the score. The same rules resolve them at launch (commsInFlightResults → planner/result.ts).
 */
function FlightOutlook() {
  const state = useGame((s) => s);
  const content = useContent();
  const launched = useLaunched();
  if (launched) return null;
  const results = commsInFlightResults(state);
  const net = results.reduce((a, r) => a + r.goalChanceDelta, 0);
  const trust = state.comms.trust;
  const values = Object.values(trust) as number[];
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const points = Math.round((SCORE_WEIGHTS.trust * mean) / 100);
  const netText = Math.abs(net) < 1e-9 ? 'Net now 0 %: the flight neither gains nor loses.'
    : net > 0 ? `Net now ${signedPct(net)}: if the flight survives, physically achievable goals lost to part reliability each get a ${Math.round(net * 100)} % recovery chance.`
      : `Net now ${signedPct(net)}: if the flight survives, each achieved goal has a ${Math.round(-net * 100)} % risk of being lost in flight.`;
  return (
    <div class="outlook">
      <div class="panel-head outlook-head">
        <span class="label">In flight · decided at launch</span>
        <span class="outlook-score num" title={`Mean trust ${Math.round(mean)} of 100 counts for ${SCORE_WEIGHTS.trust} of the mission's score points`}>
          score {points}/{SCORE_WEIGHTS.trust}
        </span>
      </div>
      <ul class="outlook-list">
        {results.map((r) => {
          const def = content.inFlight.find((d) => d.id === r.eventId);
          return (
            <li key={r.eventId} class={r.good ? 'ok' : 'err'}>
              <span class="outlook-mark">{r.good ? '✓' : '✗'}</span>
              <span class="outlook-body">
                <span class="outlook-title">{r.title}</span>
                <span class="muted tiny">{def ? conditionText(def.goodIf, trust) : ''}</span>
              </span>
              <span class="outlook-delta num">{signedPct(r.goalChanceDelta)}</span>
            </li>
          );
        })}
      </ul>
      <div class="muted tiny outlook-net">{netText}</div>
    </div>
  );
}

// -------------------------------------------------------------- picker

/** The project's consequences: what starting costs, and what it delivers when it finishes. */
function startEffects(def: ProjectDef): Effect[] {
  return [
    ...(def.costM ? [{ kind: 'budget', deltaM: -def.costM } as Effect] : []),
    ...def.startTrust.map((t): Effect => ({ kind: 'trust', stakeholder: t.stakeholder, delta: t.delta })),
  ];
}

/** Modal list of the mission's projects to start (finished one-offs are left out). */
export function ProjectPicker() {
  const open = useUi((u) => u.projectPickerOpen);
  const projects = useConfirmedGame((s) => s.comms.projects);
  const done = useConfirmedGame(s => doneProjects(s.comms));
  const budget = useBudgetLeft();
  const state = useConfirmedGame((s) => s);
  const connected = useSync(s => s.connected);
  const pending = useUi(u => u.pending);
  const feedback = useUi(u => u.feedback);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const review = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) setReviewId(null); }, [open]);
  useEffect(() => { if (reviewId) review.current?.focus(); }, [reviewId]);
  const projectDefs = useContent().projects.filter((d) => !done.includes(d.id));
  const slots = actions.projectSlots();
  const free = Math.max(0, slots - projects.length);
  const close = () => uiStore.update((u) => { u.projectPickerOpen = false; });

  const root = useRef<HTMLDivElement>(null);
  useDialog({ open, root, onClose: close });
  if (!open) return null;

  return (
    <div class="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={root} tabIndex={-1} class="modal glass strong picker" role="dialog" aria-modal="true" aria-label="Start a project">
        <div class="modal-head">
          <div>
            <div class="modal-title display">Start a project</div>
            <div class="muted small">{plural(free, 'free slot')} · {formatMoney(budget)} budget left</div>
          </div>
          <button class="round-btn" title="Close" aria-label="Close project selection" onClick={close}><CloseIcon /></button>
        </div>
        {feedback && <p class="action-feedback small" role="status" aria-atomic="true">{feedback}</p>}
        <div class="picker-list thin-scroll">
          {projectDefs.length === 0 && <div class="empty-box">No projects left to start.</div>}
          {projectDefs.map((def) => {
            const req = def.requires;
            const reqUnmet = !!req && (state.comms.trust[req.stakeholder] ?? 0) < req.min;
            const running = projects.some((p) => p.defId === def.id);
            const can = actions.canStartProject(def.id);
            const why = !connected ? 'Reconnect to the host to start a project.'
              : pending ? 'Waiting for the host to confirm your previous action.'
                : can.ok ? '' : can.reason === 'budget' ? `Needs ${formatMoney(def.costM)}; ${formatMoney(budget)} remains. Ask your crew to free budget or choose a cheaper project.`
                  : can.reason === 'noSlot' ? 'Both slots are occupied. Wait for a running project to finish.'
                    : can.reason === 'trust' && req ? `Raise ${SH[req.stakeholder].label} trust to ${req.min} through messages or other projects.`
                      : BLOCK_TEXT[can.reason ?? 'unknown'];
            const reviewing = reviewId === def.id;
            const partner = characterById(def.partnerCharacterId);
            return (
              <div key={def.id} class={`pick${reqUnmet ? ' locked' : ''}`} style={{ '--c': projectColor(def) } as Record<string, string>}>
                <div class="pick-main">
                  <div class="pick-top">
                    <b>{def.name}</b>
                    <span class="kind-pill">{KIND_LABEL[def.kind]}</span>
                    {running && <span class="kind-pill running">running</span>}
                    <span class="muted small num pick-time">{def.months} mo</span>
                  </div>
                  <div class="pick-desc">{def.description}{partner ? ` With ${partner.name}.` : ''}</div>
                  <div class="pick-row"><span class="tiny muted pick-when">Now</span>
                    <ChangeList lines={previewLines(state, startEffects(def), { costM: def.costM, shield: false })} empty="Free." />
                  </div>
                  <div class="pick-row"><span class="tiny muted pick-when">When done</span>
                    <ChangeList lines={previewLines(state, def.effects, { shield: false, at: state.clock.day + def.months * DAYS_PER_MONTH })} />
                  </div>
                  {state.clock.day + def.months * DAYS_PER_MONTH >= state.planner.plan.launchDay && <p class="project-timing-warning small">Finishes on or after the planned launch. Starting spends the cost and occupies a slot; completion effects need a later actual launch.</p>}
                  {req && (
                    <div class={`pick-req${reqUnmet ? ' unmet' : ''}`}>
                      Needs {SH[req.stakeholder].label} trust {req.min}{reqUnmet ? ` (now ${Math.round(state.comms.trust[req.stakeholder] ?? 0)})` : ' ✓'}
                    </div>
                  )}
                </div>
                <div class="pick-actions">
                  <button class="pill primary" aria-disabled={!!why} aria-describedby={why ? `project-block-${def.id}` : undefined}
                    aria-label={`Review starting ${def.name}`} aria-expanded={reviewing}
                    onClick={() => { if (!why) setReviewId(def.id); }}>
                    Start…
                  </button>
                </div>
                {why && <p id={`project-block-${def.id}`} class="action-reason">{why}</p>}
                {reviewing && <div ref={review} tabIndex={-1} class="project-review" aria-label={`Review ${def.name}`}>
                  <h3>Start {def.name}?</h3>
                  <p class="small">This commits the “Now” effects above and occupies a slot for {def.months} months. Completion effects apply only if it finishes before the actual launch. The project cannot be cancelled.</p>
                  <div class="review-actions">
                    <button class="pill" onClick={(e) => { setReviewId(null); e.currentTarget.closest('.pick')?.querySelector<HTMLButtonElement>('.pick-actions button')?.focus(); }}>Keep browsing</button>
                    <button class="pill primary" aria-disabled={!!why} aria-describedby={why ? `project-block-${def.id}` : undefined}
                      onClick={() => { if (!why) actions.startProject(def.id); }}>
                      {pending?.type === 'project' && pending.defId === def.id ? 'Starting…' : 'Confirm start'}
                    </button>
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
