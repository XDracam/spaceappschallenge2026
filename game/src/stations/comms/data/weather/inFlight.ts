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
    good: { text: 'The weather service signs a long operations contract without haggling. The ground team stays fully staffed.', goalChanceDelta: 0.02 },
    bad: { text: 'The operations contract is renewed one quarter at a time. The ground team works short-handed.', goalChanceDelta: -0.02 },
  },
  {
    id: 'wx-first-image-downlink',
    station: 'comms',
    title: 'First image downlink',
    goodIf: anyOf(hasFlag(FLAG_GROUND_STATION), trustAbove('partners', 60)),
    good: { text: 'A partner dish catches the first full-disk image on the first try. It leads every evening forecast.', goalChanceDelta: 0.03 },
    bad: { text: 'The first downlink pass is missed and the image arrives a day late. Mallory announces it anyway.', goalChanceDelta: -0.02 },
  },
  {
    id: 'wx-thruster-glitch',
    station: 'procurement',
    title: 'Thruster glitch during the orbit raise',
    goodIf: allOf(trustAbove('industry', 45), lacksFlag('contract.cheapest')),
    good: { text: "The supplier's team sends a thruster software patch within hours. The orbit raise finishes on schedule.", goalChanceDelta: 0.03 },
    bad: { text: "The supplier's support line puts mission control on hold. The orbit raise takes an extra week of margin.", goalChanceDelta: -0.03 },
  },
  {
    id: 'wx-station-arrival',
    station: 'planner',
    title: 'Arrival at the geostationary slot',
    goodIf: lacksFlag('plan.launchMoved'),
    good: { text: 'The flight team rehearsed this orbit raise for months. The satellite drifts into its slot by the book.', goalChanceDelta: 0.02 },
    bad: { text: 'The moved launch left less rehearsal time. An extra trim burn eats into the station-keeping fuel.', goalChanceDelta: -0.02 },
  },
];
