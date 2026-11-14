// Hand-authored Call (tender) responses per part kind (D-005). When a Call closes,
// each template becomes one Offer built to the Task criterion's minimums (scaled by
// statFactor). Two tables: criteria within current research get ordinary custom
// builds; criteria beyond research (or locked variants) get costly, less reliable
// experimental builds (1.5–3× the planner's estimate). ctx.rng adds ±8 % price and
// ±1 month lead-time variation. Placeholders for balancing.
import type { PartKind } from '../../../core/model';

export interface CallTemplate {
  supplierId: string;
  /** Multiplies size stats (thrust, fuel, output …) relative to the minimums. */
  statFactor: number;
  /** Multiplies the planner's estimated cost of the built part. */
  priceFactor: number;
  /** Added to the kind's base lead time (months). */
  leadDeltaMonths: number;
  reliabilityDelta: number;
  /** Supplier's pitch shown with the Offer. */
  note: string;
}

const WITHIN_DEFAULT: CallTemplate[] = [
  { supplierId: 'helix', statFactor: 1.08, priceFactor: 1.3, leadDeltaMonths: 1, reliabilityDelta: 0.012, note: 'Qualified to spec with margin.' },
  { supplierId: 'brightline', statFactor: 1.0, priceFactor: 0.92, leadDeltaMonths: 3, reliabilityDelta: -0.015, note: 'Built exactly to the minimums, in our next production slot.' },
  { supplierId: 'swift', statFactor: 1.0, priceFactor: 1.22, leadDeltaMonths: -1, reliabilityDelta: -0.005, note: 'Adapted from stock — ships fast.' },
];

const BEYOND_DEFAULT: CallTemplate[] = [
  { supplierId: 'nova', statFactor: 1.0, priceFactor: 2.1, leadDeltaMonths: 3, reliabilityDelta: -0.06, note: 'Experimental build beyond domestic research.' },
  { supplierId: 'helix', statFactor: 1.05, priceFactor: 2.9, leadDeltaMonths: 2, reliabilityDelta: -0.025, note: 'One-off qualification programme. Expensive, but we test everything.' },
  { supplierId: 'brightline', statFactor: 1.0, priceFactor: 1.6, leadDeltaMonths: 5, reliabilityDelta: -0.09, note: 'Licence-built from a foreign design. Cheap for what it is; slow and risky.' },
];

/** Per-kind overrides; kinds without an entry use the defaults. */
export const CALL_TEMPLATES: Partial<Record<PartKind, { within: CallTemplate[]; beyond: CallTemplate[] }>> = {
  engine: {
    within: [
      { supplierId: 'tallis', statFactor: 1.05, priceFactor: 0.95, leadDeltaMonths: 2, reliabilityDelta: 0.005, note: 'Derived from our production engine line.' },
      ...WITHIN_DEFAULT,
    ],
    beyond: BEYOND_DEFAULT,
  },
  tank: {
    within: [
      { supplierId: 'tallis', statFactor: 1.1, priceFactor: 0.9, leadDeltaMonths: 1, reliabilityDelta: 0, note: 'Stretched from a standard tank barrel.' },
      { supplierId: 'swift', statFactor: 1.0, priceFactor: 1.2, leadDeltaMonths: -1, reliabilityDelta: -0.005, note: 'Ships quickly from stock domes.' },
    ],
    beyond: [
      { supplierId: 'nova', statFactor: 1.0, priceFactor: 2.0, leadDeltaMonths: 2, reliabilityDelta: -0.04, note: 'Composite pressure vessel, first of its kind here.' },
      { supplierId: 'helix', statFactor: 1.1, priceFactor: 2.6, leadDeltaMonths: 1, reliabilityDelta: -0.02, note: 'Flight-qualified one-off.' },
    ],
  },
  instrument: {
    within: [
      { supplierId: 'meridian', statFactor: 1.05, priceFactor: 1.1, leadDeltaMonths: 0, reliabilityDelta: 0.005, note: 'Tailored to the science team’s requirements.' },
      { supplierId: 'helix', statFactor: 1.15, priceFactor: 1.35, leadDeltaMonths: 1, reliabilityDelta: 0.01, note: 'Exceeds the requirement with a flight-proven detector.' },
    ],
    beyond: [
      { supplierId: 'nova', statFactor: 1.0, priceFactor: 2.4, leadDeltaMonths: 3, reliabilityDelta: -0.07, note: 'Prototype detector, untested in flight.' },
      { supplierId: 'meridian', statFactor: 1.0, priceFactor: 1.8, leadDeltaMonths: 4, reliabilityDelta: -0.05, note: 'Joint development with a partner university.' },
      { supplierId: 'helix', statFactor: 1.1, priceFactor: 3.0, leadDeltaMonths: 2, reliabilityDelta: -0.03, note: 'Full qualification campaign included.' },
    ],
  },
  power: {
    within: [
      { supplierId: 'meridian', statFactor: 1.1, priceFactor: 1.05, leadDeltaMonths: 0, reliabilityDelta: 0.005, note: 'Standard cells, custom layout.' },
      { supplierId: 'brightline', statFactor: 1.0, priceFactor: 0.9, leadDeltaMonths: 3, reliabilityDelta: -0.02, note: 'Cheapest cells on the market.' },
    ],
    beyond: [
      { supplierId: 'nova', statFactor: 1.0, priceFactor: 2.5, leadDeltaMonths: 3, reliabilityDelta: -0.06, note: 'Experimental generator — paperwork pending.' },
      { supplierId: 'helix', statFactor: 1.05, priceFactor: 3.0, leadDeltaMonths: 3, reliabilityDelta: -0.03, note: 'Foreign-sourced core with domestic integration.' },
    ],
  },
};

export function callTemplates(kind: PartKind, beyond: boolean): CallTemplate[] {
  const t = CALL_TEMPLATES[kind];
  if (beyond) return t?.beyond ?? BEYOND_DEFAULT;
  return t?.within ?? WITHIN_DEFAULT;
}

/** Calls stay open this many days before suppliers answer (~1 month). */
export const CALL_DURATION_DAYS = 30;
/** Call Offers can be signed for this many days after the Call closes. */
export const CALL_OFFER_VALID_DAYS = 90;
