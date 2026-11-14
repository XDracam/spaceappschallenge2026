// science station game logic: reducers (defineActions('science', …)) and tick handlers (onTick).
// Imported eagerly by core/registerStations.ts — must not import UI code.
//
// Loop: the science player combines fields into a project idea (UI), then starts
// it here. A project spends its cost at once, runs for months on the shared
// calendar (comms researchPace modifiers speed it up or slow it down) and is
// rolled at its end: success applies its effects to the shared research state
// (planner limits / unlocks / flags), failure raises 'research.failed'.
import { defineActions, onTick, type ActionCtx } from '../../core/actions';
import { pushNews, setFlag } from '../../core/coreActions';
import type { Effect, ResearchProject, Task } from '../../core/model';
import type { GameState } from '../../core/state';
import { budgetAvailableM } from '../../core/state';
import type { MethodId, ScienceSlice, ScopeId } from './slice';
import { initialScienceSlice } from './slice';
import { recipeByKey } from './data/recipes';
import { FAILURE_LINES, LONG_SHOT_FINDINGS } from './data/flavour';
import {
  TEST_UNIT_BONUS, describeEffect, fieldLabel, formatMonth, keyCovered, keyInfo, planProject, requestsTouchedBy, running,
} from './model/research';

/** Fill science slice fields missing from older saves. */
function ensure(s: GameState): ScienceSlice {
  const d = initialScienceSlice();
  const x = (s.science ??= d) as Partial<ScienceSlice>;
  x.revealed ??= d.revealed;
  x.slots ??= d.slots;
  x.discovered ??= d.discovered;
  x.info ??= d.info;
  s.research.modifiers ??= [];
  return s.science;
}

function applyEffects(s: GameState, effects: Effect[]): void {
  for (const e of effects) {
    if (e.kind === 'researchLimit') s.research.limits[e.key] = Math.max(s.research.limits[e.key] ?? -Infinity, e.value);
    else if (e.kind === 'unlock') { if (!s.research.unlocked.includes(e.key)) s.research.unlocked.push(e.key); }
    else if (e.kind === 'flag') setFlag(s, e.flag, e.on);
  }
}

/** Has the test unit for this task been delivered (or is it in hand)? */
function testUnitDelivered(s: GameState, taskId: string | undefined, day: number): boolean {
  if (!taskId) return false;
  return s.market.allocations.some((a) => {
    if (a.taskId !== taskId || a.status === 'released') return false;
    const c = s.market.contracts.find((k) => k.id === a.contractId);
    return !!c && c.status === 'delivered' && (c.deliveredAt ?? day) <= day;
  });
}

function pick<T>(list: T[], ctx: ActionCtx): T {
  return list[Math.floor(ctx.rng() * list.length) % list.length];
}

function resolve(s: GameState, ctx: ActionCtx, p: ResearchProject): void {
  const sl = ensure(s);
  const info = sl.info[p.id];
  const bonus = testUnitDelivered(s, info?.testTaskId, ctx.day) ? TEST_UNIT_BONUS : 0;
  const chance = Math.min(0.97, p.successChance + bonus);
  const ok = ctx.rng() < chance;
  if (info) info.endedAt = ctx.day;

  // A test unit nobody contracted is no longer needed.
  const test = info?.testTaskId ? s.market.tasks.find((t) => t.id === info.testTaskId) : undefined;
  if (test && test.status === 'open' && !s.market.allocations.some((a) => a.taskId === test.id)) {
    test.status = 'withdrawn';
    test.updatedAt = ctx.day;
  }

  if (!ok) {
    p.status = 'failed';
    setFlag(s, 'research.failed', true);
    pushNews(s, {
      from: 'science',
      text: `Science: "${p.title}" failed. ${pick(FAILURE_LINES, ctx)}`,
      affects: p.taskId ? ['planner'] : [],
      internal: !!p.taskId,
    }, ctx.newId);
    return;
  }

  p.status = 'succeeded';
  const before = structuredClone(s.research);
  const keys = p.effects.flatMap((e) => (e.kind === 'researchLimit' || e.kind === 'unlock' ? [e.key] : []));
  const touched = requestsTouchedBy(s, keys);
  applyEffects(s, p.effects);

  if (keys.length === 0) {
    // Pure science: a finding for the press (comms) and the shared flags.
    const recipe = info ? recipeByKey(info.recipeKey) : undefined;
    const finding = recipe?.finding ?? pick(LONG_SHOT_FINDINGS, ctx).replace('{fields}', p.fieldIds.map(fieldLabel).join(' and '));
    pushNews(s, { from: 'science', text: `Science: "${p.title}" succeeded: ${finding}`, affects: ['comms'], internal: false }, ctx.newId);
    return;
  }

  const gains = p.effects.filter((e) => e.kind !== 'flag').map((e) => describeEffect(e, before)).join('; ');
  let text = `Science: "${p.title}" succeeded. ${gains}.`;
  if (touched.length > 0) {
    setFlag(s, 'research.breakthrough', true);
    for (const t of touched) {
      const left = t.beyondResearch.filter((k) => !keyCovered(s.research, t, k));
      text += left.length === 0
        ? ` Your order "${t.title}" is now within research.`
        : ` Your order "${t.title}" still needs: ${left.map((k) => keyInfo(k).label).join(', ')}.`;
    }
  }
  pushNews(s, { from: 'science', text, affects: ['planner', 'procurement'], internal: true }, ctx.newId);
}

export const scienceActions = defineActions('science', {
  /** The team found a recipe on the bench (kept in the idea notebook). */
  discover(s, _ctx, recipeKey: string) {
    const sl = ensure(s);
    if (recipeByKey(recipeKey) && !sl.discovered.includes(recipeKey)) sl.discovered.push(recipeKey);
  },

  /**
   * Start a research project. projectId is made by the UI. Spends the cost at once.
   * requestTestPart: with method 'new', post a Task to Procurement for the recipe's test unit.
   */
  startProject(s, ctx, projectId: string, recipeKey: string, scope: ScopeId, method: MethodId, requestTestPart = false) {
    const sl = ensure(s);
    if (s.research.projects.some((p) => p.id === projectId)) return;
    const plan = planProject(s, recipeKey, scope, method);
    if (plan.blocked) return;
    if (plan.costM > budgetAvailableM(s.budget) + 1e-9) return;

    s.budget.spentM = Math.round((s.budget.spentM + plan.costM) * 100) / 100;
    const answers = requestsTouchedBy(s, plan.keys);
    const project: ResearchProject = {
      id: projectId,
      title: plan.title,
      fieldIds: plan.fieldIds,
      ...(answers[0] ? { taskId: answers[0].id } : {}),
      costM: plan.costM,
      startedAt: ctx.day,
      endsAt: ctx.day + plan.days,
      status: 'running',
      successChance: plan.successChance,
      effects: plan.effects,
    };
    s.research.projects.push(project);
    sl.info[projectId] = { recipeKey: plan.recipeKey, scope, method };
    if (!sl.discovered.includes(plan.recipeKey) && plan.recipe) sl.discovered.push(plan.recipeKey);

    const tp = plan.recipe?.testPart;
    if (requestTestPart && method === 'new' && tp) {
      const beyond: string[] = [];
      const uk = `${tp.partKind}.${tp.variant}`;
      if (!s.research.unlocked.includes(uk)) beyond.push(uk);
      for (const [stat, v] of Object.entries(tp.minimums)) {
        const lim = s.research.limits[`${uk}.${stat}`];
        if (lim !== undefined && v > lim + 1e-9) beyond.push(`${uk}.${stat}`);
      }
      const task: Task = {
        id: ctx.newId('task'),
        revision: 1,
        authorRole: 'science',
        title: `${tp.label} for "${plan.title}"`,
        criteria: [{ id: ctx.newId('crit'), label: tp.label, partKind: tp.partKind, variant: tp.variant, minimums: { ...tp.minimums }, quantity: 1 }],
        neededAt: Math.round(ctx.day + plan.days * 0.6),
        priority: 'normal',
        status: 'open',
        beyondResearch: beyond,
        createdAt: ctx.day,
        updatedAt: ctx.day,
      };
      s.market.tasks.push(task);
      sl.info[projectId].testTaskId = task.id;
      pushNews(s, {
        from: 'science',
        text: `Science asks Procurement for a ${tp.label.toLowerCase()} by ${formatMonth(task.neededAt)} (project "${plan.title}").`,
        affects: ['procurement'], internal: true,
      }, ctx.newId);
    }

    for (const t of answers) {
      pushNews(s, {
        from: 'science',
        text: `Science started "${plan.title}" for your order "${t.title}". Result expected ${formatMonth(project.endsAt)}, odds ${Math.round(plan.successChance * 100)}%.`,
        affects: ['planner'], internal: true,
      }, ctx.newId);
    }
  },

  /** Stop a running project. Half of the unspent share of its cost comes back. */
  cancelProject(s, ctx, projectId: string) {
    const sl = ensure(s);
    const p = s.research.projects.find((x) => x.id === projectId && x.status === 'running');
    if (!p) return;
    const total = Math.max(1, p.endsAt - p.startedAt);
    const left = Math.min(1, Math.max(0, (p.endsAt - ctx.day) / total));
    const refund = Math.round(p.costM * left * 0.5 * 10) / 10;
    s.budget.spentM = Math.max(0, Math.round((s.budget.spentM - refund) * 100) / 100);
    p.status = 'failed';
    const info = sl.info[projectId];
    if (info) {
      info.cancelled = true;
      info.endedAt = ctx.day;
      const test = info.testTaskId ? s.market.tasks.find((t) => t.id === info.testTaskId) : undefined;
      if (test && test.status === 'open' && !s.market.allocations.some((a) => a.taskId === test.id)) {
        test.status = 'withdrawn';
        test.updatedAt = ctx.day;
      }
    }
    if (p.taskId) {
      pushNews(s, { from: 'science', text: `Science stopped "${p.title}". Your order needs another route.`, affects: ['planner'], internal: true }, ctx.newId);
    }
  },
});

onTick('science', (s, ctx, fromDay, toDay) => {
  ensure(s);
  const dt = toDay - fromDay;
  // Comms researchPace effects: +pct % runs faster (ends earlier), −pct % slower.
  const pct = Math.max(-90, s.research.modifiers.filter((m) => m.untilDay > fromDay).reduce((a, m) => a + m.effect.pct, 0));
  for (const p of running(s.research)) {
    if (pct !== 0) p.endsAt -= dt * (pct / 100);
    if (p.endsAt <= toDay) resolve(s, ctx, p);
  }
  if (s.research.modifiers.length) s.research.modifiers = s.research.modifiers.filter((m) => m.untilDay > toDay);
});
