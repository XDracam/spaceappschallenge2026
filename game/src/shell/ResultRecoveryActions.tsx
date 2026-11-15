import { useSync } from '../core/store';
import { hostRecoverMission } from './session';

/** Shared recovery controls; each station retains its existing button styling. */
export function ResultRecoveryActions({ planner = false }: { planner?: boolean }) {
  const client = useSync(s => s.role === 'client');
  if (client) return <span class={planner ? 'muted small' : 'shell-muted'}>The host can retry or choose a mission for the group.</span>;
  return <>
    <button class={planner ? 'btn' : 'shell-btn'} onClick={() => hostRecoverMission('choose')}>Choose mission</button>
    <button class={planner ? 'btn primary' : 'shell-btn shell-btn-primary'} onClick={() => hostRecoverMission('retry')}>Retry mission</button>
  </>;
}
