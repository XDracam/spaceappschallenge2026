import type { Science } from '../state/science';
import type { TaskStatus } from '../model/types';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'st-open' },
  running: { label: 'Running', cls: 'st-running' },
  done: { label: 'Done', cls: 'st-done' },
};

/**
 * Tasks posted by the Mission Planning module. The buttons stand in for the real flow: starting research
 * would create a project (see the draft screen) and finishing it would raise the limit in the planner.
 */
export function TaskPanel({ s }: { s: Science }) {
  const open = s.tasks.filter((t) => t.status !== 'done').length;
  return (
    <div class="stack-8">
      <div class="row baseline">
        <h2 class="eyebrow">Tasks from Mission Planning</h2>
        <span class="grow" />
        <span class="mono small nowrap">{open} open</span>
      </div>
      {s.tasks.map((t) => {
        const on = s.activeTask?.id === t.id;
        return (
          <div key={t.id} class={'task' + (on ? ' on' : '')}>
            <button class="task-head" aria-expanded={on} onClick={() => s.selectTask(t.id)}>
              <span class="grow left">
                <strong>{t.title}</strong>
                <span class="small muted task-sub">needed in {t.dueInDays} d</span>
              </span>
              <span class={'pill ' + STATUS[t.status].cls}>{STATUS[t.status].label}</span>
            </button>
            {on && (
              <div class="task-body">
                <div class="soft">{t.detail}</div>
                <div class="small muted">{t.why}</div>
                <div class="eyebrow">Related fields</div>
                <div class="row wrap">
                  {t.fieldIds.map((id) => (
                    <button key={id} class="neighbor" onClick={() => s.select(id)}>
                      <span class="dot" style={{ background: DISCIPLINES[GRAPH.byId[id].discipline].color }} />
                      {GRAPH.byId[id].label}
                    </button>
                  ))}
                </div>
                {t.status === 'open' && (
                  <button class="primary full" onClick={() => s.setTaskStatus(t.id, 'running')}>
                    Start research ({t.duration})
                  </button>
                )}
                {t.status === 'running' && (
                  <div class="stack-6">
                    <div class="small soft">Research is under way, {t.duration}. Mission Planning sees the task as pending.</div>
                    <button class="ghost" onClick={() => s.setTaskStatus(t.id, 'done')}>Stand-in: finish research now</button>
                  </div>
                )}
                {t.status === 'done' && (
                  <div class="small green">
                    {t.kind === 'unlock' ? `${t.part} is unlocked.` : `Research limit raised for ${t.part}.`} The result goes to Mission
                    Planning once the stations are connected.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
