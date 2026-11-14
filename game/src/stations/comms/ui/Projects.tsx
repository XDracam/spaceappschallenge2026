import { useEffect } from 'preact/hooks';
import type { ActiveProject, ProjectDef, ProjectKind } from '../model/types';
import { PROJECTS } from '../data/content';
import { MAX_PROJECT_SLOTS, TRUST_STRONG } from '../data/mission';
import { useGame } from '../../../core/store';
import { actions, uiStore, useBudgetLeft, useComms, useLaunched, useUi } from './store';
import type { ProjectBlock } from '../state/world';
import {
  CloseIcon, HintPills, InternalTag, SH, characterById, projectById, trustHints,
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
  unknown: 'Unknown project', launched: 'Mission launched', running: 'Already running',
  noSlot: 'No free slot', trust: 'Requirement not met', budget: 'Not enough budget',
};

const openPicker =() => uiStore.update((u) => { u.projectPickerOpen = true; });

/** Right panel: running projects in slots, empty slots, locked third slot. */
export function Projects() {
  const projects = useComms((s) => s.projects);
  useComms((s) => s.trust); // re-render when trust changes slot count
  const launched = useLaunched();
  const slots = actions.projectSlots();
  const free = Math.max(0, slots - projects.length);

  return (
    <section class="projects glass">
      <div class="panel-head">
        <span class="label">Projects · {projects.length} of {slots}</span>
      </div>
      <div class="panel-scroll thin-scroll">
        {projects.map((p) => <ProjectCard key={p.instanceId} p={p} />)}
        {Array.from({ length: free }, (_, i) => (
          <button key={`free${i}`} class="slot-empty" disabled={launched} onClick={openPicker}>
            <span class="slot-plus">+</span> Start a project
          </button>
        ))}
        {slots < MAX_PROJECT_SLOTS && (
          <div class="slot-locked" title="Reach strong trust with any stakeholder to open another slot">
            <span class="lock">⌁</span> Slot {slots + 1} opens at strong trust ({TRUST_STRONG}+) with any stakeholder
          </div>
        )}
        {projects.length === 0 && (
          <p class="muted small panel-note">
            Projects cost money and calendar time. Galas and campaigns build trust; negotiations can win parts, research or money from partners.
          </p>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ p }: { p: ActiveProject }) {
  const def = projectById(p.defId);
  const day = useGame((s) => Math.floor(s.clock.day * 4) / 4);
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
      {def && (
        <div class="proj-hints">
          <HintPills hints={trustHints(def.effects.flatMap((e) => (e.kind === 'trust' ? [e] : [])))} />
          <InternalTag effects={def.effects} />
        </div>
      )}
      <div class="pbar"><i style={{ width: `${frac * 100}%` }} /></div>
    </div>
  );
}

/** Modal list of PROJECTS to start. */
export function ProjectPicker() {
  const open = useUi((u) => u.projectPickerOpen);
  const projects = useComms((s) => s.projects);
  const budget = useBudgetLeft();
  const trust = useComms((s) => s.trust);
  useLaunched(); // re-render on launch (canStartProject)
  const slots = actions.projectSlots();
  const free = Math.max(0, slots - projects.length);
  const close = () => uiStore.update((u) => { u.projectPickerOpen = false; });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;

  return (
    <div class="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div class="modal glass strong picker" role="dialog" aria-label="Start a project">
        <div class="modal-head">
          <div>
            <div class="modal-title display">Start a project</div>
            <div class="muted small">{plural(free, 'free slot')} · {formatMoney(budget)} budget left</div>
          </div>
          <button class="round-btn" title="Close" onClick={close}><CloseIcon /></button>
        </div>
        <div class="picker-list thin-scroll">
          {PROJECTS.length === 0 && <div class="empty-box">No projects available yet.</div>}
          {PROJECTS.map((def) => {
            const req = def.requires;
            const reqUnmet = !!req && (trust[req.stakeholder] ?? 0) < req.min;
            const running = projects.some((p) => p.defId === def.id);
            const can = actions.canStartProject(def.id);
            const why = can.ok ? '' : BLOCK_TEXT[can.reason ?? 'unknown'];
            const partner = characterById(def.partnerCharacterId);
            return (
              <div key={def.id} class={`pick${reqUnmet ? ' locked' : ''}`} style={{ '--c': projectColor(def) } as Record<string, string>}>
                <div class="pick-main">
                  <div class="pick-top">
                    <b>{def.name}</b>
                    <span class="kind-pill">{KIND_LABEL[def.kind]}</span>
                    {running && <span class="kind-pill running">running</span>}
                  </div>
                  <div class="pick-desc">{def.description}{partner ? ` With ${partner.name}.` : ''}</div>
                  <div class="pick-meta">
                    <span class="num"><b>{formatMoney(def.costM)}</b> · {def.months} mo</span>
                    {def.startTrust.length > 0 && (
                      <span class="pick-group"><span class="tiny muted">on start</span><HintPills hints={trustHints(def.startTrust)} /></span>
                    )}
                    {def.effects.some((e) => e.kind === 'trust') && (
                      <span class="pick-group"><span class="tiny muted">result</span>
                        <HintPills hints={trustHints(def.effects.flatMap((e) => (e.kind === 'trust' ? [e] : [])))} />
                      </span>
                    )}
                    <InternalTag effects={def.effects} />
                  </div>
                  {req && (
                    <div class={`pick-req${reqUnmet ? ' unmet' : ''}`}>
                      Needs {SH[req.stakeholder].label} trust {req.min}{reqUnmet ? ` (now ${Math.round(trust[req.stakeholder] ?? 0)})` : ' ✓'}
                    </div>
                  )}
                </div>
                <button class="pill primary" disabled={!can.ok} title={why || `Start ${def.name}`}
                  onClick={() => { actions.startProject(def.id); close(); }}>
                  Start
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
