import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { coordinationActions, coordinationTasks, type CoordinationTask } from '../core/coordination';
import { STATIONS, type StationId } from '../core/model';
import { useConfirmedGame, useGame, useSync } from '../core/store';
import type { TaskDraft } from '../shared/taskDraft';
import { confirmationStore } from '../shared/confirmation';
import { fmtDate } from '../stations/procurement/rules';
import { categoryOf, setUi as setProcurementUi } from '../stations/procurement/ui/uiState';
import { actions as commsActions, uiStore as commsUi } from '../stations/comms/ui/store';
import { highlightPart } from '../stations/planner/ui/common';
import { STATION_INFO } from './stations';
import './tasks.css';

/** Shared work is always reachable without leaving an occupied station. */
export function TaskBoard() {
  const station = useSync(s => s.station)!;
  const game = useGame(s => s);
  const tasks = useMemo(() => coordinationTasks(game), [game]);
  const [open, setOpen] = useState(false);
  const [forMe, setForMe] = useState(true);
  const [history, setHistory] = useState(false);
  const [editing, setEditing] = useState<CoordinationTask | 'new' | null>(null);
  const [draft, setDraft] = useState<TaskDraft | undefined>();
  const [notice, setNotice] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const actionable = tasks.filter(t => t.status === 'open' && !!t.actions[station]);
  const visible = tasks.filter(t => forMe ? t.status === 'open' && !!t.actions[station] : history || t.status === 'open');
  const playing = game.meta.phase === 'planning';

  useEffect(() => {
    const compose = (event: Event) => {
      setDraft((event as CustomEvent<TaskDraft>).detail);
      setEditing('new');
      setNotice('');
      setOpen(true);
    };
    window.addEventListener('coordination-compose', compose);
    return () => window.removeEventListener('coordination-compose', compose);
  }, []);

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (confirmationStore.get()) return;
      if (event.key !== 'Escape' || editing) return;
      event.stopImmediatePropagation();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, editing]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const create = () => { setDraft(undefined); setEditing('new'); setNotice(''); };
  const workLink = (task: CoordinationTask) => {
    const link = task.link;
    if (station === 'comms' && task.actions.comms && (task.source === 'budget' || task.source === 'research' || task.source === 'procurement' || link?.kind === 'scienceProject')) return { kind: 'commsProjects' as const };
    if (station === 'procurement' && task.actions.procurement?.includes('cancellation terms') && (task.source === 'event' || task.source === 'research')) return { kind: 'contracts' as const };
    if (station === 'science' && task.actions.science?.includes('cancellation terms') && (task.source === 'event' || task.source === 'research')) return { kind: 'scienceLab' as const };
    if (task.source === 'budget') {
      if (station === 'procurement') return { kind: 'contracts' as const };
      if (station === 'science') return { kind: 'scienceLab' as const };
    }
    const partId = link?.kind === 'scienceTest' ? link.partId : link?.kind === 'scienceProject' ? game.research.projects.find(p => p.id === link.projectId)?.partId : undefined;
    if (station === 'planner' && partId && (link?.kind === 'scienceTest' || link?.kind === 'scienceProject')) return { kind: 'launch' as const };
    if (station === 'procurement' && partId) {
      const marketTask = game.market.tasks.find(item => item.partId === partId);
      const allocation = marketTask && game.market.allocations.find(item => item.taskId === marketTask.id && item.status !== 'released');
      if (allocation) return { kind: 'contract' as const, contractId: allocation.contractId };
      const criterion = marketTask?.criteria[0];
      if (marketTask && criterion) return { kind: 'procurement' as const, taskId: marketTask.id, criterionId: criterion.id };
    }
    if (station === 'planner' && link?.kind === 'procurement') {
      const partId = game.market.tasks.find(item => item.id === link.taskId)?.partId;
      if (partId) return { kind: 'planner' as const, partId };
      return { kind: 'plan' as const };
    }
    if (station === 'science' && link?.kind === 'contract') {
      const projectId = game.market.allocations.find(item => item.contractId === link.contractId && item.status !== 'released' && item.projectId)?.projectId;
      if (projectId) return { kind: 'scienceProject' as const, projectId };
    }
    return link;
  };
  const openWork = (task: CoordinationTask) => {
    const link = workLink(task);
    if (!link) return;
    if (station === 'procurement' && link.kind === 'procurement') {
      const criterion = game.market.tasks.find(t => t.id === link.taskId)?.criteria.find(c => c.id === link.criterionId);
      setProcurementUi({ view: 'catalogue', focus: { taskId: link.taskId, criterionId: link.criterionId }, inspect: 'need', category: criterion ? categoryOf(criterion.partKind) : 'all', query: '', matchesOnly: false });
    } else if (station === 'procurement' && link.kind === 'contract') {
      setProcurementUi({ view: 'contracts', contractId: link.contractId });
    } else if (station === 'procurement' && link.kind === 'contracts') {
      setProcurementUi({ view: 'contracts', contractId: null });
    } else if (station === 'procurement' && link.kind === 'offer') {
      const offer = game.market.offers.find(item => item.id === link.offerId);
      if (!offer) return;
      setProcurementUi({ view: 'calls', dialog: { type: 'sign', offerId: offer.id, qty: offer.remainingQuantity ?? offer.quantity } });
    } else if (station === 'comms' && link.kind === 'comms') {
      commsActions.select(link.instanceId);
    } else if (station === 'comms' && link.kind === 'commsProjects') {
      commsUi.update(ui => { ui.projectPickerOpen = true; });
    } else if (station === 'planner' && link.kind === 'planner') {
      highlightPart(link.partId);
    } else if (station === 'science' && (link.kind === 'science' || link.kind === 'scienceLab' || link.kind === 'scienceTech' || link.kind === 'scienceTest' || link.kind === 'scienceProject')) {
      window.dispatchEvent(new CustomEvent('coordination-science', { detail: link }));
    } else if (station === 'planner' && link.kind === 'plan') {
      window.dispatchEvent(new Event('coordination-plan'));
    } else if (station === 'planner' && link.kind === 'launch') {
      window.dispatchEvent(new Event('coordination-launch'));
    } else if (station === 'procurement' && link.kind === 'call') {
      setProcurementUi({ view: 'calls', callId: link.callId });
    } else return;
    close();
  };
  const canOpen = (task: CoordinationTask) => {
    const kind = workLink(task)?.kind;
    return station === 'procurement' && (kind === 'procurement' || kind === 'contract' || kind === 'contracts' || kind === 'offer' || kind === 'call')
      || station === 'comms' && (kind === 'comms' || kind === 'commsProjects')
      || station === 'planner' && (kind === 'planner' || kind === 'plan' || kind === 'launch')
      || station === 'science' && (kind === 'science' || kind === 'scienceLab' || kind === 'scienceTech' || kind === 'scienceTest' || kind === 'scienceProject');
  };

  return (
    <div class={`shell-tasks${playing ? '' : ' tasks-review'}`}>
      <button ref={trigger} type="button" class="shell-btn tasks-trigger" aria-expanded={open} aria-controls="shared-task-board" onClick={() => open ? close() : setOpen(true)}>
        Tasks <span class="tasks-count">{actionable.length}</span>
      </button>
      {open && <section id="shared-task-board" class="tasks-board" aria-label="Shared tasks">
        <header class="tasks-header">
          <div><h2 ref={heading} tabIndex={-1}>Shared tasks</h2><p>{STATION_INFO[station].label}</p></div>
          <button type="button" class="shell-btn shell-btn-sm" onClick={close}>Close</button>
        </header>
        <div class="tasks-toolbar">
          <label class="tasks-switch"><input type="checkbox" role="switch" aria-label="Only tasks I can solve" checked={forMe} onChange={event => setForMe(event.currentTarget.checked)} /><span>{forMe ? 'Tasks I can solve' : 'All tasks'}</span></label>
          <button type="button" class="shell-btn shell-btn-sm" disabled={!playing} onClick={create}>Create task</button>
          {!forMe && <label class="tasks-history"><input type="checkbox" checked={history} onChange={event => setHistory(event.currentTarget.checked)} />Include history</label>}
        </div>
        <div class="tasks-scroll">
          {!playing && <p class="tasks-notice">Planning has closed. Shared tasks are available for review.</p>}
          {editing && <TaskForm key={editing === 'new' ? `new-${draft?.title ?? ''}` : editing.id} task={editing === 'new' ? undefined : editing} draft={draft} station={station} onCancel={() => setEditing(null)} onSaved={() => {
            setEditing(null);
            setForMe(false);
            setNotice('Task saved to the shared list.');
          }} />}
          <p class="tasks-notice" role="status">{notice}</p>
          {visible.length === 0 && <p class="tasks-empty">{forMe ? 'No tasks need action from your station right now. Switch to All tasks to review shared progress or create a request.' : 'No tasks in this view. Create a task to record a shared need.'}</p>}
          <ul class="tasks-list">
            {visible.map(task => {
              const manual = task.source === 'player' || task.source === 'effect';
              const canEdit = playing && manual && (task.authorRole === station || task.assignee === station);
              return <li key={task.id} class="tasks-item">
                <div class="tasks-item-head"><h3>{task.title}</h3><span class={`tasks-status is-${task.status}`}>{taskStatusLabel(task, playing)}</span></div>
                <div class="tasks-meta">From {STATION_INFO[task.authorRole].label} · {manual ? `For ${STATION_INFO[task.assignee].label}` : 'Live game state'}{task.neededAt !== undefined && <> · {task.source === 'project' || task.source === 'contract' ? 'Expected' : task.source === 'modifier' ? 'Until' : 'Needed'} {fmtDate(task.neededAt)}</>}</div>
                <p class="tasks-description">{task.description}</p>
                {task.sourceText && !task.description.includes(task.sourceText) && <p class="tasks-description">Original requirement — {task.sourceText}</p>}
                {Object.entries(task.actions).length > 0 && <ul class="tasks-role-actions">{STATIONS.filter(role => task.actions[role]).map(role => <li key={role}><strong>{STATION_INFO[role].label}</strong><span>{task.actions[role]}</span></li>)}</ul>}
                <div class="tasks-actions">
                  {task.status === 'open' && canOpen(task) && <button type="button" class="shell-btn shell-btn-sm" onClick={() => openWork(task)}>Open work</button>}
                  {canEdit && task.status === 'open' && <>
                    <button type="button" class="shell-btn shell-btn-sm" onClick={() => { coordinationActions.setStatus(task.id, task.revision, 'completed'); setNotice('Completion requested. Switch to All tasks and include completed tasks to review its status.'); }}>Mark complete</button>
                    <button type="button" class="shell-btn shell-btn-sm" onClick={() => setEditing(task)}>Edit task</button>
                    <button type="button" class="shell-btn shell-btn-sm" onClick={() => { coordinationActions.setStatus(task.id, task.revision, 'withdrawn'); setNotice('Withdrawal requested. Include history in All tasks to review or reopen it.'); }}>Withdraw</button>
                  </>}
                  {canEdit && task.status !== 'open' && <button type="button" class="shell-btn shell-btn-sm" onClick={() => { coordinationActions.setStatus(task.id, task.revision, 'open'); setNotice('Reopen requested. The task list shows its current status.'); }}>Reopen</button>}
                </div>
              </li>;
            })}
          </ul>
        </div>
      </section>}
    </div>
  );
}

function taskStatusLabel(task: CoordinationTask, playing: boolean): string {
  if (task.status !== 'open') return task.status[0].toUpperCase() + task.status.slice(1);
  if (!playing) return 'Planning closed';
  if (Object.keys(task.actions).length) return 'Action needed';
  if (task.source === 'notice' || task.source === 'modifier') return 'For reference';
  return 'In progress';
}

function TaskForm({ task, draft, station, onCancel, onSaved }: { task?: CoordinationTask; draft?: TaskDraft; station: StationId; onCancel(): void; onSaved(): void }) {
  const [title, setTitle] = useState(task?.title ?? draft?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? draft?.description ?? '');
  const [assignee, setAssignee] = useState(task?.assignee ?? draft?.assignee ?? station);
  const [requestId] = useState(() => crypto.randomUUID());
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const titleInput = useRef<HTMLInputElement>(null);
  const detailsInput = useRef<HTMLTextAreaElement>(null);
  const playing = useGame(s => s.meta.phase === 'planning');
  const confirmed = useConfirmedGame(s => s.coordination?.find(t => t.id === (task?.id ?? `coord-${requestId}`)));
  const current = useConfirmedGame(s => task ? s.coordination?.find(t => t.id === task.id) : undefined);
  const stale = !!task && (!current || current.revision !== task.revision || current.status !== 'open');
  useEffect(() => {
    if (submitted && confirmed && confirmed.title === title.trim() && confirmed.description === description.trim() && confirmed.assignee === assignee) onSaved();
  }, [submitted, confirmed]);
  return <form class="tasks-form" onSubmit={event => {
    event.preventDefault();
    if (!playing || stale) return;
    if (!title.trim() || !description.trim()) {
      setError('Enter a title and desired outcome with enough detail for the receiving station.');
      if (!title.trim()) titleInput.current?.focus();
      else detailsInput.current?.focus();
      return;
    }
    setError('');
    if (task) coordinationActions.edit(task.id, task.revision, title, description, assignee);
    else coordinationActions.create(title, description, assignee, requestId);
    setSubmitted(true);
  }}>
    <h3>{task ? 'Edit task' : 'Create task'}</h3>
    <label>Title<input ref={titleInput} name="task-title" autoComplete="off" required maxLength={120} value={title} onInput={event => setTitle(event.currentTarget.value)} /></label>
    <label>Desired outcome & details<textarea ref={detailsInput} name="task-details" autoComplete="off" required maxLength={1000} rows={4} value={description} onInput={event => setDescription(event.currentTarget.value)} aria-describedby="task-detail-help" /></label>
    <p id="task-detail-help">Include the item or decision, quantity, requirements, recipient and need date where relevant. Give the receiving role enough information to act.</p>
    <label>Responsible station<select name="task-assignee" value={assignee} onChange={event => setAssignee(event.currentTarget.value as StationId)}>{STATIONS.map(role => <option key={role} value={role}>{STATION_INFO[role].label}</option>)}</select></label>
    {stale && <p role="alert">This task changed while you were editing. Cancel and reopen its latest version.</p>}
    {error && <p role="alert">{error}</p>}
    {submitted && !stale && <p role="status">Waiting for the host to confirm this task.</p>}
    <div class="tasks-actions"><button type="submit" class="shell-btn" disabled={!playing || stale || submitted}>Save task</button><button type="button" class="shell-btn" onClick={onCancel}>Cancel</button></div>
  </form>;
}
