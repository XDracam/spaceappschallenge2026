import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { coordinationActions, coordinationBoard, type CoordinationTask } from '../core/coordination';
import { STATIONS, type StationId } from '../core/model';
import { getState, useConfirmedGame, useGame, useSync } from '../core/store';
import type { TaskDraft } from '../shared/taskDraft';
import { confirmationStore } from '../shared/confirmation';
import { dayToDate, fmtDate } from '../stations/procurement/rules';
import { categoryOf, setUi as setProcurementUi } from '../stations/procurement/ui/uiState';
import { actions as commsActions, uiStore as commsUi } from '../stations/comms/ui/store';
import { highlightPart } from '../stations/planner/ui/common';
import { STATION_INFO } from './stations';
import './tasks.css';

/** Shared work is always reachable without leaving an occupied station. */
export function TaskBoard() {
  const station = useSync(s => s.station)!;
  const game = useGame(s => s);
  const board = useMemo(() => coordinationBoard(game), [game]);
  const tasks = board.tasks;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'tasks' | 'overview' | 'schedule'>('tasks');
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
  const waiting = visible.filter(task => task.status === 'open' && !Object.keys(task.actions).length);
  const active = visible.filter(task => !waiting.includes(task));
  const parentLabel = (request: CoordinationTask) => {
    if (!request.parentNeedId) return undefined;
    const parent = game.market.tasks.find(need => need.id === request.parentNeedId);
    return parent ? `${parent.title}${parent.status !== 'open' ? ` (${parent.status})` : ''}` : 'Original need is unavailable';
  };

  useEffect(() => {
    const compose = (event: Event) => {
      setDraft((event as CustomEvent<TaskDraft>).detail);
      setEditing('new');
      setView('tasks');
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
  const create = () => { setDraft(undefined); setEditing('new'); setView('tasks'); setNotice(''); };
  const workLink = (task: CoordinationTask) => task.links?.[station] ?? task.link;
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
      // Tender and partner offers are listed on the need they answer (the Calls view is gone).
      const offer = game.market.offers.find(item => item.id === link.offerId);
      if (!offer) return;
      const call = game.market.calls.find(item => item.id === offer.callId);
      setProcurementUi({ view: 'catalogue', offerId: offer.id, inspect: 'need', ...(call ? { focus: { taskId: call.taskId, criterionId: call.criterionId } } : {}) });
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
      const call = game.market.calls.find(item => item.id === link.callId);
      if (!call) return;
      setProcurementUi({ view: 'catalogue', inspect: 'need', focus: { taskId: call.taskId, criterionId: call.criterionId } });
    } else return;
    close();
  };
  const canOpen = (task: CoordinationTask) => {
    if (task.source === 'offer' && task.status !== 'open') return false;
    const kind = workLink(task)?.kind;
    return station === 'procurement' && (kind === 'procurement' || kind === 'contract' || kind === 'contracts' || kind === 'offer' || kind === 'call')
      || station === 'comms' && (kind === 'comms' || kind === 'commsProjects')
      || station === 'planner' && (kind === 'planner' || kind === 'plan' || kind === 'launch')
      || station === 'science' && (kind === 'science' || kind === 'scienceLab' || kind === 'scienceTech' || kind === 'scienceTest' || kind === 'scienceProject');
  };

  const requestControls = (request: CoordinationTask) => <RequestControls request={request} station={station} playing={playing} onEdit={request => setEditing(request)} />;
  const taskList = (entries: CoordinationTask[]) => <ul class="tasks-list">{entries.map(task => <TaskEntry key={task.id} task={task} playing={playing} history={history} parentLabel={parentLabel} requestControls={requestControls} canOpen={canOpen} openWork={openWork} />)}</ul>;

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
          <nav class="tasks-tabs" aria-label="Coordination views">
            <button type="button" class="shell-btn shell-btn-sm" aria-pressed={view === 'tasks'} onClick={() => setView('tasks')}>Tasks</button>
            <button type="button" class="shell-btn shell-btn-sm" aria-pressed={view === 'schedule'} onClick={() => setView('schedule')}>Schedule</button>
            <button type="button" class="shell-btn shell-btn-sm" aria-pressed={view === 'overview'} onClick={() => setView('overview')}>Mission overview</button>
          </nav>
          {view === 'tasks' && <>
          <label class="tasks-switch"><input type="checkbox" role="switch" aria-label="Only tasks I can solve" checked={forMe} onChange={event => setForMe(event.currentTarget.checked)} /><span>{forMe ? 'Tasks I can solve' : 'All tasks'}</span></label>
          <button type="button" class="shell-btn shell-btn-sm" disabled={!playing} onClick={create}>Create task</button>
          {!forMe && <label class="tasks-history"><input type="checkbox" checked={history} onChange={event => setHistory(event.currentTarget.checked)} />Include history</label>}
          </>}
        </div>
        <div class="tasks-scroll">
          {!playing && <p class="tasks-notice">Planning has closed. Shared tasks are available for review.</p>}
          {editing && <TaskForm key={editing === 'new' ? `new-${draft?.requestKey ?? draft?.title ?? ''}` : editing.id} task={editing === 'new' ? undefined : editing} draft={draft} station={station} onCancel={() => setEditing(null)} onSaved={() => {
            setEditing(null);
            setForMe(false);
            setNotice('Task saved to the shared list.');
          }} />}
          <p class="tasks-notice" role="status">{notice}</p>
          {view === 'schedule' && <>
            <h3 class="tasks-section-title">Shared schedule</h3>
            <p>Launch: <strong>{fmtDate(game.planner.plan.launchDay)}</strong>. Compare deliveries, research and test timing. Each request is resolved separately.</p>
            <label class="tasks-history"><input type="checkbox" checked={history} onChange={event => setHistory(event.currentTarget.checked)} />Include history</label>
            {taskList(board.schedule.filter(entry => history || entry.status === 'open'))}
            {!board.schedule.some(entry => history || entry.status === 'open') && <p class="tasks-empty">No scheduled work or timing requests yet.</p>}
          </>}
          {view === 'overview' && <MissionOverview entries={board.overview} canOpen={canOpen} openWork={openWork} />}
          {view === 'tasks' && <>
          {visible.length === 0 && <p class="tasks-empty">{forMe ? 'No shared tasks need action from your station right now. Review All tasks or Mission overview, or create a request.' : 'No tasks in this view. Create a task to record a shared need.'}</p>}
          {taskList(active)}
          {!!waiting.length && <details class="tasks-waiting"><summary>Waiting / in progress · {waiting.length}</summary><p class="tasks-meta">No station action is needed now. Dates and progress remain available below.</p>{taskList(waiting)}</details>}
          </>}
        </div>
      </section>}
    </div>
  );
}

type WorkNavigation = { canOpen(task: CoordinationTask): boolean; openWork(task: CoordinationTask): void };

function RoleActions({ task }: { task: CoordinationTask }) {
  return Object.keys(task.actions).length ? <ul class="tasks-role-actions">{STATIONS.filter(role => task.actions[role]).map(role => <li key={role}><strong>{STATION_INFO[role].label}</strong><span>{task.actions[role]}</span></li>)}</ul> : null;
}

function RequestControls({ request, station, playing, onEdit }: { request: CoordinationTask; station: StationId; playing: boolean; onEdit(request: CoordinationTask): void }) {
  if (!playing || (request.authorRole !== station && request.assignee !== station)) return null;
  return <div class="tasks-actions">{request.status === 'open' ? <>
    <button type="button" class="shell-btn shell-btn-sm" onClick={() => coordinationActions.setStatus(request.id, request.revision, 'completed')}>Complete request</button>
    <button type="button" class="shell-btn shell-btn-sm" onClick={() => onEdit(request)}>Edit request</button>
    <button type="button" class="shell-btn shell-btn-sm" onClick={() => coordinationActions.setStatus(request.id, request.revision, 'withdrawn')}>Withdraw request</button>
  </> : <button type="button" class="shell-btn shell-btn-sm" onClick={() => coordinationActions.setStatus(request.id, request.revision, 'open')}>Reopen request</button>}</div>;
}

function TaskEntry({ task, playing, history, parentLabel, requestControls, canOpen, openWork }: WorkNavigation & { task: CoordinationTask; playing: boolean; history: boolean; parentLabel(request: CoordinationTask): string | undefined; requestControls(request: CoordinationTask): preact.ComponentChildren }) {
  const manual = task.source === 'player' || task.source === 'effect';
  return <li class="tasks-item">
    <div class="tasks-item-head"><h3>{task.title}</h3><span class={`tasks-status is-${task.status}`}>{taskStatusLabel(task, playing)}</span></div>
    <div class="tasks-meta">From {STATION_INFO[task.authorRole].label} · {manual ? `For ${STATION_INFO[task.assignee].label}` : 'Live game state'}{task.neededAt !== undefined && <> · {task.source === 'project' || task.source === 'contract' ? 'Expected' : 'Needed'} {fmtDate(task.neededAt)}</>}</div>
    {parentLabel(task) && <p class="tasks-meta">Related need: {parentLabel(task)}</p>}
    <RoleActions task={task} />
    {manual ? <p class="tasks-description">{task.description}</p> : <details class="tasks-specifications"><summary>Specifications and progress</summary><p class="tasks-description">{task.description}</p></details>}
    {task.sourceText && !task.description.includes(task.sourceText) && <p class="tasks-description">Original requirement — {task.sourceText}</p>}
    {task.status === 'open' && canOpen(task) && <button type="button" class="shell-btn shell-btn-sm" onClick={() => openWork(task)}>Open work</button>}
    {manual && requestControls(task)}
    {!!task.requests?.length && <ul class="tasks-requests">{task.requests.filter(request => history || request.status === 'open').map(request => <li key={request.id}>
      <h4>{request.title}</h4>
      <div class="tasks-meta">From {STATION_INFO[request.authorRole].label} · For {STATION_INFO[request.assignee].label} · {taskStatusLabel(request, playing)}{request.neededAt !== undefined && <> · Needed {fmtDate(request.neededAt)}</>}</div>
      {parentLabel(request) && <p class="tasks-meta">Related need: {parentLabel(request)}</p>}
      <p class="tasks-description">{request.description}</p>
      {request.sourceText && !request.description.includes(request.sourceText) && <p class="tasks-description">Original requirement — {request.sourceText}</p>}
      {requestControls(request)}
    </li>)}</ul>}
    {!!task.related?.length && <RelatedWork entries={task.related} canOpen={canOpen} openWork={openWork} />}
  </li>;
}

function RelatedWork({ entries, canOpen, openWork }: { entries: CoordinationTask[]; canOpen(task: CoordinationTask): boolean; openWork(task: CoordinationTask): void }) {
  return <div class="tasks-related">{entries.map(entry => <details key={entry.id}>
    <summary>{entry.title}{entry.status !== 'open' && <span class={`tasks-related-status is-${entry.status}`}> · {entry.status[0].toUpperCase() + entry.status.slice(1)}</span>}</summary>
    <div class="tasks-meta">{entry.neededAt !== undefined && <>Date: {fmtDate(entry.neededAt)} · </>}From {STATION_INFO[entry.authorRole].label}</div>
    <RoleActions task={entry} />
    <p class="tasks-description">{entry.description}</p>
    {canOpen(entry) && <button type="button" class="shell-btn shell-btn-sm" onClick={() => openWork(entry)}>Open work</button>}
  </details>)}</div>;
}

function MissionOverview({ entries, canOpen, openWork }: { entries: CoordinationTask[]; canOpen(task: CoordinationTask): boolean; openWork(task: CoordinationTask): void }) {
  const groups = [
    { title: 'Mission goals and feasibility', items: entries.filter(entry => entry.source === 'planning') },
    { title: 'Communications decisions', items: entries.filter(entry => entry.source === 'event') },
    { title: 'Independent research and projects', items: entries.filter(entry => entry.source === 'project') },
    { title: 'Supply, Offers and optional testing', items: entries.filter(entry => ['contract', 'offer', 'procurement', 'research'].includes(entry.source)) },
    { title: 'Agency effects and services', items: entries.filter(entry => entry.source === 'modifier' || entry.source === 'notice' && !entry.id.startsWith('news:')) },
    { title: 'Shared news', items: entries.filter(entry => entry.id.startsWith('news:')) },
  ];
  return <div class="tasks-overview">{groups.filter(group => group.items.length).map(group => <section key={group.title}>
    <h3>{group.title}</h3>
    <RelatedWork entries={group.items} canOpen={canOpen} openWork={openWork} />
  </section>)}{entries.length === 0 && <p class="tasks-empty">No shared mission information yet.</p>}</div>;
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
  const [purpose, setPurpose] = useState(task?.purpose ?? draft?.purpose ?? 'request');
  const [parentNeedId, setParentNeedId] = useState(task?.parentNeedId ?? draft?.parentNeedId ?? '');
  const [neededDate, setNeededDate] = useState(() => {
    const day = task?.neededAt ?? draft?.neededAt;
    return day === undefined ? '' : dayToDate(day).toISOString().slice(0, 10);
  });
  const needs = useGame(s => s.market.tasks);
  const neededAt = neededDate ? Math.round((Date.parse(`${neededDate}T00:00:00Z`) - dayToDate(0).getTime()) / 86400000) : undefined;
  const invalidDate = !!neededDate && (!/^\d{4}-\d{2}-\d{2}$/.test(neededDate) || !Number.isFinite(neededAt) || neededAt! < 0 || dayToDate(neededAt!).toISOString().slice(0, 10) !== neededDate);
  const invalidParent = !!parentNeedId && !needs.some(need => need.id === parentNeedId && need.status === 'open') && parentNeedId !== task?.parentNeedId;
  const [requestId] = useState(() => crypto.randomUUID());
  const [expectedRevision] = useState(() => draft?.requestKey ? getState().coordination?.find(item => item.requestKey === draft.requestKey && item.authorRole === station)?.revision : undefined);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const titleInput = useRef<HTMLInputElement>(null);
  const detailsInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { titleInput.current?.focus(); }, []);
  const playing = useGame(s => s.meta.phase === 'planning');
  const confirmed = useConfirmedGame(s => s.coordination?.find(t => task ? t.id === task.id : draft?.requestKey ? t.requestKey === draft.requestKey && t.authorRole === station : t.id === `coord-${requestId}`));
  const current = useConfirmedGame(s => task ? s.coordination?.find(t => t.id === task.id) : undefined);
  const stale = !!task && (!current || current.revision !== task.revision || current.status !== 'open')
    || !task && !!draft?.requestKey && !!confirmed && confirmed.revision !== expectedRevision;
  useEffect(() => {
    if (submitted && confirmed && confirmed.title === title.trim() && confirmed.description === description.trim() && confirmed.assignee === assignee && (confirmed.purpose ?? 'request') === purpose && confirmed.parentNeedId === (parentNeedId || undefined) && confirmed.neededAt === neededAt) onSaved();
  }, [submitted, confirmed]);
  return <form class="tasks-form" onSubmit={event => {
    event.preventDefault();
    if (!playing || stale || invalidParent || invalidDate) return;
    if (!title.trim() || !description.trim()) {
      setError('Enter a title and desired outcome with enough detail for the receiving station.');
      if (!title.trim()) titleInput.current?.focus();
      else detailsInput.current?.focus();
      return;
    }
    setError('');
    if (task) coordinationActions.edit(task.id, task.revision, title, description, assignee, purpose, { parentNeedId: parentNeedId || undefined, neededAt });
    else coordinationActions.create(title, description, assignee, requestId, draft?.requestKey, purpose, expectedRevision, { parentNeedId: parentNeedId || undefined, neededAt });
    setSubmitted(true);
  }}>
    <h3>{task ? 'Edit task' : 'Create task'}</h3>
    <label>Title<input ref={titleInput} name="task-title" autoComplete="off" required maxLength={120} value={title} onInput={event => setTitle(event.currentTarget.value)} /></label>
    <label>Desired outcome & details<textarea ref={detailsInput} name="task-details" autoComplete="off" required maxLength={1000} rows={4} value={description} onInput={event => setDescription(event.currentTarget.value)} aria-describedby="task-detail-help" /></label>
    <p id="task-detail-help">Include the item or decision, quantity, requirements, recipient and need date where relevant. Give the receiving role enough information to act.</p>
    <label>Responsible station<select name="task-assignee" value={assignee} onChange={event => setAssignee(event.currentTarget.value as StationId)}>{STATIONS.map(role => <option key={role} value={role}>{STATION_INFO[role].label}</option>)}</select></label>
    <label>Purpose<select name="task-purpose" value={purpose} onChange={event => setPurpose(event.currentTarget.value as typeof purpose)}>
      <option value="request">Shared request</option><option value="funding">Funding</option>
      {(purpose === 'timing' || purpose === 'equipment') && <option value={purpose}>{purpose === 'timing' ? 'Timing (contextual request)' : 'Equipment (existing request)'}</option>}
    </select></label>
    <label>Related need (optional)<select name="task-parent" value={parentNeedId} onChange={event => setParentNeedId(event.currentTarget.value)} aria-describedby="task-parent-help">
      <option value="">Standalone request</option>
      {needs.filter(need => need.status === 'open' || need.id === parentNeedId).map(need => <option key={need.id} value={need.id}>{need.title}{need.status !== 'open' ? ` (${need.status})` : ''}</option>)}
      {parentNeedId && !needs.some(need => need.id === parentNeedId) && <option value={parentNeedId}>Original need unavailable</option>}
    </select></label>
    <p id="task-parent-help">Linked requests appear with that need. If it is withdrawn or unavailable, the request remains standalone. Funding requests stay in the funding group.</p>
    <label>Needed by (YYYY-MM-DD, optional)<input type="text" name="task-needed" autoComplete="off" placeholder="2030-06-30" value={neededDate} onInput={event => setNeededDate(event.currentTarget.value)} /></label>
    {invalidDate && <p role="alert">Enter a valid date on or after the mission start, using YYYY-MM-DD, or leave it blank.</p>}
    {invalidParent && <p role="alert">The selected need is no longer available. Choose another need or keep this request standalone.</p>}
    {stale && <p role="alert">This task changed while you were editing. Cancel and reopen its latest version.</p>}
    {error && <p role="alert">{error}</p>}
    {submitted && !stale && <p role="status">Waiting for the host to confirm this task.</p>}
    <div class="tasks-actions"><button type="submit" class="shell-btn" disabled={!playing || stale || invalidParent || invalidDate || submitted}>Save task</button><button type="button" class="shell-btn" onClick={onCancel}>Cancel</button></div>
  </form>;
}
