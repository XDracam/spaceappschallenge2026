// In-flight events: resolved automatically from the state at launch (trust and
// flags). Few and mild: goalChanceDelta stays within ±0.05.
import type { InFlightEventDef } from '../../model/types';
import { FLAG_GROUND_STATION, allOf, anyOf, hasFlag, lacksFlag, trustAbove } from '../helpers';

export const IN_FLIGHT: InFlightEventDef[] = [
  {
    id: 'extended-ops-funding',
    station: 'comms',
    title: 'Operations funding review',
    goodIf: trustAbove('government', 60),
    good: { text: 'Stable operations funding gives the imaging team better support.', goalChanceDelta: 0.03 },
    bad: { text: 'Uncertain operations funding leaves the imaging team with less support.', goalChanceDelta: -0.03 },
  },
  {
    id: 'relay-window-tracking',
    station: 'comms',
    title: 'Busy week on the dishes',
    goodIf: anyOf(hasFlag(FLAG_GROUND_STATION), trustAbove('partners', 60)),
    good: { text: 'Partner dishes improve support for the lander\'s difficult relay windows.', goalChanceDelta: 0.03 },
    bad: { text: 'Limited partner dish availability makes the lander\'s relay coverage less certain.', goalChanceDelta: -0.02 },
  },
  {
    id: 'supplier-software-patch',
    station: 'procurement',
    title: 'Valve glitch in cruise',
    goodIf: allOf(trustAbove('industry', 45), lacksFlag('contract.cheapest')),
    good: { text: "The engine supplier's prompt support improves the cruise team's readiness for valve trouble.", goalChanceDelta: 0.04 },
    bad: { text: "The supplier's support line puts mission control on hold, leaving the cruise team with less help for valve trouble.", goalChanceDelta: -0.04 },
  },
  {
    id: 'instrument-noise',
    station: 'science',
    title: 'Noise in the instrument data',
    goodIf: anyOf(hasFlag('research.breakthrough'), trustAbove('partners', 65)),
    good: { text: 'University calibration support improves confidence in the instrument data.', goalChanceDelta: 0.03 },
    bad: { text: 'Without university support, the science team faces instrument-noise concerns alone.', goalChanceDelta: -0.03 },
  },
  {
    id: 'rehearsed-trajectory',
    station: 'planner',
    title: 'Mars orbit insertion',
    goodIf: lacksFlag('plan.launchMoved'),
    good: { text: 'Months of trajectory rehearsal improve the flight team\'s readiness for Mars orbit insertion.', goalChanceDelta: 0.02 },
    bad: { text: 'The moved launch left less rehearsal time and more uncertainty about Mars orbit insertion.', goalChanceDelta: -0.03 },
  },
];
