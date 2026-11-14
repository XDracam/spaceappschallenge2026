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
    good: { text: 'The committee renews operations funding without a fight. Extra imaging orbits are scheduled.', goalChanceDelta: 0.03 },
    bad: { text: 'Operations funding is trimmed in the next budget. Imaging passes are rationed.', goalChanceDelta: -0.03 },
  },
  {
    id: 'relay-window-tracking',
    station: 'comms',
    title: 'Busy week on the dishes',
    goodIf: anyOf(hasFlag(FLAG_GROUND_STATION), trustAbove('partners', 60)),
    good: { text: 'Partner dishes track the lander through a tricky relay window. No data is lost.', goalChanceDelta: 0.03 },
    bad: { text: 'No partner dish is free during a busy week. Some lander data waits, and some is lost.', goalChanceDelta: -0.02 },
  },
  {
    id: 'supplier-software-patch',
    station: 'procurement',
    title: 'Valve glitch in cruise',
    goodIf: allOf(trustAbove('industry', 45), lacksFlag('contract.cheapest')),
    good: { text: "The engine supplier's team sends a software patch for a sticky valve within hours.", goalChanceDelta: 0.04 },
    bad: { text: "The supplier's support line puts mission control on hold. The valve glitch costs a week of margin.", goalChanceDelta: -0.04 },
  },
  {
    id: 'instrument-noise',
    station: 'science',
    title: 'Noise in the instrument data',
    goodIf: anyOf(hasFlag('research.breakthrough'), trustAbove('partners', 65)),
    good: { text: 'University partners spot the cause of the instrument noise and send a new calibration.', goalChanceDelta: 0.03 },
    bad: { text: 'The science team diagnoses the instrument noise alone. It takes weeks of lost observations.', goalChanceDelta: -0.03 },
  },
  {
    id: 'rehearsed-trajectory',
    station: 'planner',
    title: 'Mars orbit insertion',
    goodIf: lacksFlag('plan.launchMoved'),
    good: { text: 'The flight team rehearsed this exact trajectory for months. Insertion goes by the book.', goalChanceDelta: 0.02 },
    bad: { text: 'The moved launch left less rehearsal time. An extra correction burn eats into the margins.', goalChanceDelta: -0.03 },
  },
];
