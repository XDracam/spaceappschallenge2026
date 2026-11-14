import type { ResearchTask } from '../model/types';

// Placeholder tasks standing in for what the Mission Planning module posts. They follow the planner's
// "get that part" idea: a part beyond current research becomes a task that science can answer by raising
// a research limit or unlocking a part (mission-planner/rocket-configurator.md). All numbers are placeholders.
export const INITIAL_TASKS: ResearchTask[] = [
  {
    id: 'rad-shield', title: 'Radiation shield, level 5', kind: 'research', requestedBy: 'Mission Planning',
    part: 'Radiation shield', detail: 'Research limit is level 3. The lander design asks for level 5.',
    why: 'The crew module needs the higher level to stay inside the dose limit on the surface of Mars.',
    fieldIds: ['r6', 'r10', 'm16'], dueInDays: 240, duration: '~7 months', status: 'open',
  },
  {
    id: 'radar', title: 'Unlock: ground-penetrating radar', kind: 'unlock', requestedBy: 'Mission Planning',
    part: 'Ground-penetrating radar', detail: 'Not unlocked. The orbiter payload includes one.',
    why: 'The ice survey needs it. Without it the part can only be bought, at a high price.',
    fieldIds: ['i5', 'g9', 'i4'], dueInDays: 200, duration: '~5 months', status: 'open',
  },
  {
    id: 'solar', title: 'Solar array, 16.5 kW', kind: 'research', requestedBy: 'Mission Planning',
    part: 'Solar array', detail: 'Research limit is 12 kW. The orbiter asks for 16.5 kW.',
    why: 'Sunlight at Mars is weak, and the instruments and the radio together need more power than the array gives.',
    fieldIds: ['m8', 'm9'], dueInDays: 260, duration: '~6 months', status: 'open',
  },
  {
    id: 'antenna', title: 'Antenna, 3640 kbps', kind: 'research', requestedBy: 'Mission Planning',
    part: 'High-gain antenna', detail: 'Research limit is 2400 kbps. The orbiter asks for 3640 kbps.',
    why: 'The science data rate is higher than the current link can send during one relay window.',
    fieldIds: ['o11', 'o14', 'i14'], dueInDays: 270, duration: '~8 months', status: 'open',
  },
];
