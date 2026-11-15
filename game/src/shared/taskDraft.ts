import type { StationId } from '../core/model';

export interface TaskDraft {
  title: string;
  description: string;
  assignee: StationId;
  purpose?: 'request' | 'funding' | 'equipment' | 'timing';
  requestKey?: string;
  parentNeedId?: string;
  neededAt?: number;
}

/** Open an editable request. Publication still requires the player's Save action. */
export function composeTask(draft: TaskDraft): void {
  window.dispatchEvent(new CustomEvent<TaskDraft>('coordination-compose', { detail: draft }));
}
