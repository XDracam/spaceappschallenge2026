// Shared coordination board. Procurement and research entries are projections of
// authoritative game state; player requests are explicit, replicated records.
import { defineActions } from './actions';
import { STATIONS, type StationId } from './model';
import { budgetAvailableM, type GameState } from './state';
import { criterionCoverage, fmtDate, fmtStatValue, offersForCriterion, sameHardware } from '../stations/procurement/rules';
import { contractTiming } from '../stations/procurement/timing';
import { describeNeed, designNeeds, formatValue, keyInfo, sci } from '../stations/science/model/research';
import { ancestors, blockInfo, routesFor, startCheck, techsFor } from '../stations/science/model/tree';
import { partTests, testCheck, testCounts, testDays } from '../stations/science/model/tests';
import { TECH_BY_ID } from '../stations/science/data/techs';
import { canStartProject, contentOf, getEventDef, getProjectDef, missionConstraintFlag, optionEffects } from '../stations/comms/state/world';
import { describeEffect } from '../stations/comms/state/format';
import { allParts } from '../stations/planner/model/rocketUtils';
import { cachedPlannerGame, evaluationOf, partStatus } from '../stations/planner/derive';
export type CoordinationStatus = 'open' | 'completed' | 'withdrawn';
export type CoordinationLink = {
  kind: 'procurement';
  taskId: string;
  criterionId: string;
} | {
  kind: 'offer';
  offerId: string;
} | {
  kind: 'call';
  callId: string;
} | {
  kind: 'plan';
} | {
  kind: 'budget';
} | {
  kind: 'scienceProject';
  projectId: string;
} | {
  kind: 'contract';
  contractId: string;
} | {
  kind: 'comms';
  instanceId: string;
} | {
  kind: 'science';
} | {
  kind: 'scienceTech';
  techId: string;
} | {
  kind: 'scienceTest';
  partId: string;
} | {
  kind: 'planner';
  partId: string;
};
export interface PlayerCoordinationTask {
  id: string;
  revision: number;
  title: string;
  description: string;
  authorRole: StationId;
  assignee: StationId;
  status: CoordinationStatus;
  createdAt: number;
  updatedAt: number;
  origin?: 'effect';
  /** Preserve the authored requirement when players edit the working description. */
  sourceText?: string;
}
export interface CoordinationTask extends Omit<PlayerCoordinationTask, 'status'> {
  status: CoordinationStatus | 'failed' | 'expired';
  source: 'player' | 'effect' | 'procurement' | 'research' | 'offer' | 'contract' | 'event' | 'project' | 'modifier' | 'budget' | 'planning' | 'notice';
  actions: Partial<Record<StationId, string>>;
  neededAt?: number;
  link?: CoordinationLink;
}
const validRole = (v: unknown): v is StationId => typeof v === 'string' && STATIONS.includes(v as StationId);
export const coordinationActions = defineActions('coordination', {
  create(s, ctx, title: string, description: string, assignee: StationId, requestId?: string) {
    if (s.meta.phase !== 'planning' || !validRole(ctx.by) || !validRole(assignee) || typeof title !== 'string' || typeof description !== 'string')
      return;
    title = title.trim();
    description = description.trim();
    if (!title || title.length > 120 || !description || description.length > 1000)
      return;
    if (requestId !== undefined && (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(requestId)))
      return;
    const id = requestId === undefined ? ctx.newId('coord') : `coord-${requestId}`;
    if ((s.coordination ?? []).some(t => t.id === id))
      return;
    (s.coordination ??= []).push({
      id,
      revision: 1,
      title,
      description,
      authorRole: ctx.by,
      assignee,
      status: 'open',
      createdAt: ctx.day,
      updatedAt: ctx.day
    });
  },
  edit(s, ctx, id: string, revision: number, title: string, description: string, assignee: StationId) {
    if (s.meta.phase !== 'planning' || !validRole(ctx.by) || !validRole(assignee) || typeof title !== 'string' || typeof description !== 'string')
      return;
    title = title.trim();
    description = description.trim();
    if (!title || title.length > 120 || !description || description.length > 1000)
      return;
    const task = (s.coordination ?? []).find(t => t.id === id);
    if (!task || task.status !== 'open' || task.revision !== revision || (ctx.by !== task.authorRole && ctx.by !== task.assignee))
      return;
    if (task.origin === 'effect' && !task.sourceText) {
      const content = contentOf(s);
      const effects = [
        ...content.events.flatMap(event => [...event.options.flatMap(optionEffects), ...event.ignored.effects]),
        ...content.projects.flatMap(project => project.effects),
      ];
      const source = effects.find(effect => effect.kind === 'missionConstraint' && task.description.startsWith(effect.text));
      if (source?.kind === 'missionConstraint') task.sourceText = source.text;
    }
    task.title = title;
    task.description = description;
    task.assignee = assignee;
    task.updatedAt = ctx.day;
    task.revision++;
  },
  setStatus(s, ctx, id: string, revision: number, status: CoordinationStatus) {
    if (s.meta.phase !== 'planning' || !validRole(ctx.by) || !['open', 'completed', 'withdrawn'].includes(status))
      return;
    const task = (s.coordination ?? []).find(t => t.id === id);
    if (!task || task.revision !== revision || (ctx.by !== task.authorRole && ctx.by !== task.assignee) || task.status === status)
      return;
    task.status = status;
    task.updatedAt = ctx.day;
    task.revision++;
  },
});
/** Current work and history. Actions identify who can usefully act now. */
export function coordinationTasks(s: GameState): CoordinationTask[] {
  const playing = s.meta.phase === 'planning';
  const result: CoordinationTask[] = (s.coordination ?? []).map(t => ({
    ...t,
    source: t.origin === 'effect' ? 'effect' : 'player',
    actions: playing && t.status === 'open' ? {
      [t.assignee]: 'Review the request and mark it complete when satisfied.'
    } : {},
  }));
  for (const t of s.market.tasks) {
    for (const c of t.criteria) {
      const coverage = criterionCoverage(s, t, c);
      const hardware = coverage.contracts[0]?.offerSnapshot.resource;
      const mixed = !!hardware && coverage.contracts.some(k => !sameHardware(hardware, k.offerSnapshot.resource));
      const done = coverage.delivered >= c.quantity && !coverage.mismatch.length && !mixed;
      const status: CoordinationStatus = t.status === 'withdrawn' ? 'withdrawn' : done || t.status === 'completed' ? 'completed' : 'open';
      const actions: CoordinationTask['actions'] = {};
      const details = [`${c.quantity} × ${c.label}; ${coverage.delivered} delivered, ${coverage.covered} allocated, ${coverage.missing} still needed.`, `Needed ${fmtDate(t.neededAt)}.`];
      details.push(`Variant ${c.variant}; minimums: ${Object.entries(c.minimums).map(([key, value]) => `${key} ≥ ${fmtStatValue(c.partKind, c.variant, key, value)}`).join(', ') || 'none'}.`);
      for (const a of s.market.allocations.filter(a => a.taskId === t.id && a.criterionId === c.id && a.status !== 'released')) {
        const k = s.market.contracts.find(k => k.id === a.contractId);
        if (k)
          details.push(`${a.quantity} × ${k.offerSnapshot.resource.name} from ${k.offerSnapshot.supplierName}: ${k.status}, ${k.status === 'delivered' ? `delivered ${fmtDate(k.deliveredAt ?? k.expectedAt)}` : `expected ${fmtDate(k.expectedAt)}`}.`);
      }
      if (coverage.mismatch.length)
        details.push(`Current supply does not meet the request: ${coverage.mismatch.join('; ')}.`);
      if (mixed)
        details.push('Allocated supply contains different hardware and cannot be combined for this need.');
      if (coverage.late)
        details.push(`Allocated supply is expected ${fmtDate(coverage.expectedAt!)}, after the need date.`);
      if (coverage.openCall && coverage.missing > 0)
        details.push(`Call responses expected ${fmtDate(coverage.openCall.closesAt)}.`);
      if (coverage.missing > 0) {
        const fits = offersForCriterion(s, t, c).filter(x => x.fits && !x.unavailable);
        if (fits.length && !fits.some(x => x.affordable)) {
          details.push(`Cheapest currently available fitting offer is $${Math.min(...fits.map(x => x.totalPriceM)).toFixed(2)}M; available budget $${budgetAvailableM(s.budget).toFixed(2)}M.`);
          if (playing && status === 'open')
            actions.comms = 'Review funding opportunities in Communications.';
        }
      }
      if (playing && status === 'open') {
        if (coverage.mismatch.length || mixed || coverage.late || coverage.missing > 0)
          actions.procurement = 'Review the need, offers and allocations in Procurement.';
        if (coverage.mismatch.length || mixed || coverage.late)
          actions.planner = 'Review the design or need date in Mission Planning.';
      }
      result.push({
        id: `supply:${t.id}:${c.id}`,
        revision: t.revision,
        source: 'procurement',
        title: `Supply: ${t.title}${t.criteria.length > 1 ? ` · ${c.label}` : ''}`,
        description: details.join(' '),
        authorRole: t.authorRole,
        assignee: 'procurement',
        status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        neededAt: t.neededAt,
        actions,
        link: {
          kind: 'procurement',
          taskId: t.id,
          criterionId: c.id
        }
      });
    }
  }
  const content = contentOf(s);
  // Research requirements are derived from the live design, including drafts without orders.
  for (const need of designNeeds(s)) {
    const routes = routesFor(need.key, need.value);
    const matching = new Set(techsFor(need.key, need.value).map(t => t.id));
    const routeIds = [...new Set(routes.flatMap(t => [t.id, ...ancestors(t.id)]))];
    const relevant = new Set([...routeIds, ...matching]);
    const projects = s.research.projects.filter(p => p.status === 'running' && p.techId && relevant.has(p.techId));
    const directRunning = projects.some(p => p.techId && matching.has(p.techId));
    const startable = routeIds.map(id => TECH_BY_ID[id]).filter(t => startCheck(s, t.id).ok);
    const routeDetails = routes.map(t => {
      const block = blockInfo(t, s.research.access);
      return `${t.name} ($${t.costM}M, ${Math.round(t.chance * 100)}% success${block.blocked ? `; ${block.why}` : ''})`;
    });
    const current = need.value === undefined ? 'not unlocked' : `current ${s.research.limits[need.key] === undefined ? 'unknown' : formatValue(s.research.limits[need.key], keyInfo(need.key).unit)}`;
    const blocked = routeIds.map(id => TECH_BY_ID[id]).filter(t => !sci(s).researched.includes(t.id) && blockInfo(t, s.research.access).blocked);
    const approvals = content.projects.filter(p => p.effects.some(e => e.kind === 'techAccess' && e.access === 'enable' && blocked.some(t => t.id === e.tech)));
    const availableApprovals = approvals.filter(p => !s.comms.projects.some(active => active.defId === p.id));
    const unaffordableApprovals = approvals.filter(p => canStartProject(s, p.id, content).reason === 'budget');
    const unaffordableTechs = routeIds.map(id => TECH_BY_ID[id]).filter(t => startCheck(s, t.id).reason === 'Not enough budget available.');
    const actions: CoordinationTask['actions'] = {};
    if (playing && !directRunning && startable.length) actions.science = 'Review and start an available step on a research route in Science.';
    if (playing && availableApprovals.length) actions.comms = 'Review approval projects for blocked research routes in Communications.';
    if (playing && (unaffordableTechs.length || unaffordableApprovals.length)) {
      actions.comms = availableApprovals.length ? 'Review funding and approval projects in Communications.' : 'Review funding opportunities for the research route in Communications.';
      if (s.market.contracts.some(k => k.status === 'active')) actions.procurement = 'Review commitments and cancellation terms in Procurement.';
      if (unaffordableApprovals.length && s.research.projects.some(p => p.status === 'running')) actions.science = 'Review research and cancellation terms for the blocked approval.';
    }
    result.push({
      id: `research:${need.key}`, revision: 1, source: 'research',
      title: `Research needed: ${describeNeed(need)}`,
      description: [`Design requirement: ${describeNeed(need)}; ${current}.`,
        need.researchBy === undefined ? 'No fitting standard catalogue delivery is currently identified.' : `Finish research by ${fmtDate(need.researchBy)} for the fastest fitting standard delivery before launch.`,
        `Research routes: ${routeDetails.join('; ') || 'none identified'}.`,
        projects.length ? `Running route projects: ${projects.map(p => `${p.title}${p.techId && matching.has(p.techId) ? ' (meets the need on success)' : ' (prerequisite)'}, ${sci(s).info[p.id]?.paused ? 'paused by Comms, ' : ''}expected ${fmtDate(p.endsAt)}, ${Math.round(p.successChance * 100)}% base success`).join('; ')}.` : '',
        unaffordableApprovals.length ? `Approval projects blocked by budget: ${unaffordableApprovals.map(p => `${p.name} needs $${p.costM}M`).join('; ')}; $${budgetAvailableM(s.budget).toFixed(2)}M available.` : '',
        unaffordableTechs.length ? `Ready research blocked by budget: ${unaffordableTechs.map(t => `${t.name} needs $${t.costM}M`).join('; ')}; $${budgetAvailableM(s.budget).toFixed(2)}M available.` : '',
        blocked.length ? `Blocked route technologies: ${blocked.map(t => `${t.name}: ${blockInfo(t, s.research.access).why}`).join('; ')}.` : '',
        approvals.length ? `Communications approval projects: ${approvals.map(p => `${p.name} ($${p.costM}M, ${p.months} months${p.requires ? `; ${p.requires.stakeholder} trust ${p.requires.min} required` : ''}${s.comms.projects.some(active => active.defId === p.id) ? '; in progress' : ''})`).join('; ')}.` : '',
        'Research can fail; other acquisition options may exist.'].filter(Boolean).join(' '),
      authorRole: 'planner', assignee: 'science', status: 'open', createdAt: 0, updatedAt: 0,
      neededAt: need.researchBy, actions,
      link: !directRunning && startable.length === 1 ? { kind: 'scienceTech', techId: startable[0].id } : { kind: 'science' },
    });
  }
  // A test needs delivered hardware and must finish strictly before launch.
  for (const test of partTests(s)) {
    if (test.state === 'open') continue;
    const inTime = testCounts((test.state === 'arriving' ? test.arrivesAt ?? s.clock.day : s.clock.day) + testDays(), s.planner.plan.launchDay);
    const check = test.state === 'ready' ? testCheck(s, test.partId) : undefined;
    const actions: CoordinationTask['actions'] = {};
    if (playing && test.state === 'ready' && inTime) {
      if (check?.ok) actions.science = 'Review and optionally test the delivered part in Science.';
      if (test.costM > budgetAvailableM(s.budget)) {
        actions.comms = 'Review funding opportunities in Communications.';
        if (s.market.contracts.some(k => k.status === 'active')) actions.procurement = 'Review commitments and cancellation terms in Procurement.';
      }
    }
    if (playing && test.state === 'ready' && !inTime)
      actions.planner = 'Review launch timing in Mission Planning.';
    if (playing && test.state === 'arriving' && !inTime) {
      actions.procurement = 'Review delivery timing in Procurement.';
      actions.planner = 'Review launch timing in Mission Planning.';
    }
    if (playing && test.state === 'testing' && test.endsAt !== undefined && !testCounts(test.endsAt, s.planner.plan.launchDay))
      actions.planner = 'Review launch timing in Mission Planning.';
    result.push({
      id: `test:${test.partId}`, revision: 1, source: 'research', title: `Part test: ${test.name}`,
      description: [`${test.product || 'No contracted hardware'}; ${test.state}.`,
        `Reliability ${Math.round(test.reliability * 1000) / 10}%; after test ${Math.round(test.after * 1000) / 10}%.`,
        test.arrivesAt === undefined ? '' : `Expected ${fmtDate(test.arrivesAt)}.`,
        test.endsAt === undefined ? '' : `Test expected ${fmtDate(test.endsAt)}${testCounts(test.endsAt, s.planner.plan.launchDay) ? '' : '; too late to count'}.`,
        test.state === 'ready' || test.state === 'arriving' ? `Test costs $${test.costM}M and ${inTime ? 'can fit' : 'cannot fit'} before launch at current timing.` : '',
        check && !check.ok ? check.reason ?? '' : ''].filter(Boolean).join(' '),
      authorRole: 'science', assignee: 'science', status: test.state === 'tested' ? 'completed' : 'open',
      createdAt: 0, updatedAt: 0, neededAt: s.planner.plan.launchDay, actions,
      link: { kind: 'scienceTest', partId: test.partId },
    });
  }
  // Negotiated partner offers are actionable by procurement, with their real terms.
  for (const o of s.market.offers.filter(o => o.source === 'comms')) {
    const expired = o.expiresAt !== undefined && o.expiresAt <= s.clock.day;
    const remaining = o.remainingQuantity ?? (o.status === 'available' ? o.quantity : 0);
    const status: CoordinationStatus = o.status === 'accepted' || remaining <= 0 ? 'completed' : o.status === 'withdrawn' || expired ? 'withdrawn' : 'open';
    result.push({
      id: `offer:${o.id}`,
      revision: o.revision,
      source: 'offer',
      title: `Partner offer: ${o.resource.name}`,
      description: `${o.supplierName}: ${remaining} available, $${o.priceM}M for ${o.quantity}, delivery in ${o.leadTimeDays} days.${o.expiresAt === undefined ? '' : ` Expires ${fmtDate(o.expiresAt)}.`}`,
      authorRole: 'comms',
      assignee: 'procurement',
      status,
      createdAt: 0,
      updatedAt: 0,
      actions: playing && status === 'open' ? {
        procurement: 'Review the partner offer in Procurement.'
      } : {},
      link: {
        kind: 'offer',
        offerId: o.id
      }
    });
  }
  for (const k of s.market.contracts) {
    const allocations = s.market.allocations.filter(a => a.contractId === k.id && a.status !== 'released');
    const orphaned = allocations.some(a => a.taskId && !s.market.tasks.some(t => t.id === a.taskId && t.status !== 'withdrawn' && t.criteria.some(c => c.id === a.criterionId)));
    const needs = contractTiming(s, k).needs;
    const late = needs.filter(n => n.margin !== undefined && n.margin < 0);
    const status: CoordinationTask['status'] = k.status === 'active' || (k.status === 'delivered' && orphaned) ? 'open' : k.status === 'delivered' ? 'completed' : k.status === 'failed' ? 'failed' : 'withdrawn';
    const description = [
      `${k.offerSnapshot.quantity} × ${k.offerSnapshot.resource.name} from ${k.offerSnapshot.supplierName}; ${k.status}; $${k.offerSnapshot.priceM}M.`,
      k.status === 'delivered' ? `Delivered ${fmtDate(k.deliveredAt ?? k.expectedAt)}.` : `Expected ${fmtDate(k.expectedAt)}.`,
      ...needs.map(n => `${n.quantity} × ${n.label}${n.neededAt === undefined ? ': no need date' : ` needed ${fmtDate(n.neededAt)}${n.margin !== undefined && n.margin < 0 ? ' (late)' : ''}`}.`),
      ...(orphaned ? ['An allocation refers to a withdrawn or missing need; the contract still exists.'] : []),
    ].join(' ');
    const actions: CoordinationTask['actions'] = {};
    if (playing && ((k.status === 'active' && late.length) || (['active', 'delivered'].includes(k.status) && orphaned)))
      actions.procurement = 'Review the delivery, allocation and amendment or cancellation terms in Procurement.';
    result.push({
      id: `contract:${k.id}`,
      revision: k.revision,
      source: 'contract',
      title: `Contract: ${k.offerSnapshot.resource.name}`,
      description,
      authorRole: 'procurement',
      assignee: 'procurement',
      status,
      createdAt: k.signedAt,
      updatedAt: k.amendments?.at(-1)?.at ?? k.signedAt,
      neededAt: k.expectedAt,
      actions,
      link: {
        kind: 'contract',
        contractId: k.id
      }
    });
  }
  for (const call of s.market.calls.filter(c => c.status === 'open' && !!c.taskId)) {
    const task = s.market.tasks.find(t => t.id === call.taskId);
    if (task && task.status === 'open' && task.revision === call.taskRevision)
      continue;
    result.push({
      id: `call:${call.id}`,
      revision: call.revision,
      source: 'procurement',
      title: 'Call has an outdated need',
      description: `The Call for ${call.requirement?.label ?? call.criterionId} was opened against an earlier or withdrawn requirement and closes ${fmtDate(call.closesAt)}. Its snapshot and any resulting offers remain; review whether they still fit.`,
      authorRole: 'planner',
      assignee: 'procurement',
      status: 'open',
      createdAt: call.openedAt,
      updatedAt: call.openedAt,
      neededAt: call.closesAt,
      actions: playing ? {
        procurement: 'Review the Call and its current need in Procurement.'
      } : {},
      link: {
        kind: 'call',
        callId: call.id
      }
    });
  }
  for (const event of s.comms.inbox) {
    const def = getEventDef(event.eventId, content);
    if (!def)
      continue;
    const status: CoordinationTask['status'] = event.status === 'open' ? 'open' : event.status === 'answered' ? 'completed' : 'expired';
    const options = def.options.map(o => `${o.text} (${optionEffects(o).map(describeEffect).join('; ') || 'No modeled effects'}${o.costM && o.costM > budgetAvailableM(s.budget) ? `; unavailable: requires $${o.costM}M, available $${budgetAvailableM(s.budget).toFixed(2)}M` : ''})`).join(' | ');
    const chosen = def.options.find(o => o.id === event.chosenOptionId);
    const description = event.status === 'open'
      ? `${def.message} Options: ${options}. If unanswered: ${def.ignored.outcome} (${def.ignored.effects.map(describeEffect).join('; ') || 'No modeled effects'}).`
      : event.status === 'answered' ? `Chosen: ${chosen?.text ?? event.chosenOptionId ?? 'unknown'}. ${chosen?.outcome ?? ''}` : `Expired: ${def.ignored.outcome}`;
    const unaffordable = event.status === 'open' && def.options.some(o => !!o.costM && o.costM > budgetAvailableM(s.budget));
    const eventActions: CoordinationTask['actions'] = playing && status === 'open' ? { comms: 'Choose a response in Communications before the deadline.' } : {};
    if (playing && unaffordable) {
      if (s.market.contracts.some(k => k.status === 'active')) eventActions.procurement = 'Review commitments and cancellation terms for the unavailable response.';
      if (s.research.projects.some(p => p.status === 'running')) eventActions.science = 'Review running projects and cancellation terms for the unavailable response.';
    }
    result.push({
      id: `event:${event.instanceId}`,
      revision: 1,
      source: 'event',
      title: def.title,
      description,
      authorRole: 'comms',
      assignee: 'comms',
      status,
      createdAt: event.arrivedDay,
      updatedAt: event.arrivedDay,
      neededAt: event.deadlineDay,
      actions: eventActions,
      link: {
        kind: 'comms',
        instanceId: event.instanceId
      }
    });
  }
  for (const p of s.research.projects) {
    const info = sci(s).info[p.id];
    const tech = p.techId ? TECH_BY_ID[p.techId] : undefined;
    const paused = !!info?.paused || !!(tech && blockInfo(tech, s.research.access).blocked);
    const outcome = p.status === 'running' ? `${paused ? 'Paused by Comms; ' : ''}expected ${fmtDate(p.endsAt)}${p.partId ? (testCounts(p.endsAt, s.planner.plan.launchDay) ? '; before launch' : '; too late to count before launch') : `; base success chance ${Math.round(p.successChance * 100)}%`}.` : info?.cancelled ? 'Cancelled.' : p.status === 'succeeded' ? 'Succeeded.' : 'Failed or cancelled.';
    const approvals = tech && paused ? content.projects.filter(def => def.effects.some(e => e.kind === 'techAccess' && e.access === 'enable' && e.tech === tech.id)) : [];
    const actions: CoordinationTask['actions'] = {};
    if (playing && p.status === 'running' && paused) actions.comms = 'Review the blocked technology in Communications.';
    if (playing && p.status === 'running' && p.partId && !testCounts(p.endsAt, s.planner.plan.launchDay)) actions.planner = 'Review launch timing in Mission Planning.';
    result.push({
      id: `project:science:${p.id}`, revision: 1, source: 'project', title: `Science: ${p.title}`,
      description: p.partId ? `${outcome} A successful test halves the failure risk of the part's current contracts.` : `${outcome} ${p.status === 'succeeded' ? 'Applied effects' : 'Potential effects on success'}: ${p.effects.map(describeEffect).join('; ') || 'opens further technology'}.${approvals.length ? ` Possible Communications approvals: ${approvals.map(def => `${def.name}${s.comms.projects.some(active => active.defId === def.id) ? ' (in progress)' : ''}`).join('; ')}.` : ''}`,
      authorRole: 'science', assignee: 'science',
      status: p.status === 'running' ? 'open' : p.status === 'succeeded' ? 'completed' : info?.cancelled ? 'withdrawn' : 'failed',
      createdAt: p.startedAt, updatedAt: info?.endedAt ?? p.startedAt, neededAt: p.endsAt, actions,
      link: { kind: 'scienceProject', projectId: p.id },
    });
  }
  for (const p of s.comms.projects) {
    const def = getProjectDef(p.defId, content);
    if (!def)
      continue;
    result.push({
      id: `project:comms:${p.instanceId}`,
      revision: 1,
      source: 'project',
      title: `Communications: ${def.name}`,
      description: `Expected ${fmtDate(p.endDay)}. On completion: ${def.effects.map(describeEffect).join('; ') || def.result}.`,
      authorRole: 'comms',
      assignee: 'comms',
      status: 'open',
      createdAt: p.startDay,
      updatedAt: p.startDay,
      neededAt: p.endDay,
      actions: {}
    });
  }
  const authoredEffects = [...content.events.flatMap(e => [...e.options.flatMap(optionEffects), ...e.ignored.effects]), ...content.projects.flatMap(p => p.effects)];
  for (const flag of s.events.flags) {
    const effect = authoredEffects.find(e => e.kind === 'missionConstraint' ? missionConstraintFlag(e.text) === flag : e.kind === 'service' ? `service.${e.service}` === flag : false);
    if (!effect)
      continue;
    if (effect.kind === 'missionConstraint' && (s.coordination ?? []).some(t => t.origin === 'effect' && (t.sourceText === effect.text || t.description.startsWith(effect.text))))
      continue;
    result.push({
      id: `flag:${flag}`,
      revision: 1,
      source: 'notice',
      title: effect.kind === 'missionConstraint' ? 'Mission constraint' : 'Available service',
      description: `${describeEffect(effect)}${effect.kind === 'missionConstraint' ? ' This is an authored direction; the current simulation does not automatically verify it.' : effect.kind === 'service' && effect.service !== 'groundStation' ? ' This service is recorded but has no simulation effect yet.' : ''}`,
      authorRole: 'comms',
      assignee: 'planner',
      status: 'open',
      createdAt: 0,
      updatedAt: 0,
      actions: {}
    });
  }
  for (const item of s.events.news.filter(n => n.internal))
    result.push({
      id: `news:${item.id}`,
      revision: 1,
      source: 'notice',
      title: `Update from ${item.from}`,
      description: item.text,
      authorRole: item.from,
      assignee: item.affects[0] ?? item.from,
      status: 'completed',
      createdAt: item.day,
      updatedAt: item.day,
      actions: {}
    });
  for (const [kind, modifiers] of [['market', s.market.modifiers], ['research', s.research.modifiers], ['communications', s.comms.modifiers]] as const) {
    modifiers.forEach((m, index) => {
      if (m.untilDay <= s.clock.day)
        return;
      result.push({
        id: `modifier:${kind}:${index}:${m.untilDay}`,
        revision: 1,
        source: 'modifier',
        title: `Active ${kind} effect`,
        description: `${describeEffect(m.effect)}; ends ${fmtDate(m.untilDay)}.`,
        authorRole: 'comms',
        assignee: kind === 'market' ? 'procurement' : kind === 'research' ? 'science' : 'comms',
        status: 'open',
        createdAt: 0,
        updatedAt: 0,
        neededAt: m.untilDay,
        actions: {}
      });
    });
  }
  const available = budgetAvailableM(s.budget);
  if (available < 0)
    result.push({
      id: 'budget:shortfall',
      revision: 1,
      source: 'budget',
      title: 'Funding shortfall',
      description: `Available budget is $${available.toFixed(2)}M; new spending is blocked. Funding, spending and commitments are shared across stations.`,
      authorRole: 'comms',
      assignee: 'comms',
      status: 'open',
      createdAt: 0,
      updatedAt: 0,
      actions: playing ? {
        comms: 'Review funding opportunities in Communications.',
        procurement: 'Review commitments and cancellation terms in Procurement.',
        science: 'Review running projects and cancellation terms in Science.'
      } : {},
      link: { kind: 'budget' }
    });
  for (const { part } of allParts(s.planner.rocket)) {
    if (partStatus(s, part.id) !== 'draft')
      continue;
    result.push({
      id: `planning:${part.id}`,
      revision: 1,
      source: 'planning',
      title: `Unordered: ${part.name}`,
      description: 'This part is still a draft. Ordering it creates a procurement need with its current specifications.',
      authorRole: 'planner',
      assignee: 'planner',
      status: 'open',
      createdAt: 0,
      updatedAt: 0,
      neededAt: s.planner.plan.launchDay,
      actions: playing ? {
        planner: 'Review and order the part in Mission Planning.'
      } : {},
      link: {
        kind: 'planner',
        partId: part.id
      }
    });
  }
  const planner = cachedPlannerGame(s);
  const evaluation = evaluationOf(planner);
  const issues = evaluation.issues.filter(i => i.severity !== 'info');
  if (issues.length)
    result.push({
      id: 'planning:issues',
      revision: 1,
      source: 'planning',
      title: 'Current plan issues',
      description: issues.map(i => `${i.severity}: ${i.message}`).join(' | '),
      authorRole: 'planner',
      assignee: 'planner',
      status: 'open',
      createdAt: 0,
      updatedAt: 0,
      actions: playing ? {
        planner: 'Review the current issues in Mission Planning.'
      } : {},
      link: {
        kind: 'plan'
      }
    });
  for (const goal of evaluation.goals) {
    const def = planner.mission.goals.find(g => g.id === goal.goalId);
    result.push({
      id: `goal:${goal.goalId}`,
      revision: 1,
      source: 'planning',
      title: `Plan feasibility: ${def?.name ?? goal.goalId}`,
      description: goal.achievable ? `The current plan can reach this goal; estimated success chance ${Math.round(goal.successChance * 100)}%. This is a plan estimate.` : `The current plan does not reach this goal: ${goal.reason ?? 'review planner issues'}.`,
      authorRole: 'planner',
      assignee: 'planner',
      status: 'open',
      createdAt: 0,
      updatedAt: 0,
      neededAt: planner.mission.completionDeadlineDay,
      actions: playing && !goal.achievable ? {
        planner: 'Review the goal and plan issues in Mission Planning.'
      } : {},
      link: {
        kind: 'plan'
      }
    });
  }
  return result;
}
