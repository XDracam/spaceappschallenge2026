import type { FlightState } from '../model/types';
import { actions, getPlanner, getEvaluation, useEvaluation, usePlanner, useUi } from '../state/store';
import { availableManeuvers, branchEndState, createManeuver } from '../physics';
import { formatDay } from '../model/units';
import { newId, openTab, partReadiness, plural, useLocalUi } from './common';

// One-line hint at the top-left of the free map area: what to do next, driven by plan state.

/** Add the launch to an empty plan directly (same path as the maneuver menu's only option). */
function addLaunch() {
  const game = getPlanner();
  const root = game.plan.branches[0];
  if (!root || root.maneuvers.length > 0) return;
  const state: FlightState = branchEndState(getEvaluation(), root.id) ?? { kind: 'surface', body: 'earth', day: game.plan.launchDay };
  const opt = availableManeuvers(game, root, state).find((o) => o.enabled);
  if (!opt) return;
  actions.addManeuver(root.id, createManeuver(game, root, state, opt, newId));
}

type Step =
  | { kind: 'button'; text: string; onClick: () => void; glow?: boolean; title?: string }
  | { kind: 'text'; text: string; tone?: 'ok' | 'warn' };

export function NextStep() {
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const inPlayback = useUi((u) => !!u.playthrough);
  const insets = useLocalUi((s) => s.insets);
  if (game.phase !== 'planning' || inPlayback) return null;

  const step = pickStep();
  function pickStep(): Step {
    const start = game.mission.startDateISO;
    const launch = formatDay(game.plan.launchDay, start);
    const all = game.plan.branches.flatMap((b) => b.maneuvers);
    if (all.length === 0) {
      return { kind: 'button', text: 'Start: Launch from Earth', onClick: addLaunch, glow: true, title: 'Add the launch to the plan' };
    }
    if (all.length === 1 && all[0].type === 'launch') {
      return { kind: 'text', text: 'Next: click “+ Next step” at Earth → Transfer to Mars' };
    }
    const toMars = all.some((m) => m.type === 'transfer' && m.target === 'mars');
    const atMars = ev.branches.some((b) => b.maneuvers.some((r) =>
      (r.stateAfter.kind === 'orbit' || r.stateAfter.kind === 'surface') && r.stateAfter.body === 'mars'));
    if (toMars && !atMars) return { kind: 'text', text: 'Next: click “+ Next step” at Mars → Enter orbit' };
    const errors = ev.issues.filter((i) => i.severity === 'error').length;
    if (errors > 0) return { kind: 'text', text: `Next: fix ${plural(errors, 'problem')} — see Issues`, tone: 'warn' };
    const r = partReadiness(game, ev);
    if (r.draft > 0) {
      return {
        kind: 'button', text: `Next: order ${plural(r.draft, 'part')} (Rocket → Order all parts)`,
        onClick: () => openTab('rocket'), title: 'Open the Rocket panel',
      };
    }
    if (r.ordered > 0) return { kind: 'text', text: `Waiting for ${plural(r.ordered, 'delivery', 'deliveries')} — launch ${launch}` };
    return { kind: 'text', text: `Ready: launches ${launch}`, tone: 'ok' };
  }

  return (
    <div class="next-step" style={{ left: `${insets.left + 16}px`, top: `${insets.top + 64}px` }}>
      {step.kind === 'button' ? (
        <button class={`next-pill clickable${step.glow ? ' glow' : ''}`} title={step.title} onClick={step.onClick}>{step.text}</button>
      ) : (
        <div class={`next-pill${step.tone ? ` ${step.tone}` : ''}`}>{step.text}</div>
      )}
    </div>
  );
}
