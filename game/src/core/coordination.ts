// Explicit replicated requests; generated board work derives from source state.
import { defineActions } from './actions';
import { STATIONS, type StationId } from './model';
import type { GameState } from './state';
import { contentOf, optionEffects } from '../stations/comms/state/world';
import { coordinationBoard } from './coordinationBoard';

export { coordinationBoard, type CoordinationBoard } from './coordinationBoard';

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
  kind: 'commsProjects' | 'contracts' | 'scienceLab' | 'launch';
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
  purpose?: 'request' | 'funding' | 'equipment' | 'timing';
  requestKey?: string;
  parentNeedId?: string;
  neededAt?: number;
}
export interface RequestOptions { parentNeedId?: string; neededAt?: number }
export interface CoordinationTask extends Omit<PlayerCoordinationTask, 'status'> {
  status: CoordinationStatus | 'failed' | 'expired';
  source: 'player' | 'effect' | 'procurement' | 'research' | 'offer' | 'contract' | 'event' | 'project' | 'modifier' | 'budget' | 'planning' | 'notice';
  actions: Partial<Record<StationId, string>>;
  actionKinds?: Partial<Record<StationId, 'work' | 'funding' | 'approval' | 'fundingApproval'>>;
  link?: CoordinationLink;
  links?: Partial<Record<StationId, CoordinationLink>>;
  related?: CoordinationTask[];
  requests?: CoordinationTask[];
}
function validRequestOptions(s: GameState, options?: RequestOptions, existingParent?: string): boolean {
  if (options === undefined) return true;
  if (!options || typeof options !== 'object' || Array.isArray(options)) return false;
  const { parentNeedId, neededAt } = options;
  return (parentNeedId === undefined || typeof parentNeedId === 'string' && parentNeedId.length > 0 && parentNeedId.length <= 160 && (parentNeedId === existingParent || s.market.tasks.some(t => t.id === parentNeedId && t.status === 'open')))
    && (neededAt === undefined || typeof neededAt === 'number' && Number.isFinite(neededAt) && neededAt >= 0);
}
const validRole = (v: unknown): v is StationId => typeof v === 'string' && STATIONS.includes(v as StationId);

export const coordinationActions = defineActions('coordination', {
  create(s, ctx, title: string, description: string, assignee: StationId, requestId?: string, requestKey?: string, purpose: PlayerCoordinationTask['purpose'] = 'request', expectedRevision?: number, options?: RequestOptions) {
    if (s.meta.phase !== 'planning' || !validRole(ctx.by) || !validRole(assignee) || typeof title !== 'string' || typeof description !== 'string')
      return;
    title = title.trim();
    description = description.trim();
    if (!title || title.length > 120 || !description || description.length > 1000)
      return;
    if (requestId !== undefined && (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(requestId)))
      return;
    if (!['request', 'funding', 'equipment', 'timing'].includes(purpose ?? 'request')) return;
    if (requestKey !== undefined && (typeof requestKey !== 'string' || !/^[A-Za-z0-9:._-]{1,160}$/.test(requestKey))) return;
    if (!validRequestOptions(s, options)) return;
    const existing = requestKey && (s.coordination ?? []).find(task => task.authorRole === ctx.by && task.requestKey === requestKey);
    if (existing) {
      if (existing.revision !== expectedRevision) return;
      existing.title = title;
      existing.description = description;
      existing.assignee = assignee;
      existing.purpose = purpose;
      if (options !== undefined) { existing.parentNeedId = options.parentNeedId; existing.neededAt = options.neededAt; }
      existing.status = 'open';
      existing.updatedAt = ctx.day;
      existing.revision++;
      return;
    }
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
      updatedAt: ctx.day,
      purpose,
      ...options,
      ...(requestKey ? { requestKey } : {}),
    });
  },
  edit(s, ctx, id: string, revision: number, title: string, description: string, assignee: StationId, purpose?: PlayerCoordinationTask['purpose'], options?: RequestOptions) {
    if (s.meta.phase !== 'planning' || !validRole(ctx.by) || !validRole(assignee) || typeof title !== 'string' || typeof description !== 'string')
      return;
    title = title.trim();
    description = description.trim();
    if (!title || title.length > 120 || !description || description.length > 1000)
      return;
    const task = (s.coordination ?? []).find(t => t.id === id);
    if (!task || task.status !== 'open' || task.revision !== revision || (ctx.by !== task.authorRole && ctx.by !== task.assignee))
      return;
    if (!validRequestOptions(s, options, task.parentNeedId)) return;
    if (task.origin === 'effect' && !task.sourceText) {
      const content = contentOf(s);
      const effects = [
        ...content.events.flatMap(event => [...event.options.flatMap(optionEffects), ...event.ignored.effects]),
        ...content.projects.flatMap(project => project.effects),
      ];
      const source = effects.find(effect => effect.kind === 'missionConstraint' && task.description.startsWith(effect.text));
      if (source?.kind === 'missionConstraint') task.sourceText = source.text;
    }
    if (purpose !== undefined && !['request', 'funding', 'equipment', 'timing'].includes(purpose)) return;
    if (purpose !== undefined) task.purpose = purpose;
    if (options !== undefined) { task.parentNeedId = options.parentNeedId; task.neededAt = options.neededAt; }
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

export function coordinationTasks(s: GameState): CoordinationTask[] {
  return coordinationBoard(s).tasks;
}
