// Weather satellite — in-flight events: resolved automatically from the state at
// launch (trust and flags). Few and mild: goalChanceDelta stays within ±0.03.
import type { InFlightEventDef } from '../../model/types';
import { FLAG_GROUND_STATION, allOf, anyOf, hasFlag, lacksFlag, trustAbove } from '../helpers';

export const IN_FLIGHT: InFlightEventDef[] = [
  {
    id: 'wx-ops-contract',
    station: 'comms',
    title: 'Operations contract',
    goodIf: trustAbove('government', 60),
    good: { text: 'A stable operations contract gives the ground team better support for the weather mission.', goalChanceDelta: 0.02 },
    bad: { text: 'Quarter-by-quarter operations funding leaves the ground team with less support.', goalChanceDelta: -0.02 },
  },
  {
    id: 'wx-first-image-downlink',
    station: 'comms',
    title: 'First image downlink',
    goodIf: anyOf(hasFlag(FLAG_GROUND_STATION), trustAbove('partners', 60)),
    good: { text: 'Partner tracking improves support for the first full-disk image downlink.', goalChanceDelta: 0.03 },
    bad: { text: 'Limited partner tracking makes the first image downlink less certain. Mallory has already announced his broadcast slot.', goalChanceDelta: -0.02 },
  },
  {
    id: 'wx-thruster-glitch',
    station: 'procurement',
    title: 'Thruster glitch during the orbit raise',
    goodIf: allOf(trustAbove('industry', 45), lacksFlag('contract.cheapest')),
    good: { text: "The supplier's prompt thruster support improves the orbit-raise team's readiness.", goalChanceDelta: 0.03 },
    bad: { text: "The supplier's support line puts mission control on hold, leaving the orbit-raise team less prepared.", goalChanceDelta: -0.03 },
  },
  {
    id: 'wx-station-arrival',
    station: 'planner',
    title: 'Arrival at the geostationary slot',
    goodIf: lacksFlag('plan.launchMoved'),
    good: { text: 'Months of orbit-raise rehearsal improve the flight team\'s readiness.', goalChanceDelta: 0.02 },
    bad: { text: 'The moved launch left less rehearsal time and more uncertainty about the final trim burn.', goalChanceDelta: -0.02 },
  },
];
