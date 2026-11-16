// Proactive projects (2 slots). They cost money from the shared budget,
// calendar time, and sometimes trust (startTrust, applied at start). Bigger
// deals need trust (`requires`). Negotiated parts arrive as offers to procurement.
import type { ProjectDef } from '../../model/types';
import { FLAG_GROUND_STATION, budget, limit, odds, offer, price, setFlag, techAccess, trust } from '../helpers';

export const PROJECTS: ProjectDef[] = [
  // ------------------------------------------------------------- galas
  {
    id: 'mars-night-gala',
    name: 'Mars Night gala',
    kind: 'gala',
    description: "Invite legislators and suppliers to a black-tie evening around the lander mock-up. The seating plan may take as much negotiation as the speeches.",
    costM: 15, months: 2,
    startTrust: [],
    effects: [trust('government', 10), trust('industry', 5)],
    result: "Over dinner, legislators get their questions answered beside the lander model. Feld leaves with new committee acquaintances and a stack of business cards.",
  },
  {
    id: 'touring-exhibit',
    name: 'Touring Mars exhibit',
    kind: 'gala',
    description: 'A travelling exhibit with a full-size lander model, built with partner museums.',
    costM: 10, months: 2,
    startTrust: [],
    effects: [trust('public', 10), trust('partners', 5)],
    result: "Partner museums open the lander exhibit in six cities. Families examine the landing legs, and the museums share credit for bringing the mission to their visitors.",
  },

  // --------------------------------------------- approvals for science techs (D-017)
  {
    id: 'plutonium-licence',
    name: 'Plutonium licence',
    kind: 'lobbying',
    description: 'Win the government licence to qualify a radioisotope heat source. Science cannot start the RTG techs without it.',
    costM: 8, months: 3,
    startTrust: [{ stakeholder: 'public', delta: -5 }],
    requires: { stakeholder: 'government', min: 35 },
    effects: [techAccess('rtg-heat-source', 'enable', 'Radioisotope heat source approved')],
    result: 'The licence is signed. Science may qualify a radioisotope heat source.',
  },
  {
    id: 'laser-licence',
    name: 'Laser link licence',
    kind: 'negotiation',
    description: 'Agree frequencies and ground sites with partner agencies for an optical link. Science cannot start the laser terminal without it.',
    costM: 6, months: 2,
    startTrust: [],
    requires: { stakeholder: 'partners', min: 35 },
    effects: [techAccess('optical-terminal', 'enable', 'Optical link licence granted')],
    result: 'The partners grant the laser link licence. Science may start the optical terminal.',
    partnerCharacterId: 'moreau',
  },
  {
    id: 'export-licence',
    name: 'Ion export licence',
    kind: 'lobbying',
    description: 'Clear the export review of ion engine technology so science can resume work on it.',
    costM: 7, months: 2,
    startTrust: [{ stakeholder: 'government', delta: -3 }],
    effects: [techAccess('ion-grid', 'enable', 'Ion engine export review cleared')],
    result: 'The export review closes. Science may work on the ion engine again.',
  },
  {
    id: 'nuclear-hearing',
    name: 'Public hearing on nuclear power',
    kind: 'campaign',
    description: 'An open hearing about the safety of a radioisotope power source. Lifts a public hold on that research.',
    costM: 6, months: 2,
    startTrust: [],
    effects: [trust('public', 5), techAccess('thermoelectric', 'enable', 'Public hold on nuclear power research lifted')],
    result: 'The hearing is long and calm. The hold on nuclear power research is lifted.',
  },

  // --------------------------------------------------------- campaigns
  {
    id: 'press-campaign',
    name: '"Mars Works" press campaign',
    kind: 'campaign',
    description: "Take the case for Mars through interviews, explainers and opinion pages. Answer the spending objections and build public support for the mission.",
    costM: 10, months: 1,
    startTrust: [],
    effects: [trust('public', 10), odds('protest', 0.5, 4)],
    result: "“Mars Works” gives supporters material to quote beyond the launch date. Public trust rises and protest turnout falls.",
  },
  {
    id: 'sponsorship-drive',
    name: 'Corporate sponsorship drive',
    kind: 'campaign',
    description: "Sell space for sponsor logos on the launch fairing. The mission gains funding and industry goodwill; some of the public will dislike the arrangement.",
    costM: 5, months: 2,
    startTrust: [{ stakeholder: 'public', delta: -5 }],
    requires: { stakeholder: 'industry', min: 45 },
    effects: [budget(40), trust('industry', 5)],
    result: "Sponsors contribute 40 M. The fairing carries a sports-drink advertisement beside the mission markings.",
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
    description: "Negotiate a temporary price agreement across the Mars supply chain. Feld and his competitors must leave willing to sign it.",
    costM: 5, months: 1,
    startTrust: [],
    effects: [trust('industry', 5), price(-10, 4)],
    result: "Procurement gets quotes 10% lower for four months. Feld calls the agreement an investment in the relationship and asks who will announce it.",
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
        stats: { outputKW: 0.5 }, massT: 0.27,
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
        stats: { thrustKN: 0.25, isp: 3000 }, massT: 0.05,
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
    description: "Secure relay-window time on Meridian’s 70 m dish for the lander. The agreement helps the mission but draws complaints from senators who want domestic support.",
    costM: 10, months: 3,
    startTrust: [{ stakeholder: 'government', delta: -5 }],
    requires: { stakeholder: 'partners', min: 50 },
    // Was also a 'groundStation' service promising the planner a smaller antenna; no
    // station reads it (R1115m-r01-08). What it really does: the in-flight "Busy week on
    // the dishes" goes well (data/mars/inFlight.ts).
    effects: [trust('partners', 5), setFlag(FLAG_GROUND_STATION)],
    result: "Meridian's 70 m dish is booked for the lander's relay windows.",
    partnerCharacterId: 'moreau',
  },
];
