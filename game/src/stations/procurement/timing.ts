import type { Contract } from '../../core/model';
import type { GameState } from '../../core/state';

export interface ContractNeed {
  id: string;
  label: string;
  quantity: number;
  neededAt: number | undefined;
  source: 'task' | 'research-bonus' | 'requested' | 'unknown';
  /** Positive means delivery precedes the need; zero is simultaneous, not guaranteed readiness. */
  margin: number | undefined;
}

/** Current uses and their actual dates, without inventing dates for unassigned stock. */
export function contractTiming(s: { market: GameState['market']; research: Pick<GameState['research'], 'projects'> }, contract: Contract): { needs: ContractNeed[]; sinceSigning: number | undefined } {
  const delivery = contract.status === 'delivered' ? contract.deliveredAt : contract.status === 'active' ? contract.expectedAt : undefined;
  const allocations = s.market.allocations.filter(a => a.contractId === contract.id && a.status !== 'released');
  const needs: ContractNeed[] = [];
  const add = (id: string, label: string, quantity: number, neededAt: number | undefined, source: ContractNeed['source']) => {
    needs.push({ id, label, quantity, neededAt, source, margin: neededAt !== undefined && delivery !== undefined ? neededAt - delivery : undefined });
  };
  for (const allocation of allocations) {
    const task = s.market.tasks.find(t => t.id === allocation.taskId && t.status === 'open');
    const criterion = task?.criteria.find(c => c.id === allocation.criterionId);
    const project = allocation.projectId && s.research.projects.find(p => p.id === allocation.projectId && p.status === 'running');
    if (task && criterion) add(allocation.id, `${task.title} · ${criterion.label}`, allocation.quantity, task.neededAt, 'task');
    else if (project) add(allocation.id, project.title, allocation.quantity, project.endsAt, 'research-bonus');
    else if (contract.requestedNeededAt !== undefined) add(allocation.id, allocation.department ? `${allocation.department[0].toUpperCase()}${allocation.department.slice(1)} supply` : 'Allocated supply', allocation.quantity, contract.requestedNeededAt, 'requested');
    else add(allocation.id, allocation.department ? `${allocation.department[0].toUpperCase()}${allocation.department.slice(1)} supply` : 'Allocated supply', allocation.quantity, undefined, 'unknown');
  }
  const free = Math.max(0, contract.offerSnapshot.quantity - allocations.reduce((sum, a) => sum + a.quantity, 0));
  if (free > 0) add(`${contract.id}-free`, 'Unallocated supply', free, contract.requestedNeededAt, contract.requestedNeededAt === undefined ? 'unknown' : 'requested');
  return { needs, sinceSigning: contract.baselineExpectedAt === undefined ? undefined : contract.expectedAt - contract.baselineExpectedAt };
}
