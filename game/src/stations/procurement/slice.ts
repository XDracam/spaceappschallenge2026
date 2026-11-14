// Procurement's part of the shared GameState. Owned by the procurement station.
// Tasks, offers, calls, contracts, allocations and the budget are shared (core/model.ts).

export interface ProcurementSlice {
  /** Placeholder for procurement-only shared state (e.g. supplier relations). */
  notes: string[];
  /** Contract ids already announced as arriving after launch (news once per contract). */
  lateWarned: string[];
}

export function initialProcurementSlice(): ProcurementSlice {
  return { notes: [], lateWarned: [] };
}
