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
    good: { text: 'The committee funds every day of surface operations. The drill gets its full schedule.', goalChanceDelta: 0.02 },
    bad: { text: 'Surface operations are funded week by week. The drill team rations its runs.', goalChanceDelta: -0.02 },
  },
  {
    id: 'mo-descent-tracking',
    station: 'comms',
    title: 'Tracking the descent',
    goodIf: anyOf(hasFlag(FLAG_GROUND_STATION), trustAbove('partners', 60)),
    good: { text: 'A partner dish follows the whole descent. The flight team sees every second of it.', goalChanceDelta: 0.03 },
    bad: { text: 'The lander drops out of contact for forty seconds during the descent. Nobody breathes.', goalChanceDelta: -0.02 },
  },
  {
    id: 'mo-engine-patch',
    station: 'procurement',
    title: 'Descent engine software patch',
    goodIf: allOf(trustAbove('industry', 45), lacksFlag('contract.cheapest')),
    good: { text: 'The engine supplier sends a throttle patch a day before landing. It works first time.', goalChanceDelta: 0.03 },
    bad: { text: "The supplier's support line is closed for the weekend. The landing flies on the old throttle table.", goalChanceDelta: -0.03 },
  },
  {
    id: 'mo-rehearsed-landing',
    station: 'planner',
    title: 'Rehearsed landing',
    goodIf: lacksFlag('plan.launchMoved'),
    good: { text: 'The flight team rehearsed this descent for months. The lander touches down by the book.', goalChanceDelta: 0.02 },
    bad: { text: 'The moved launch cut the rehearsals short. The descent uses more fuel hovering than planned.', goalChanceDelta: -0.02 },
  },
];
