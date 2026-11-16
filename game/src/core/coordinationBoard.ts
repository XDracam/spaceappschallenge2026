// Consolidate local source projections into shared needs, overview and schedule.
import { STATIONS, type Call } from './model';
import type { CoordinationTask } from './coordination';
import { coordinationEntries } from './coordinationEntries';
import { budgetAvailableM, type GameState } from './state';
import { fitFailures, fmtDate, fmtStatValue, offersForCriterion, sameKind } from '../stations/procurement/rules';
import { designNeeds } from '../stations/science/model/research';
import { ancestors, routesFor } from '../stations/science/model/tree';
import { contentOf, getProjectDef } from '../stations/comms/state/world';
import { allParts } from '../stations/planner/model/rocketUtils';
import { beyondResearch } from '../stations/planner/data/parts';
import { partStatus } from '../stations/planner/derive';

export interface CoordinationBoard {
  tasks: CoordinationTask[];
  overview: CoordinationTask[];
  schedule: CoordinationTask[];
}

function callContext(s: GameState, call: Call): string {
  const task = s.market.tasks.find(task => task.id === call.taskId);
  const requirement = call.requirement;
  const specification = requirement && Object.entries(requirement.minimums).map(([key, value]) => `${key} ≥ ${fmtStatValue(requirement.partKind, requirement.variant, key, value)}`).join(', ');
  const stale = task && call.taskRevision !== undefined && call.taskRevision !== task.revision;
  const offers = call.offerIds.flatMap(id => {
    const offer = s.market.offers.find(item => item.id === id);
    if (!offer) return [];
    const expired = offer.expiresAt !== undefined && offer.expiresAt <= s.clock.day;
    return [`${offer.resource.name} from ${offer.supplierName}; ${expired ? 'expired' : offer.status}; ${offer.remainingQuantity ?? offer.quantity} remaining; $${offer.priceM}M for ${offer.quantity}; ${offer.leadTimeDays} days delivery; ${Math.round(offer.reliability * 1000) / 10}% reliability.`];
  });
  return [
    `${call.status}; ${requirement?.quantity ?? 0} units; responses ${fmtDate(call.closesAt)}; ${call.offerIds.length} Offers.`,
    task?.status === 'withdrawn' ? 'The original requirement was withdrawn.' : '',
    call.taskId && !task ? 'The original requirement is missing.' : '',
    stale ? `Opened for revision ${call.taskRevision}; current requirement is revision ${task.revision}. Check received Offers against the current requirement.` : '',
    specification ? `Original minimums: ${specification}.` : '',
    ...offers,
  ].filter(Boolean).join('\n');
}


/** All mutations below affect derived entries and collections, never GameState. */
interface BoardContext {
  s: GameState;
  entries: CoordinationTask[];
  byId: Map<string, CoordinationTask>;
  attached: Set<string>;
  tasks: CoordinationTask[];
  fundingNeeds: CoordinationTask[];
  fundingRequests: CoordinationTask[];
  playing: boolean;
  design: ReturnType<typeof allParts>;
  researchNeeds: ReturnType<typeof designNeeds>;
}

function mergeActions(target: CoordinationTask, entry: CoordinationTask): void {
  for (const role of STATIONS) {
    const action = entry.actions[role];
    if (!action) continue;
    const kind = entry.actionKinds?.[role] ?? 'work';
    if (kind === 'funding' || kind === 'fundingApproval') {
      if (kind === 'fundingApproval') {
        target.actions[role] = 'Review approval projects for the research route in Communications.';
        (target.actionKinds ??= {})[role] = 'approval';
        if (entry.links?.[role]) (target.links ??= {})[role] = entry.links[role];
      }
      continue;
    }
    const previous = target.actions[role];
    target.actions[role] = previous && previous !== action ? `${previous} ${action}` : action;
    (target.actionKinds ??= {})[role] = kind;
    const destination = entry.links?.[role] ?? entry.link;
    if (destination && !target.links?.[role]) (target.links ??= {})[role] = destination;
  }
}

function appendPlayerRequests({ s, entries, tasks }: BoardContext): void {
  for (const entry of entries.filter(entry => entry.source === 'player' || entry.source === 'effect')) {
    if (entry.purpose !== 'funding' && (!entry.parentNeedId || !s.market.tasks.some(task => task.id === entry.parentNeedId && task.status === 'open'))) {
      tasks.push(entry);
    }
  }
}

function appendMarketNeeds({ s, entries, byId, attached, tasks, fundingNeeds, researchNeeds }: BoardContext): void {
  for (const marketTask of s.market.tasks) {
    const supplies = marketTask.criteria.map(criterion => byId.get(`supply:${marketTask.id}:${criterion.id}`)!).filter(Boolean);
    if (!supplies.length) continue;
    const related: CoordinationTask[] = supplies.length > 1 ? [...supplies] : [];
    const need: CoordinationTask = {
      ...supplies[0], id: `need:${marketTask.id}`, title: marketTask.title,
      description: supplies.length === 1 ? supplies[0].description : `${supplies.length} requirements. Review their specifications and supply below.`,
      status: marketTask.status === 'withdrawn' ? 'withdrawn' : supplies.every(entry => entry.status === 'completed') ? 'completed' : 'open',
      actions: {}, actionKinds: {}, related, links: {},
    };
    const requests = entries.filter(entry => (entry.source === 'player' || entry.source === 'effect') && entry.purpose !== 'funding' && entry.parentNeedId === marketTask.id);
    if (requests.length && marketTask.status === 'open') {
      need.requests = requests;
      if (requests.some(request => request.status === 'open')) need.status = 'open';
      for (const request of requests.filter(request => request.status === 'open')) mergeActions(need, request);
    }
    for (const supply of supplies) {
      attached.add(supply.id);
      mergeActions(need, supply);
      if (supply.actionKinds?.comms === 'funding' || supply.actionKinds?.comms === 'fundingApproval') fundingNeeds.push(supply);
    }
    if (marketTask.status === 'open') {
      for (const criterion of marketTask.criteria) {
        const offers = offersForCriterion(s, marketTask, criterion).filter(assessment => assessment.fits && !assessment.unavailable);
        if (!offers.length) continue;
        related.push({
          ...supplies[0], id: `alternatives:${marketTask.id}:${criterion.id}`, title: `Offers for ${criterion.label}`,
          description: offers.map(assessment => `${assessment.quantity} × ${assessment.offer.resource.name} from ${assessment.offer.supplierName}; $${assessment.totalPriceM.toFixed(2)}M; expected ${fmtDate(assessment.expectedAt)}${assessment.late ? ' (late)' : ''}; ${Math.round(assessment.offer.reliability * 1000) / 10}% reliability${assessment.affordable ? '' : ' (above available budget)'}.`).join('\n'),
          actions: {}, link: { kind: 'procurement', taskId: marketTask.id, criterionId: criterion.id },
        });
      }
    }
    if (marketTask.partId && !need.links!.planner) need.links!.planner = { kind: 'planner', partId: marketTask.partId };

    for (const entry of entries.filter(entry => entry.id.startsWith('research:'))) {
      const key = entry.id.slice('research:'.length);
      const relevant = marketTask.status === 'open' && marketTask.criteria.some(criterion => {
        const prefix = `${criterion.partKind}.${criterion.variant}`;
        if (key === prefix) return !s.research.unlocked.includes(key);
        if (!key.startsWith(`${prefix}.`)) return false;
        const stat = key.slice(prefix.length + 1);
        return criterion.minimums[stat] !== undefined && (s.research.limits[key] ?? -Infinity) < criterion.minimums[stat];
      });
      if (!relevant) continue;
      related.push(entry);
      attached.add(entry.id);
      mergeActions(need, entry);
      if ((entry.actionKinds?.comms === 'funding' || entry.actionKinds?.comms === 'fundingApproval')) fundingNeeds.push(entry);
      const requirement = researchNeeds.find(item => item.key === key);
      const technologies = routesFor(key, requirement?.value).flatMap(tech => [tech.id, ...ancestors(tech.id)]);
      for (const project of s.research.projects.filter(project => project.techId && technologies.includes(project.techId))) {
        const progress = byId.get(`project:science:${project.id}`);
        if (progress && !related.some(item => item.id === progress.id)) related.push(progress);
        if (progress?.actions.comms) { need.status = 'open'; mergeActions(need, progress); }
        attached.add(`project:science:${project.id}`);
      }
      for (const project of s.comms.projects) {
        const definition = getProjectDef(project.defId, contentOf(s));
        if (!definition?.effects.some(effect => effect.kind === 'techAccess' && technologies.includes(effect.tech))) continue;
        const progress = byId.get(`project:comms:${project.instanceId}`);
        if (progress && !related.some(item => item.id === progress.id)) related.push(progress);
        attached.add(`project:comms:${project.instanceId}`);
      }
    }

    const contractIds = new Set(s.market.allocations.filter(allocation => allocation.taskId === marketTask.id && allocation.status !== 'released').map(allocation => allocation.contractId));
    if (marketTask.status !== 'withdrawn') {
      for (const contractId of contractIds) {
        const contract = byId.get(`contract:${contractId}`);
        if (!contract) continue;
        related.push(contract);
        attached.add(contract.id);
        if (contract.actions.procurement) {
          need.status = 'open';
          mergeActions(need, contract);
        }
      }
      for (const call of s.market.calls.filter(call => call.taskId === marketTask.id)) {
        const stale = byId.get(`call:${call.id}`);
        const outdated = call.taskRevision !== undefined && call.taskRevision !== marketTask.revision;
        const detail: CoordinationTask = stale ?? {
          ...supplies[0], id: `call:${call.id}`, source: 'procurement', title: outdated ? 'Call uses earlier requirements' : 'Supplier Call',
          description: callContext(s, call),
          status: call.status === 'open' ? 'open' : call.status === 'closed' ? 'completed' : 'withdrawn',
          actions: {}, link: { kind: 'call', callId: call.id },
        };
        detail.description = callContext(s, call);
        related.push(detail);
        attached.add(detail.id);
        if (stale) {
          need.status = 'open';
          mergeActions(need, stale);
        }
      }
    }

    for (const offer of s.market.offers.filter(offer => offer.source === 'comms' && marketTask.criteria.some(criterion => sameKind(offer.resource, criterion) && fitFailures(offer.resource, criterion).length === 0))) {
      const detail = byId.get(`offer:${offer.id}`);
      if (detail) {
        related.push(detail);
        // Keep an available offer actionable even when the associated need is fulfilled.
        if (detail.status === 'open' && detail.actions.procurement && (need.status !== 'open' || !need.actions.procurement) && !tasks.some(task => task.id === detail.id)) tasks.push(detail);
      }
      attached.add(`offer:${offer.id}`);
    }
    if (marketTask.partId && marketTask.status !== 'withdrawn') {
      const test = byId.get(`test:${marketTask.partId}`);
      if (test) {
        related.push(test);
        attached.add(test.id);
        const runningTest = s.research.projects.find(project => project.partId === marketTask.partId && project.status === 'running');
        if (runningTest) {
          attached.add(`project:science:${runningTest.id}`);
          if (test.actions.planner) {
            need.status = 'open';
            need.actions.planner = test.actions.planner;
            need.links!.planner = (test.links?.planner ?? test.link)!;
          }
        }
      }
    }
    tasks.push(need);
  }
}

function appendDraftResearch({ s, entries, attached, tasks, fundingNeeds, design, researchNeeds }: BoardContext): void {
  // Live draft research stays available before procurement publishes a part order.
  for (const entry of entries.filter(entry => entry.id.startsWith('research:'))) {
    const key = entry.id.slice('research:'.length);
    const unpublished = design.filter(({ part }) => ['draft', 'ordered'].includes(partStatus(s, part.id)) && !s.market.tasks.some(task => task.partId === part.id && task.status === 'open') && beyondResearch(part, s.research.limits, s.research.unlocked).includes(key));
    if (!unpublished.length) continue;
    const task = { ...entry, actions: { ...entry.actions }, description: `${unpublished.map(({ part }) => part.name).join(', ')} need this capability. ${entry.description}` };
    const requirement = researchNeeds.find(item => item.key === key);
    const technologies = routesFor(key, requirement?.value).flatMap(tech => [tech.id, ...ancestors(tech.id)]);
    task.related = entries.filter(item => item.id.startsWith('project:science:') && s.research.projects.some(project => item.id === `project:science:${project.id}` && project.techId && technologies.includes(project.techId)));
    for (const progress of task.related) attached.add(progress.id);
    delete task.actions.comms;
    if (entry.actions.comms && entry.actionKinds?.comms !== 'funding' && entry.actionKinds?.comms !== 'fundingApproval') task.actions.comms = entry.actions.comms;
    else if (entry.actionKinds?.comms === 'fundingApproval') task.actions.comms = 'Review approval projects for the research route in Communications.';
    for (const progress of task.related) if (progress.actions.comms) mergeActions(task, progress);
    if ((entry.actionKinds?.comms === 'funding' || entry.actionKinds?.comms === 'fundingApproval')) fundingNeeds.push(entry);
    tasks.push(task);
    attached.add(entry.id);
  }
}

function appendReconciliation({ s, entries, attached, tasks }: BoardContext): void {
  const reconciliation = new Map<string, CoordinationTask>();
  for (const entry of entries.filter(entry => entry.id.startsWith('contract:') || entry.id.startsWith('call:'))) {
    if (attached.has(entry.id) || entry.status !== 'open' || !Object.keys(entry.actions).length) continue;
    const contractId = entry.link?.kind === 'contract' ? entry.link.contractId : undefined;
    const callId = entry.link?.kind === 'call' ? entry.link.callId : undefined;
    const allocation = contractId && s.market.allocations.find(item => item.contractId === contractId && item.status !== 'released' && item.taskId && !s.market.tasks.some(task => task.id === item.taskId && task.status !== 'withdrawn'));
    const call = callId && s.market.calls.find(item => item.id === callId);
    const obsoleteId = allocation ? allocation.taskId : call ? call.taskId : undefined;
    const id = obsoleteId ? `reconcile:${obsoleteId}` : `reconcile:${entry.id}`;
    let task = reconciliation.get(id);
    if (!task) {
      task = { ...entry, id, title: obsoleteId ? 'Review commitments for an obsolete need' : 'Review delivery commitment', actions: {}, related: [], links: {} };
      reconciliation.set(id, task);
    }
    task.related!.push(entry);
    mergeActions(task, entry);
    attached.add(entry.id);
  }
  tasks.push(...reconciliation.values());
}

function appendResearchApprovals({ entries, attached, tasks }: BoardContext): void {
  for (const entry of entries.filter(entry => entry.id.startsWith('project:science:') && entry.status === 'open' && entry.actions.comms && !attached.has(entry.id))) {
    tasks.push({ ...entry, title: `Resolve research approval for ${entry.title.replace('Science: ', '')}` });
    attached.add(entry.id);
  }
}

function appendFunding({ s, entries, byId, attached, tasks, fundingNeeds, fundingRequests, playing }: BoardContext): void {
  const uniqueFundingNeeds = [...new Map(fundingNeeds.map(entry => [entry.id, entry])).values()];
  const negativeBudget = byId.get('budget:shortfall');
  const fundingOpen = !!negativeBudget || uniqueFundingNeeds.length > 0 || fundingRequests.some(request => request.status === 'open');
  if (fundingOpen || fundingRequests.length) {
    const projects = entries.filter(entry => entry.id.startsWith('project:comms:') && s.comms.projects.some(project => entry.id === `project:comms:${project.instanceId}` && getProjectDef(project.defId, contentOf(s))?.effects.some(effect => effect.kind === 'budget' && effect.deltaM > 0)));
    for (const project of projects) attached.add(project.id);
    const actions: CoordinationTask['actions'] = playing && fundingOpen ? { ...negativeBudget?.actions, comms: 'Review funding opportunities and the affected needs in Communications.' } : {};
    if (playing) for (const request of fundingRequests.filter(request => request.status === 'open')) Object.assign(actions, request.actions);
    tasks.push({
      id: 'funding:shared', revision: 1, source: 'budget', title: 'Funding for shared needs',
      description: `$${budgetAvailableM(s.budget).toFixed(2)}M available across the agency. ${negativeBudget ? 'Current commitments and spending exceed funding. ' : ''}Review the linked requests, alternatives and shared research before choosing a funding target.`,
      authorRole: 'comms', assignee: 'comms', status: fundingOpen ? 'open' : 'completed', createdAt: 0, updatedAt: 0,
      actions,
      links: { comms: { kind: 'commsProjects' }, procurement: { kind: 'contracts' }, science: { kind: 'scienceLab' } },
      link: { kind: 'budget' }, related: [...uniqueFundingNeeds, ...projects], requests: fundingRequests,
    });
  }
}

function overviewEntries({ s, entries, byId, attached }: BoardContext): CoordinationTask[] {
  const overview = entries.filter(entry => {
    // Optional tests stay discoverable even after their supply requirement is fulfilled.
    if (entry.id.startsWith('test:') && entry.status === 'open') return true;
    if (attached.has(entry.id) || entry.source === 'player' || entry.source === 'effect' || entry.source === 'budget') return false;
    if (entry.id.startsWith('supply:') || entry.id.startsWith('research:') || entry.id.startsWith('planning:')) return false;
    return true;
  });
  // Agency effects and mission feasibility remain shared even as their work is consolidated.
  const planIssues = byId.get('planning:issues');
  if (planIssues) overview.push(planIssues);
  for (const call of s.market.calls.filter(call => !attached.has(`call:${call.id}`) && !overview.some(entry => entry.id === `call:${call.id}`))) {
    const requirement = call.requirement;
    overview.push({
      id: `call:${call.id}`, revision: call.revision, source: 'procurement', title: `Supplier Call · ${requirement?.label ?? call.id}`,
      description: callContext(s, call),
      authorRole: 'procurement', assignee: 'procurement', status: call.status === 'open' ? 'open' : call.status === 'closed' ? 'completed' : 'withdrawn',
      createdAt: call.openedAt, updatedAt: call.openedAt, actions: {}, link: { kind: 'call', callId: call.id },
    });
  }
  return overview;
}

function scheduleEntries(entries: CoordinationTask[]): CoordinationTask[] {
  return entries.filter(entry => entry.purpose === 'timing' || entry.neededAt !== undefined && (entry.source === 'player' || entry.source === 'effect' || entry.id.startsWith('supply:') || entry.id.startsWith('research:') || entry.id.startsWith('test:') || entry.id.startsWith('contract:') || entry.id.startsWith('project:science:')))
    .sort((a, b) => (a.neededAt ?? Infinity) - (b.neededAt ?? Infinity));
}

/** One shared need owns its sourcing, development and delivery context. */
export function coordinationBoard(s: GameState): CoordinationBoard {
  const entries = coordinationEntries(s);
  const context: BoardContext = {
    s, entries,
    byId: new Map(entries.map(entry => [entry.id, entry])),
    attached: new Set(),
    tasks: [], fundingNeeds: [],
    fundingRequests: entries.filter(entry => entry.purpose === 'funding'),
    playing: s.meta.phase === 'planning',
    design: allParts(s.planner.rocket),
    researchNeeds: designNeeds(s),
  };
  appendPlayerRequests(context);
  appendMarketNeeds(context);
  appendDraftResearch(context);
  appendReconciliation(context);
  appendResearchApprovals(context);
  appendFunding(context);
  return { tasks: context.tasks, overview: overviewEntries(context), schedule: scheduleEntries(entries) };
}
