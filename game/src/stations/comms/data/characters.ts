// Recurring cast: one named face per stakeholder, plus a university dean for
// academic deals. All fictional (people, agencies, companies). Shared by every
// mission; each mission's content picks who appears (see content.ts).
import type { Character } from '../model/types';

export const CHARACTERS: Character[] = [
  { id: 'duarte', name: 'Senator Ana Duarte', role: 'Senator, chair of the space appropriations subcommittee', stakeholder: 'government', initials: 'AD', portrait: 'duarte.webp' },
  { id: 'feld', name: 'Marco Feld', role: 'CEO, Feldwerk Launch Systems', stakeholder: 'industry', initials: 'MF', portrait: 'feld.webp' },
  { id: 'okafor', name: 'Lina Okafor', role: 'Science journalist, The Orbital Ledger', stakeholder: 'public', initials: 'LO', portrait: 'okafor.webp' },
  { id: 'moreau', name: 'Dr. Kenji Moreau', role: 'Director, Meridian Space Agency', stakeholder: 'partners', initials: 'KM', portrait: 'moreau.webp' },
  { id: 'salo', name: 'Prof. Ingrid Salo', role: 'Dean of Engineering, Northgate University', stakeholder: 'partners', initials: 'IS', portrait: 'salo.webp' },
  // Weather satellite mission: the satellite's customer and the people who live by its forecasts.
  { id: 'lindqvist', name: 'Dr. Rosa Lindqvist', role: 'Director, National Weather Service', stakeholder: 'government', initials: 'RL', portrait: 'lindqvist.webp' },
  { id: 'harlan', name: 'Tom Harlan', role: "President, Plains Growers' Association", stakeholder: 'public', initials: 'TH', portrait: 'harlan.webp' },
  // Lunar ice lander mission: the crewed programme that will use the ice data.
  { id: 'kessler', name: 'Dr. Amara Kessler', role: 'Head of landing-site selection, crewed lunar programme', stakeholder: 'government', initials: 'AK' },
  // Spares: no mission cast uses them yet; events can bring them in by id.
  { id: 'brandt', name: 'Rep. Walter Brandt', role: 'Congressman, budget hawk on the oversight committee', stakeholder: 'government', initials: 'WB', portrait: 'brandt.webp' },
  { id: 'osei', name: 'Abena Osei', role: 'Head of the Launch Safety Office', stakeholder: 'government', initials: 'AO', portrait: 'osei.webp' },
  { id: 'raman', name: 'Priya Raman', role: 'CEO, Corvid Avionics (rival supplier)', stakeholder: 'industry', initials: 'PR', portrait: 'raman.webp' },
  { id: 'kowalski', name: 'Dan Kowalski', role: 'Union steward, Feldwerk assembly plant', stakeholder: 'industry', initials: 'DK', portrait: 'kowalski.webp' },
  { id: 'reyes', name: 'Jaz Reyes', role: 'Space streamer, "Orbit Jaz"', stakeholder: 'public', initials: 'JR', portrait: 'reyes.webp' },
  { id: 'whitfield', name: 'Grace Whitfield', role: 'Community organiser near the launch site', stakeholder: 'public', initials: 'GW', portrait: 'whitfield.webp' },
  { id: 'castellanos', name: 'Dr. Elena Castellanos', role: 'Lunar water researcher, Atacama Observatory', stakeholder: 'partners', initials: 'EC', portrait: 'castellanos.webp' },
  { id: 'haddad', name: 'Capt. Sami Haddad', role: 'Former astronaut, partner agency liaison', stakeholder: 'partners', initials: 'SH', portrait: 'haddad.webp' },
];

const byId = (ids: string[]): Character[] => ids.map((id) => CHARACTERS.find((c) => c.id === id)!);

/** Mars orbiter + lander cast. */
export const MARS_CAST: Character[] = byId(['duarte', 'feld', 'okafor', 'moreau', 'salo']);
/** Weather satellite cast. */
export const WEATHER_CAST: Character[] = byId(['duarte', 'feld', 'okafor', 'moreau', 'salo', 'lindqvist', 'harlan']);
/** Lunar ice lander cast. */
export const MOON_CAST: Character[] = byId(['duarte', 'feld', 'okafor', 'moreau', 'salo', 'kessler']);
