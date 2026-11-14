import type { Task } from '../../../core/model';
import { useGame } from '../../../core/store';
import type { Science } from '../state/science';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';
import { recipeKey, recipesFor } from '../data/recipes';
import { formatDate, formatValue, keyCovered, keyInfo, neededValue, sci, taskAnswered } from '../model/research';

type Status = 'open' | 'running' | 'done';
const STATUS: Record<Status, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'st-open' },
  running: { label: 'Researching', cls: 'st-running' },
  done: { label: 'Within research', cls: 'st-done' },
};

/**
 * Requests from Mission Planning: the planner's ordered parts that are beyond research
 * (shared Tasks with beyondResearch keys). Science answers a key with a project whose
 * recipe raises that limit or unlocks that part; the fields of such recipes are marked
 * on the map, but the player still has to find the combination on the bench.
 */
export function TaskPanel({ s }: { s: Science }) {
  const research = useGame((g) => g.research);
  const day = useGame((g) => g.clock.day);
  const discovered = useGame((g) => sci(g).discovered);
  const info = useGame((g) => sci(g).info);
  const tasks = useGame((g) => g.market.tasks);
  const ownTasks = tasks.filter((t) => t.authorRole === 'science' && t.status === 'open');
  const runningKeys = new Map<string, number>();
  for (const p of research.projects) {
    if (p.status !== 'running') continue;
    const prog = Math.min(1, Math.max(0, (day - p.startedAt) / Math.max(1, p.endsAt - p.startedAt)));
    for (const e of p.effects) if (e.kind === 'researchLimit' || e.kind === 'unlock') runningKeys.set(e.key, prog);
  }
  const runningRecipe = new Map<string, number>();
  for (const p of research.projects) {
    const k = info[p.id]?.recipeKey;
    if (p.status === 'running' && k) runningRecipe.set(k, Math.min(1, Math.max(0, (day - p.startedAt) / Math.max(1, p.endsAt - p.startedAt))));
  }

  const statusOf = (t: Task): Status =>
    taskAnswered(research, t) ? 'done' : t.beyondResearch.some((k) => !keyCovered(research, t, k) && runningKeys.has(k)) ? 'running' : 'open';
  const openCount = s.requests.filter((t) => statusOf(t) !== 'done').length;

  return (
    <div class="stack-8">
      <div class="row baseline">
        <h2 class="eyebrow">Requests from Mission Planning</h2>
        <span class="grow" />
        <span class="num small muted nowrap">{openCount} open</span>
      </div>
      {s.requests.length === 0 && (
        <div class="empty-box small muted">
          No requests yet. When Mission Planning orders a part beyond the research limits, it shows up here. Meanwhile, any project
          that raises a limit makes their next design cheaper to build.
        </div>
      )}
      {s.requests.map((t) => {
        const on = s.activeTask?.id === t.id;
        const st = statusOf(t);
        const dueIn = Math.ceil(t.neededAt - day);
        return (
          <div key={t.id} class={'task' + (on ? ' on' : '')}>
            <button class="task-head" aria-expanded={on} onClick={() => s.selectTask(t.id)}>
              <span class="grow left">
                <strong>{t.title}</strong>
                <span class="small muted task-sub">needed by {formatDate(t.neededAt)}{dueIn > 0 ? ` · ${dueIn} d` : ' · overdue'}</span>
              </span>
              <span class={'tag ' + STATUS[st].cls}>{STATUS[st].label}</span>
            </button>
            {on && (
              <div class="task-body">
                {t.beyondResearch.map((k) => {
                  const ki = keyInfo(k);
                  const covered = keyCovered(research, t, k);
                  const need = neededValue(t, k);
                  const have = research.limits[k];
                  const recipes = recipesFor(k);
                  const known = recipes.filter((r) => discovered.includes(recipeKey(r.ids)));
                  const hidden = recipes.length - known.length;
                  return (
                    <div key={k} class={'need' + (covered ? ' met' : '')}>
                      <div class="row baseline">
                        <span class={'mark ' + (covered ? 'green' : 'amber')} aria-hidden="true">{covered ? '✓' : '●'}</span>
                        <span class="grow">{ki.stat ? ki.label : `Unlock: ${ki.label}`}</span>
                      </div>
                      <div class="small muted indent">
                        {ki.stat
                          ? `limit ${have !== undefined ? formatValue(have, ki.unit) : '—'}, needs ${need !== undefined ? formatValue(need, ki.unit) : '?'}`
                          : covered ? 'unlocked' : 'not unlocked yet'}
                        {!covered && runningKeys.has(k) && <span class="blue"> · researching {Math.round((runningKeys.get(k) ?? 0) * 100)}%</span>}
                      </div>
                      {!covered && (
                        <div class="stack-4 indent">
                          {known.map((r) => {
                            const key = recipeKey(r.ids);
                            const prog = runningRecipe.get(key);
                            return (
                              <div key={key} class="row idea">
                                <span class="grow small">{r.title}</span>
                                {prog !== undefined
                                  ? <span class="small blue nowrap">running {Math.round(prog * 100)}%</span>
                                  : <button class="btn small" onClick={() => s.draftIdea(key)}>Draft</button>}
                              </div>
                            );
                          })}
                          {hidden > 0 && (
                            <div class="small soft">
                              {hidden === recipes.length ? '' : '+ '}{hidden} undiscovered idea{hidden === 1 ? '' : 's'}: combine the marked fields
                            </div>
                          )}
                          {recipes.length === 0 && <div class="small muted">No research route known. Procurement can buy it dear, or Comms can negotiate.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {s.relatedFields.size > 0 && (
                  <>
                    <div class="eyebrow">Marked fields</div>
                    <div class="row wrap">
                      {[...s.relatedFields].map((id) => (
                        <button key={id} class="neighbor" onClick={() => s.select(id)}>
                          <span class="dot" style={{ background: DISCIPLINES[GRAPH.byId[id].discipline].color }} />
                          {GRAPH.byId[id].label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {ownTasks.length > 0 && (
        <div class="stack-4">
          <h2 class="eyebrow">Our requests to Procurement</h2>
          {ownTasks.map((t) => (
            <div key={t.id} class="small soft own-task">{t.title} <span class="muted">· by {formatDate(t.neededAt)}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}
