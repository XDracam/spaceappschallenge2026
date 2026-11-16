// Lunar ice lander — in-flight events: resolved automatically from the state at
// launch (trust and flags). Few and mild: goalChanceDelta stays within ±0.03.
import type { InFlightEventDef } from '../../model/types';
import { FLAG_GROUND_STATION, allOf, anyOf, hasFlag, lacksFlag, trustAbove } from '../helpers';

export const IN_FLIGHT: InFlightEventDef[] = [
  {
    id: 'mo-ops-funding',
    station: 'comms',
    title: 'Surface operations funding',
    goodIf: trustAbove('government', 60),
    good: { text: 'Stable operations funding gives the drill team better support for its work.', goalChanceDelta: 0.02 },
    bad: { text: 'Week-by-week operations funding leaves the drill team with less support.', goalChanceDelta: -0.02 },
  },
  {
    id: 'mo-descent-tracking',
    station: 'comms',
    title: 'Tracking the descent',
    goodIf: anyOf(hasFlag(FLAG_GROUND_STATION), trustAbove('partners', 60)),
    good: { text: 'Partner tracking gives the flight team better support during descent.', goalChanceDelta: 0.03 },
    bad: { text: 'Limited partner tracking leaves the flight team less confident about descent coverage.', goalChanceDelta: -0.02 },
  },
  {
    id: 'mo-engine-patch',
    station: 'procurement',
    title: 'Descent engine software patch',
    goodIf: allOf(trustAbove('industry', 45), lacksFlag('contract.cheapest')),
    good: { text: 'Responsive supplier support improves confidence in the descent engine.', goalChanceDelta: 0.03 },
    bad: { text: "The supplier's support line is closed for the weekend. The descent team has less help with throttle concerns.", goalChanceDelta: -0.03 },
  },
  {
    id: 'mo-rehearsed-landing',
    station: 'planner',
    title: 'Rehearsed landing',
    goodIf: lacksFlag('plan.launchMoved'),
    good: { text: 'Months of descent rehearsal improve the landing team\'s readiness.', goalChanceDelta: 0.02 },
    bad: { text: 'The moved launch cut rehearsals short, leaving the landing team less prepared.', goalChanceDelta: -0.02 },
  },
];
