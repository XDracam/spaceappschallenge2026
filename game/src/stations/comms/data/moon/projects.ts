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
    description: 'An evening at the planetarium for legislators and suppliers, with a lunar drill everyone can try on a bucket of fake regolith.',
    costM: 5, months: 1,
    startTrust: [],
    effects: [trust('government', 10), trust('industry', 5)],
    result: 'Moon Night: a senator drilled through the bucket and the table. Suppliers networked aggressively.',
  },

  // --------------------------------------------------------- campaigns
  {
    id: 'mo-water-campaign',
    name: '"Water on the Moon" campaign',
    kind: 'campaign',
    description: 'A month of explainers on why ice at the lunar poles matters for every future crew. Raises public trust and calms protests.',
    costM: 4, months: 1,
    startTrust: [],
    effects: [trust('public', 10), odds('protest', 0.5, 3)],
    result: '"Water on the Moon" wraps up: schoolchildren now ask for ice maps for their birthdays.',
  },

  // ------------------------------------------------------- negotiations
  {
    id: 'mo-supplier-roundtable',
    name: 'Supplier roundtable',
    kind: 'negotiation',
    description: 'Sit Feldwerk and the other suppliers down for frank talk about prices. Procurement pays less for a while.',
    costM: 3, months: 1,
    startTrust: [],
    effects: [trust('industry', 5), price(-10, 3)],
    result: 'Supplier roundtable: Feldwerk and friends agree to sharpen their pencils. Prices dip for three months.',
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
    description: "Borrow Northgate's test technicians for Science's lab. Research and part tests run faster while they are there.",
    costM: 3, months: 1,
    startTrust: [],
    requires: { stakeholder: 'partners', min: 50 },
    effects: [trust('partners', 5), pace(30, 2)],
    result: "Northgate's technicians join the lab: research and part tests run 30 % faster for two months.",
    partnerCharacterId: 'salo',
  },
];
