// Lunar ice lander — proactive projects (2 slots). Costs come from the shared
// budget; some cost trust at start (startTrust). Bigger deals need trust
// (`requires`, starting trust is 50). Negotiated parts arrive as offers to procurement.
//
// Two deals reach into the main decisions of the other stations:
// - 'Booster engine from Feldwerk' keeps the one-big-engine design possible after the
//   long-lead catalogue offers are too late (Tallis needs eight months).
// - 'Northgate regolith lab' is a second route to the drill-and-oven lab if Science's
//   research fails.
// Left out (as in the weather set): the plutonium, laser and ion licences and the
// nuclear hearing. They open techs this lander never needs.
import type { ProjectDef } from '../../model/types';
import { limit, odds, offer, pace, price, trust } from '../helpers';

export const PROJECTS: ProjectDef[] = [
  // ------------------------------------------------------------- galas
  {
    id: 'mo-moon-night-gala',
    name: 'Moon Night gala',
    kind: 'gala',
    description: "Let legislators and suppliers try the lunar drill on imitation regolith at the planetarium. There is a bucket, a table and ample room for advice.",
    costM: 5, months: 1,
    startTrust: [],
    effects: [trust('government', 10), trust('industry', 5)],
    result: "A senator drills through the bucket into the table. Suppliers offer competing repairs; Duarte’s colleagues leave on friendlier terms with the mission.",
  },

  // --------------------------------------------------------- campaigns
  {
    id: 'mo-water-campaign',
    name: '"Water on the Moon" campaign',
    kind: 'campaign',
    description: "Explain how the polar drill will look for ice and why future crews care. Give the public a reason to support the mission and protesters fewer easy targets.",
    costM: 4, months: 1,
    startTrust: [],
    effects: [trust('public', 10), odds('protest', 0.5, 3)],
    result: "The campaign leaves readers asking where the drill will land and what would count as finding ice. Support rises and protests lose some momentum.",
  },

  // ------------------------------------------------------- negotiations
  {
    id: 'mo-supplier-roundtable',
    name: 'Supplier roundtable',
    kind: 'negotiation',
    description: "Bring the lunar suppliers together to discuss what Procurement can afford. Seek lower quotes without turning the meeting into a dispute over the lander.",
    costM: 3, months: 1,
    startTrust: [],
    effects: [trust('industry', 5), price(-10, 3)],
    result: "Feldwerk and the other suppliers agree to a 10% price reduction for three months. Feld asks that the minutes describe it as support for the lunar programme.",
    partnerCharacterId: 'feld',
  },
  {
    id: 'mo-feldwerk-booster',
    name: 'Booster engine from Feldwerk',
    kind: 'negotiation',
    description: 'Feldwerk has a 4,500 kN kerosene engine from a cancelled order. Negotiate it for procurement: it ships in 4 months instead of 8.',
    costM: 3, months: 1,
    startTrust: [],
    requires: { stakeholder: 'industry', min: 55 },
    effects: [
      trust('industry', 5),
      offer({
        partKind: 'engine', variant: 'kerolox', supplier: 'Feldwerk Launch Systems',
        priceM: 55, deliveryMonths: 4, reliability: 0.985,
        note: 'Single 4,500 kN booster engine from a cancelled order.',
        // Same mass as the catalogue's Boreal KL-4500: without it the offer would weigh the
        // generic 0.4 t engine estimate and flatter the design by ~0.4 km/s.
        stats: { thrustKN: 4500, isp: 320 }, massT: 6.95,
      }),
    ],
    result: "Feldwerk's 4,500 kN engine is now an offer in procurement's list: four months to deliver.",
    partnerCharacterId: 'feld',
  },
  {
    id: 'mo-northgate-regolith-lab',
    name: 'Northgate regolith lab',
    kind: 'negotiation',
    description: "Fund Northgate's regolith lab to share its drill-and-oven results. Raises the surface-lab limit to 5: a second route if Science's lab research fails.",
    costM: 6, months: 3,
    startTrust: [],
    requires: { stakeholder: 'partners', min: 55 },
    effects: [trust('partners', 5), limit('instrument.surfaceLab.performance', 5)],
    result: 'Northgate shares its drill-and-oven results: surface labs can now reach performance 5.',
    partnerCharacterId: 'salo',
  },
  {
    // Comms' lever on reliability: Science's part tests halve a part's risk of failure
    // and follow the research pace (science/model/tests.ts).
    id: 'mo-northgate-test-crew',
    name: 'Northgate test technicians',
    kind: 'negotiation',
    description: "Arrange a Northgate technician visit to the lunar team’s lab. Their help accelerates Science research and hardware tests for a limited stay.",
    costM: 3, months: 1,
    startTrust: [],
    requires: { stakeholder: 'partners', min: 50 },
    effects: [trust('partners', 5), pace(30, 2)],
    result: "The visiting Northgate technicians give the lab two months of help. Research and part tests run 30% faster during the visit.",
    partnerCharacterId: 'salo',
  },
];
