// Proactive projects (2–3 slots). They cost money from the shared budget,
// calendar time, and sometimes trust (startTrust, applied at start). Bigger
// deals need trust (`requires`). Negotiated parts arrive as offers to procurement.
import type { ProjectDef } from '../model/types';
import { budget, limit, odds, offer, price, service, setFlag, trust } from './helpers';

/** Flag set when the partner ground-station deal completes (used by in-flight events). */
export const FLAG_GROUND_STATION = 'comms.groundStation';

export const PROJECTS: ProjectDef[] = [
  // ------------------------------------------------------------- galas
  {
    id: 'mars-night-gala',
    name: 'Mars Night gala',
    kind: 'gala',
    description: 'Black-tie evening at the science museum for legislators and suppliers, lander mock-up included.',
    costM: 15, months: 2,
    startTrust: [],
    effects: [trust('government', 10), trust('industry', 5)],
    result: 'Mars Night gala: senators toured the lander mock-up and stayed for dessert. Suppliers networked aggressively.',
  },
  {
    id: 'touring-exhibit',
    name: 'Touring Mars exhibit',
    kind: 'gala',
    description: 'A travelling exhibit with a full-size lander model, built with partner museums.',
    costM: 10, months: 2,
    startTrust: [],
    effects: [trust('public', 10), trust('partners', 5)],
    result: 'The Mars exhibit opens in six cities. Children now ask about landing legs at dinner.',
  },

  // --------------------------------------------------------- campaigns
  {
    id: 'press-campaign',
    name: '"Mars Works" press campaign',
    kind: 'campaign',
    description: 'A month of op-eds, explainers and interviews. Raises public trust and calms protests.',
    costM: 10, months: 1,
    startTrust: [],
    effects: [trust('public', 10), odds('protest', 0.5, 4)],
    result: '"Mars Works" wraps up: explainers everywhere, protest turnout down.',
  },
  {
    id: 'sponsorship-drive',
    name: 'Corporate sponsorship drive',
    kind: 'campaign',
    description: 'Logos on the launch fairing in exchange for cash. Purists will grumble.',
    costM: 5, months: 2,
    startTrust: [{ stakeholder: 'public', delta: -5 }],
    requires: { stakeholder: 'industry', min: 45 },
    effects: [budget(40), trust('industry', 5)],
    result: 'Sponsorship drive closes: 40 M raised. The fairing now advertises a sports drink.',
  },

  // ---------------------------------------------------------- lobbying
  {
    id: 'capitol-lobbying',
    name: 'Capitol lobbying push',
    kind: 'lobbying',
    description: 'Breakfasts, briefings and handshakes. Makes funding offers likelier; the public dislikes lobbyists.',
    costM: 5, months: 2,
    startTrust: [{ stakeholder: 'public', delta: -5 }],
    effects: [trust('government', 10), odds('funding', 2, 6)],
    result: 'Lobbying push ends: the committee now knows the mission by name, and funding talk is warmer.',
  },

  // ------------------------------------------------------- negotiations
  {
    id: 'supplier-roundtable',
    name: 'Supplier roundtable',
    kind: 'negotiation',
    description: 'Sit Feldwerk and the other suppliers down for frank talk about prices. Procurement pays less for a while.',
    costM: 5, months: 1,
    startTrust: [],
    effects: [trust('industry', 5), price(-10, 4)],
    result: 'Supplier roundtable: Feldwerk and friends agree to sharpen their pencils. Prices dip for four months.',
    partnerCharacterId: 'feld',
  },
  {
    id: 'meridian-rtg-loan',
    name: 'RTG from Meridian',
    kind: 'negotiation',
    description: "Negotiate a flight-proven RTG from Meridian's reserve, offered to procurement at cost. Critics will call it foreign dependence.",
    costM: 10, months: 4,
    startTrust: [{ stakeholder: 'government', delta: -5 }],
    requires: { stakeholder: 'partners', min: 60 },
    effects: [
      trust('partners', 5),
      offer({
        partKind: 'power', variant: 'rtg', supplier: 'Meridian Space Agency',
        priceM: 15, deliveryMonths: 3, reliability: 0.99,
        note: "Flight-proven RTG from Meridian's reserve, at cost.",
      }),
    ],
    result: 'Meridian agrees to supply an RTG at cost. The offer is in procurement\'s list.',
    partnerCharacterId: 'moreau',
  },
  {
    id: 'meridian-ion-engine',
    name: 'Ion engine deal',
    kind: 'negotiation',
    description: "Meridian builds ion thrusters; we don't. Negotiate one for procurement. Industry and government will both frown.",
    costM: 8, months: 3,
    startTrust: [{ stakeholder: 'government', delta: -5 }, { stakeholder: 'industry', delta: -5 }],
    requires: { stakeholder: 'partners', min: 55 },
    effects: [
      trust('partners', 5),
      offer({
        partKind: 'engine', variant: 'ion', supplier: 'Meridian Space Agency',
        priceM: 10, deliveryMonths: 2, reliability: 0.97,
        note: 'Meridian ion thruster, flight-qualified on their asteroid probe.',
      }),
    ],
    result: "Ion engine deal signed: Meridian's thruster is now an offer in procurement's list.",
    partnerCharacterId: 'moreau',
  },
  {
    id: 'northgate-engine-research',
    name: 'Northgate engine research exchange',
    kind: 'negotiation',
    description: "Fund Northgate's combustion lab to share its injector work. Raises the hydrogen engine Isp limit for science and the planner.",
    costM: 12, months: 3,
    startTrust: [],
    requires: { stakeholder: 'partners', min: 55 },
    effects: [trust('partners', 5), limit('engine.hydrolox.isp', 465)],
    result: 'Northgate shares its injector results: hydrogen engines can now reach 465 s Isp.',
    partnerCharacterId: 'salo',
  },
  {
    id: 'meridian-ground-station',
    name: 'Deep-space ground station access',
    kind: 'negotiation',
    description: "Book time on Meridian's 70 m dish so the lander needs a smaller antenna. Some senators prefer domestic dishes.",
    costM: 10, months: 3,
    startTrust: [{ stakeholder: 'government', delta: -5 }],
    requires: { stakeholder: 'partners', min: 50 },
    effects: [
      trust('partners', 5),
      service('groundStation', "Meridian's 70 m dish receives lander data: the needed antenna data rate is halved."),
      setFlag(FLAG_GROUND_STATION),
    ],
    result: "Meridian's 70 m dish is booked for the mission. The planner can plan with a smaller lander antenna.",
    partnerCharacterId: 'moreau',
  },
];
