// Recurring cast: one named face per stakeholder, plus a university dean for
// academic deals. All fictional (people, agencies, companies).
import type { Character } from '../model/types';

export const CHARACTERS: Character[] = [
  { id: 'duarte', name: 'Senator Ana Duarte', role: 'Senator, chair of the space appropriations subcommittee', stakeholder: 'government', initials: 'AD' },
  { id: 'feld', name: 'Marco Feld', role: 'CEO, Feldwerk Launch Systems', stakeholder: 'industry', initials: 'MF' },
  { id: 'okafor', name: 'Lina Okafor', role: 'Science journalist, The Orbital Ledger', stakeholder: 'public', initials: 'LO' },
  { id: 'moreau', name: 'Dr. Kenji Moreau', role: 'Director, Meridian Space Agency', stakeholder: 'partners', initials: 'KM' },
  { id: 'salo', name: 'Prof. Ingrid Salo', role: 'Dean of Engineering, Northgate University', stakeholder: 'partners', initials: 'IS' },
];
