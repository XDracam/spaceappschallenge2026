// Recurring cast: one named face per stakeholder, plus a university dean for
// academic deals. All fictional (people, agencies, companies). Shared by every
// mission; each mission's content picks who appears (see content.ts).
import type { Character } from '../model/types';

export const CHARACTERS: Character[] = [
  { id: 'duarte', name: 'Senator Ana Duarte', role: 'Senator, chair of the space appropriations subcommittee', stakeholder: 'government', initials: 'AD' },
  { id: 'feld', name: 'Marco Feld', role: 'CEO, Feldwerk Launch Systems', stakeholder: 'industry', initials: 'MF' },
  { id: 'okafor', name: 'Lina Okafor', role: 'Science journalist, The Orbital Ledger', stakeholder: 'public', initials: 'LO' },
  { id: 'moreau', name: 'Dr. Kenji Moreau', role: 'Director, Meridian Space Agency', stakeholder: 'partners', initials: 'KM' },
  { id: 'salo', name: 'Prof. Ingrid Salo', role: 'Dean of Engineering, Northgate University', stakeholder: 'partners', initials: 'IS' },
  // Weather satellite mission: the satellite's customer and the people who live by its forecasts.
  { id: 'lindqvist', name: 'Dr. Rosa Lindqvist', role: 'Director, National Weather Service', stakeholder: 'government', initials: 'RL' },
  { id: 'harlan', name: 'Tom Harlan', role: "President, Plains Growers' Association", stakeholder: 'public', initials: 'TH' },
];

const byId = (ids: string[]): Character[] => ids.map((id) => CHARACTERS.find((c) => c.id === id)!);

/** Mars orbiter + lander cast. */
export const MARS_CAST: Character[] = byId(['duarte', 'feld', 'okafor', 'moreau', 'salo']);
/** Weather satellite cast. */
export const WEATHER_CAST: Character[] = byId(['duarte', 'feld', 'okafor', 'moreau', 'salo', 'lindqvist', 'harlan']);
