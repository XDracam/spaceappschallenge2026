// Hand-authored suppliers (D-005). Fictional companies with distinct trade-offs.
// Numbers are balancing placeholders: priceFactor scales the planner's estimated
// cost, leadDeltaMonths shifts the kind's base lead time, reliabilityDelta shifts
// the kind's typical reliability, cancellationPct is the share of the price the
// supplier keeps if the agency cancels at signing (see rules.ts refundM).

export interface Supplier {
  id: string;
  name: string;
  /** Short trait shown on cards ("Cheap · slow"). */
  trait: string;
  blurb: string;
  priceFactor: number;
  leadDeltaMonths: number;
  reliabilityDelta: number;
  cancellationPct: number;
  /** Bids on Calls (tenders). */
  tenders: boolean;
}

export const SUPPLIERS: Supplier[] = [
  {
    id: 'brightline', name: 'Brightline Aerospace', trait: 'Cheap · slow',
    blurb: 'High-volume builder with long queues. Lowest prices, long lead times, strict cancellation terms.',
    priceFactor: 0.78, leadDeltaMonths: 4, reliabilityDelta: -0.02, cancellationPct: 0.6, tenders: true,
  },
  {
    id: 'helix', name: 'Helix Precision Works', trait: 'Reliable · expensive',
    blurb: 'Flight-proven hardware with exhaustive qualification testing. You pay for the paperwork.',
    priceFactor: 1.38, leadDeltaMonths: 1, reliabilityDelta: 0.015, cancellationPct: 0.4, tenders: true,
  },
  {
    id: 'swift', name: 'Swiftworks Orbital', trait: 'Fast',
    blurb: 'Keeps parts in stock and ships quickly. A premium for speed, slightly less margin on reliability.',
    priceFactor: 1.18, leadDeltaMonths: -2, reliabilityDelta: -0.005, cancellationPct: 0.5, tenders: true,
  },
  {
    id: 'commons', name: 'Orbital Commons Co-op', trait: 'Balanced',
    blurb: 'A cooperative of small workshops. Fair prices, ordinary schedules, ordinary risks.',
    priceFactor: 1.0, leadDeltaMonths: 0, reliabilityDelta: 0, cancellationPct: 0.5, tenders: false,
  },
  {
    id: 'tallis', name: 'Tallis Heavy Industries', trait: 'Propulsion specialist',
    blurb: 'Big engines and big tanks at volume prices. Inflexible: cancellation is expensive.',
    priceFactor: 0.88, leadDeltaMonths: 2, reliabilityDelta: 0.005, cancellationPct: 0.7, tenders: true,
  },
  {
    id: 'meridian', name: 'Meridian Instruments', trait: 'Flexible terms',
    blurb: 'Instruments, power and communications hardware. Generous cancellation terms.',
    priceFactor: 1.08, leadDeltaMonths: 0, reliabilityDelta: 0.01, cancellationPct: 0.3, tenders: true,
  },
  {
    id: 'nova', name: 'Nova Frontier Labs', trait: 'Experimental',
    blurb: 'Builds what nobody else can yet — beyond current research, at a price and with less certainty.',
    priceFactor: 1.6, leadDeltaMonths: 3, reliabilityDelta: -0.05, cancellationPct: 0.5, tenders: true,
  },
];

export const SUPPLIER_BY_ID: Record<string, Supplier> = Object.fromEntries(SUPPLIERS.map((s) => [s.id, s]));
