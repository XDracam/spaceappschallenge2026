// Weather satellite — proactive projects (2 slots). Smaller and shorter than
// Mars: the budget is about 350 M and launch is about six months away. Costs
// come from the shared budget; some cost trust at start (startTrust). Bigger
// deals need trust (`requires`). Negotiated parts arrive as offers to procurement.
//
// Left out for this mission (R1115d-r01-12, four rounds): the plutonium, laser and
// ion licences and the nuclear hearing (they open techs the weather satellite never
// needs; the one licence bought, in 1115m-r01, was money spent on nothing) and the
// coastal caucus lobbying (never started; its 'funding' odds also made the Treasury
// claw-back likelier). The Mars set keeps its licences.
import type { ProjectDef } from '../../model/types';
import { FLAG_GROUND_STATION, budget, limit, odds, offer, pace, setFlag, trust } from '../helpers';

export const PROJECTS: ProjectDef[] = [
  // ------------------------------------------------------------- galas
  {
    id: 'wx-storm-night-gala',
    name: 'Storm Night gala',
    kind: 'gala',
    description: 'An evening at the science museum for legislators and suppliers, with a hurricane simulator and a satellite mock-up.',
    costM: 5, months: 1,
    startTrust: [],
    effects: [trust('government', 10), trust('industry', 5)],
    result: 'Storm Night: two senators tried the hurricane simulator and lost their notes. Suppliers networked aggressively.',
  },
  {
    id: 'wx-school-weather-stations',
    name: 'Weather stations for schools',
    kind: 'gala',
    description: 'Put small weather stations on school roofs, with Northgate students as mentors. Their readings check the satellite later.',
    costM: 4, months: 2,
    startTrust: [],
    effects: [trust('public', 10), trust('partners', 5)],
    result: 'Two hundred school roofs now report wind and rain. Children argue about forecasts at dinner.',
    partnerCharacterId: 'salo',
  },

  // --------------------------------------------------------- campaigns
  {
    id: 'wx-know-before-the-storm',
    name: '"Know Before the Storm" campaign',
    kind: 'campaign',
    description: 'A month of TV spots and explainers on what the new satellite will see. Raises public trust and calms protests.',
    costM: 4, months: 1,
    startTrust: [],
    effects: [trust('public', 10), odds('protest', 0.5, 3)],
    result: '"Know Before the Storm" wraps up: TV meteorologists now mention the satellite unprompted.',
  },
  {
    id: 'wx-insurer-sponsorship',
    name: 'Insurance sponsorship',
    kind: 'campaign',
    description: "Insurers love good hurricane forecasts. Their logo on the fairing, their money in the shared budget. Purists will grumble.",
    costM: 2, months: 2,
    startTrust: [{ stakeholder: 'public', delta: -5 }],
    requires: { stakeholder: 'industry', min: 45 },
    effects: [budget(20), trust('industry', 5)],
    result: 'Sponsorship closes: 20 M raised. The fairing now reminds everyone to check their flood cover.',
  },

  // ------------------------------------------------------- negotiations
  {
    id: 'wx-meridian-ground-station',
    name: "Meridian's ground station",
    kind: 'negotiation',
    description: "Book Meridian's dish for the satellite's first passes after launch. Some senators prefer domestic dishes.",
    costM: 4, months: 2,
    startTrust: [{ stakeholder: 'government', delta: -5 }],
    requires: { stakeholder: 'partners', min: 50 },
    // Was also a 'groundStation' service promising the planner a smaller antenna; no
    // station reads it (R1115m-r01-08). What it really does: the in-flight "First image
    // downlink" goes well (data/weather/inFlight.ts).
    effects: [trust('partners', 5), setFlag(FLAG_GROUND_STATION)],
    result: "Meridian's dish is booked for the first passes: the first image will be caught on the first try.",
    partnerCharacterId: 'moreau',
  },
  {
    id: 'wx-feldwerk-upper-stage',
    name: 'Upper-stage deal with Feldwerk',
    kind: 'negotiation',
    description: 'Feldwerk has an upper-stage engine left over from a cancelled order. Negotiate it for procurement at a discount.',
    costM: 2, months: 1,
    startTrust: [],
    requires: { stakeholder: 'industry', min: 50 },
    effects: [
      trust('industry', 5),
      offer({
        partKind: 'engine', variant: 'hydrolox', supplier: 'Feldwerk Launch Systems',
        priceM: 6, deliveryMonths: 2, reliability: 0.97,
        note: 'Upper-stage hydrogen engine from a cancelled order, at a discount.',
        stats: { thrustKN: 110, isp: 445 }, massT: 0.3,
      }),
    ],
    result: "Feldwerk's spare upper-stage engine is now a discounted offer in procurement's list.",
    partnerCharacterId: 'feld',
  },
  {
    id: 'wx-northgate-imager-research',
    name: 'Northgate imager research',
    kind: 'negotiation',
    description: "Fund Northgate's optics lab to share its detector work. The camera the design needs can then be bought without waiting for Science's research.",
    costM: 5, months: 2,
    startTrust: [],
    requires: { stakeholder: 'partners', min: 55 },
    effects: [trust('partners', 5), limit('instrument.camera.performance', 7)],
    result: 'Northgate shares its detector results: cameras can now reach performance 7.',
    partnerCharacterId: 'salo',
  },
  {
    // Comms' lever on reliability: Science's part tests halve a part's risk of failure
    // and follow the research pace (science/model/tests.ts).
    id: 'wx-northgate-test-crew',
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
