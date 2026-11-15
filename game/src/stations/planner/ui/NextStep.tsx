import type { Evaluation, FlightState, PlannerGame } from '../model/types';
import { actions, getPlanner, getEvaluation, useEvaluation, usePlanner, useUi } from '../state/store';
import {
  altitudeOk, availableManeuvers, branchEndState, createManeuver, goalOrbitChangeLabel, hasAltitudeWindow,
} from '../physics';
import { formatDay } from '../model/units';
import { allParts } from '../model/rocketUtils';
import { bodyName, newId, openTab, partReadiness, plural, useLocalUi } from './common';

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

/**
 * Route hint from the active mission's goals: the first goal the plan does not reach yet,
 * if the next step toward it is a transfer, an orbit entry or a goal orbit change.
 * Other cases (landing, separation …) fall through to the problem / ordering hints.
 */
function routeHint(game: PlannerGame, ev: Evaluation): string | null {
  const results = ev.branches.flatMap((b) => b.maneuvers);
  const states = results.map((r) => r.stateAfter);
  const all = game.plan.branches.flatMap((b) => b.maneuvers);
  const launch = all[0]?.type === 'launch' ? all[0] : undefined;
  const home = launch?.body ?? 'earth';
  for (const goal of game.mission.goals) {
    const name = bodyName(goal.body);
    const reached = states.some((s) => {
      if (s.kind === 'lost' || s.body !== goal.body) return false;
      if (s.kind === 'orbit') return altitudeOk(goal, s.altitudeKm);
      return s.kind === 'surface';
    });
    if (reached) continue;
    const orbit = states.find((s): s is Extract<FlightState, { kind: 'orbit' }> => s.kind === 'orbit' && s.body === goal.body);
    if (orbit) {
      if (!hasAltitudeWindow(goal)) return null;
      return `Next: click “+ Next step” at ${name} → ${goalOrbitChangeLabel(goal, orbit.altitudeKm)}`;
    }
    if (states.some((s) => s.kind === 'approach' && s.body === goal.body)) {
      return `Next: click “+ Next step” at ${name} → Enter orbit`;
    }
    const heading = all.some((m) => m.type === 'transfer' && m.target === goal.body);
    if (goal.body !== home && !heading && all.length === 1 && launch) {
      return `Next: click “+ Next step” at ${bodyName(home)} → Transfer to ${name}`;
    }
    return null;
  }
  return null;
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
    const route = routeHint(game, ev);
    if (route) return { kind: 'text', text: route };
    const errors = ev.issues.filter((i) => i.severity === 'error').length;
    const r = partReadiness(game, ev);
    // Only late deliveries are wrong: offer the launch date that waits for the last one.
    if (r.late > 0 && errors === r.late) {
      const inDesign = new Set(allParts(game.rocket).map((l) => l.part.id));
      const arrival = Math.ceil(Math.max(...game.contracts
        .filter((c) => c.status === 'running' && inDesign.has(c.partId) && c.deliveryDay > game.plan.launchDay)
        .map((c) => c.deliveryDay)));
      if (arrival <= game.mission.completionDeadlineDay) {
        return {
          kind: 'button', text: `Next: move launch to ${formatDay(arrival, start)}`,
          onClick: () => actions.setLaunchDay(arrival), title: 'The last part arrives that day. Change it again on the Launch chip.',
        };
      }
    }
    if (errors > 0) return { kind: 'text', text: `Next: fix ${plural(errors, 'problem')} — see Issues`, tone: 'warn' };
    if (r.draft > 0) {
      return {
        kind: 'button', text: `Next: Rocket → Order ${plural(r.draft, 'part')} (for Procurement)`,
        onClick: () => openTab('rocket'), title: 'Open the Rocket panel',
      };
    }
    if (r.ordered > 0) return { kind: 'text', text: `Waiting for ${plural(r.ordered, 'delivery', 'deliveries')}` };
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
