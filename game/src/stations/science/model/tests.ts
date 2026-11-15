// Part tests (playtest 1115d-r01, finding 01: no station could change the launch odds). A lab team
// tests a delivered part of the Planner's design; when the test ends, the part's risk of failure is
// halved (Contract.tested). A test is a ResearchProject with a partId: it uses a research team, runs
// on the shared calendar and follows comms' research pace like any other project. It only counts if it
// ends before the launch. Pure rules shared by the reducer (logic.ts) and the UI; no randomness.
import { contractReliability, type Contract } from '../../../core/model';
import type { GameState } from '../../../core/state';
import { DAYS_PER_MONTH, budgetAvailableM } from '../../../core/state';
import { MISSION } from '../../../core/mission';
import { partReliability } from '../../planner/data/parts';
import { actualPart, partProcurement } from '../../planner/derive';
import { allParts, partPlaceName } from '../../planner/model/rocketUtils';
import { formatDate, running, sci } from './research';

/** Length of a test in tree months; scaled per mission like research (1 month in the weather mission). */
const TEST_MONTHS = 2;
/** A test costs this share of the part's contract price, and at least TEST_MIN_M. */
const TEST_PRICE_SHARE = 0.2;
const TEST_MIN_M = 1;

export function testDays(): number {
  return TEST_MONTHS * (MISSION.researchTimeFactor ?? 1) * DAYS_PER_MONTH;
}

/**
 * Does a test that ends on this day still count? The calendar steps in whole days and the launch
 * happens first on its day (science/logic.ts tick), so the test must end on an earlier day.
 */
export function testCounts(endsAt: number, launchDay: number): boolean {
  return Math.ceil(endsAt) < launchDay;
}

/** "1 mo" / "2 mo", as the research buttons write durations. */
export function testDurationText(): string {
  return `${Math.round(TEST_MONTHS * (MISSION.researchTimeFactor ?? 1) * 10) / 10} mo`;
}

/**
 * Where a part of the design stands for testing: 'open' = not under contract, 'arriving' = contracted,
 * 'ready' = delivered and untested, 'testing' = a team is on it, 'tested' = done.
 */
export type PartTestState = 'open' | 'arriving' | 'ready' | 'testing' | 'tested';

export interface PartTest {
  partId: string;
  /** "Booster engine": the name every station uses for the part. */
  name: string;
  /** The contracted hardware ("Taiga KL-2000"), as Procurement lists it; '' before a contract. */
  product: string;
  state: PartTestState;
  /** Reliability as it would fly today (all engines of a stage together). */
  reliability: number;
  /** Reliability after a test. */
  after: number;
  /** Delivery day while arriving. */
  arrivesAt?: number;
  /** End of the running test. */
  endsAt?: number;
  costM: number;
}

/** Live contracts supplying a design part (the ones a test marks as tested). */
export function testContracts(s: GameState, partId: string): Contract[] {
  return (partProcurement(s, partId).lots ?? []).map((l) => l.contract);
}

/** Every part of the Planner's design with its test state. */
export function partTests(s: GameState): PartTest[] {
  const testing = new Map(running(s.research).filter((p) => p.partId).map((p) => [p.partId!, p.endsAt]));
  return allParts(s.planner.rocket).map((loc) => {
    const proc = partProcurement(s, loc.part.id);
    const count = loc.role === 'engine' && loc.stage ? loc.stage.engineCount : 1;
    const lots = proc.lots ?? [];
    const contracted = proc.status === 'contracted' || proc.status === 'late' || proc.status === 'delivered';
    const unit = partReliability(actualPart(s, loc.part, proc));
    // After a test every lot is tested: the same mean over the lots that actualPart uses.
    const units = lots.reduce((n, l) => n + l.quantity, 0) || 1;
    const unitAfter = contracted && lots.length
      ? Math.exp(lots.reduce((sum, l) => sum + l.quantity * Math.log(Math.max(1e-9, contractReliability({ ...l.contract, tested: true }))), 0) / units)
      : unit;
    const endsAt = testing.get(loc.part.id);
    const state: PartTestState = !contracted ? 'open'
      : proc.status !== 'delivered' ? 'arriving'
      : lots.every((l) => l.contract.tested) ? 'tested'
      : endsAt !== undefined ? 'testing' : 'ready';
    const price = lots.reduce((sum, l) => sum + l.contract.offerSnapshot.priceM, 0);
    return {
      partId: loc.part.id,
      name: partPlaceName(loc) + (count > 1 ? ` ×${count}` : ''),
      product: contracted ? lots[0]?.contract.offerSnapshot.resource.name ?? '' : '',
      state,
      reliability: Math.pow(unit, count),
      after: Math.pow(unitAfter, count),
      ...(state === 'arriving' ? { arrivesAt: Math.max(...lots.filter((l) => l.contract.status === 'active').map((l) => l.contract.expectedAt)) } : {}),
      ...(endsAt !== undefined ? { endsAt } : {}),
      costM: Math.max(TEST_MIN_M, Math.round(price * TEST_PRICE_SHARE * 10) / 10),
    };
  });
}

export interface TestCheck { ok: boolean; reason: string | null }

/** Everything that can stop a test starting now. Used by the reducer and the panel. */
export function testCheck(s: GameState, partId: string): TestCheck {
  const no = (reason: string): TestCheck => ({ ok: false, reason });
  if (s.meta.phase !== 'planning') return no(s.meta.phase === 'lobby' ? 'The game has not started.' : 'The mission has launched.');
  const t = partTests(s).find((x) => x.partId === partId);
  if (!t) return no('Not in the design.');
  if (t.state === 'open') return no('Not under contract yet.');
  if (t.state === 'arriving') return no(`Arrives ${formatDate(t.arrivesAt ?? 0)}.`);
  if (t.state === 'testing') return no('A team is already testing it.');
  if (t.state === 'tested') return no('Already tested.');
  if (running(s.research).length >= sci(s).slots) return no(`All ${sci(s).slots} research teams are busy.`);
  if (t.costM > budgetAvailableM(s.budget) + 1e-9) return no('Not enough budget available.');
  return { ok: true, reason: null };
}
