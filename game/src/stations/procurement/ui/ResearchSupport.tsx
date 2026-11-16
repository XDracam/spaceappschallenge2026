// Research supplies and teams under D-032; requested work leads, optional supplies stay in a disclosure.
import { useGame } from '../../../core/store';
import { budgetAvailableM } from '../../../core/state';
import {
  FACILITIES, KIND_LABEL, MAX_HIRED_TEAMS, RENT_MONTHS, TEAM_OFFERS, activeTeams, facilityActive, facilityComing, facilityCoveredUntil, hiredTeams,
  type Facility,
} from '../../../core/facilities';
import { TECH_BY_ID } from '../../science/data/techs';
import { INITIAL_SLOTS } from '../../science/slice';
import { procurementActions } from '../logic';
import { fmtDate, fmtM } from '../rules';
import { quoteSupport, type SupportPurchase } from '../support';
import { FacilityArt } from '../../../shell/FacilityArt';
import { setUi, submitAction, useUi } from './uiState';

function useRes() {
  const research = useGame(s => s.research);
  const budget = useGame(s => s.budget);
  const day = useGame(s => s.clock.day);
  const phase = useGame(s => s.meta.phase);
  return { research, budget, clock: { day }, meta: { phase } };
}
type ResearchView = ReturnType<typeof useRes>;

function Status({ f, now }: { f: Facility; now: ResearchView }) {
  const day = now.clock.day;
  const until = facilityCoveredUntil(now.research, f.id, day);
  if (facilityActive(now.research, f.id, day)) {
    return <span class="pr-rs-ok">In use{until !== undefined && Number.isFinite(until) ? ` until ${fmtDate(until)}` : ' · owned'}</span>;
  }
  const from = facilityComing(now.research, f.id, day);
  if (from !== undefined) return <span class="pr-rs-soon">Ready {fmtDate(from)}</span>;
  return <span class="muted">Not held</span>;
}

function PurchaseButton({ purchase, label, now }: { purchase: SupportPurchase; label: string; now: ResearchView }) {
  const q = quoteSupport(now, purchase);
  const pending = useUi(u => u.pending);
  const id = `pr-supply-${purchase.type === 'team' ? purchase.offerId : `${purchase.facilityId}-${purchase.months}`}`;
  const reason = pending ? 'Waiting for host confirmation.' : q.blocked;
  return <span class="pr-rs-choice">
    <button type="button" class="pr-btn small" disabled={!!reason} aria-describedby={reason ? id : undefined}
      onClick={() => setUi({ dialog: purchase })}>{label}</button>
    {reason ? <span id={id} class="pr-note warn">{reason}</span> : null}
  </span>;
}

/** Protected focus for spending the shared budget; the host rechecks availability before applying. */
export function ResearchReview({ purchase, close }: { purchase: SupportPurchase; close: () => void }) {
  const now = useRes();
  const q = quoteSupport(now, purchase);
  const pending = useUi(u => u.pending);
  return <>
    <h2 id="pr-dialog-title">{purchase.type === 'team' ? 'Hire' : purchase.months === 'buy' ? 'Buy' : 'Rent'} {q.name}</h2>
    <dl class="pr-facts">
      <dt>Paid now</dt><dd>{fmtM(q.costM)}</dd>
      <dt>Ready</dt><dd>{fmtDate(q.from)}</dd>
      <dt>Coverage</dt><dd>{q.until === undefined ? 'Permanent' : `Until ${fmtDate(q.until)}`}</dd>
      <dt>Budget after</dt><dd>{fmtM(budgetAvailableM(now.budget) - q.costM)} available to all stations</dd>
    </dl>
    {purchase.type === 'facility' && purchase.months !== 'buy' ? <p class="pr-note muted">An existing rental is extended from its end date. Coverage starts on the date above.</p> : null}
    {q.blocked ? <p id="pr-supply-block" class="pr-callout bad" role="alert">{q.blocked}</p> : null}
    <div class="pr-row end">
      <button type="button" class="pr-btn" onClick={close}>Back</button>
      <button type="button" class="pr-btn primary" disabled={!!q.blocked || pending} aria-describedby={q.blocked ? 'pr-supply-block' : undefined}
        onClick={() => submitAction(() => purchase.type === 'team' ? procurementActions.hireTeam(purchase.offerId) : procurementActions.leaseFacility(purchase.facilityId, purchase.months))}>
        Confirm · {fmtM(q.costM)}
      </button>
    </div>
  </>;
}

function Teams({ now }: { now: ResearchView }) {
  const hired = hiredTeams(now.research, now.clock.day);
  return <section>
    <h3>Research teams <span class="muted small">{INITIAL_SLOTS} agency teams · {hired.length} of {MAX_HIRED_TEAMS} hired · {INITIAL_SLOTS + activeTeams(now.research, now.clock.day).length} ready</span></h3>
    {hired.length ? <ul class="pr-rs-asks">{hired.map(t => <li key={t.id}>
      {TEAM_OFFERS.find(o => o.id === t.offerId)?.label ?? 'Research team'}
      <span class="muted"> · {t.from > now.clock.day ? `starts ${fmtDate(t.from)}` : 'ready'}{t.until === undefined ? ' · permanent' : ` · until ${fmtDate(t.until)}`}</span>
    </li>)}</ul> : null}
    <div class="pr-grid pr-rs-grid">{TEAM_OFFERS.map(o => <div class="pr-card" key={o.id}>
      <span class="pr-card-art"><FacilityArt id={o.id} /><span class="pr-card-kind">Research team</span></span>
      <div class="pr-card-body"><h3>{o.label}</h3><p class="pr-card-stats">{o.blurb}</p>
        <p class="pr-card-match">Ready {o.leadDays} days after hiring</p>
        <div class="pr-card-bottom"><span class="pr-card-price">{fmtM(o.feeM)}</span>
          <PurchaseButton now={now} purchase={{ type: 'team', offerId: o.id }} label="Review hire" /></div>
      </div>
    </div>)}</div>
  </section>;
}

function Facilities({ now, facilities, requested = false }: { now: ResearchView; facilities: Facility[]; requested?: boolean }) {
  return <div class="pr-grid pr-rs-grid">{facilities.map(f => {
    const requests = (now.research.supplyRequests ?? []).filter(q => q.status === 'open' && q.kind === 'facility' && q.facilityId === f.id);
    const techs = [...new Set(requests.flatMap(q => q.techIds ?? []).map(t => TECH_BY_ID[t]?.name).filter(Boolean))];
    return <div class={`pr-card${requested ? ' related' : ''}`} key={f.id}>
      <span class="pr-card-art"><FacilityArt id={f.id} /><span class="pr-card-kind">{KIND_LABEL[f.kind]}</span>
        {requested ? <span class="pr-card-lock">Science requested</span> : null}</span>
      <div class="pr-card-body"><h3>{f.name}</h3>
        {techs.length ? <p class="pr-note good">For {techs.join(', ')}</p> : null}
        <p class="pr-card-stats">{f.blurb}</p>
        <p class="pr-card-match"><Status f={f} now={now} /></p>
        <p class="pr-card-eta">Rent ready after {f.leadDays} days{f.buyM !== undefined ? ` · buy after ${f.leadDays * 2} days` : ' · rent only'}</p>
        <div class="pr-rs-actions">{RENT_MONTHS.map(months => <PurchaseButton key={months} now={now}
          purchase={{ type: 'facility', facilityId: f.id, months }} label={`${months} mo · ${fmtM(f.rentPerMonthM * months)}`} />)}
          {f.buyM !== undefined ? <PurchaseButton now={now} purchase={{ type: 'facility', facilityId: f.id, months: 'buy' }} label={`Buy · ${fmtM(f.buyM)}`} /> : null}
        </div>
      </div>
    </div>;
  })}</div>;
}

export function ResearchSupport() {
  const now = useRes();
  const open = (now.research.supplyRequests ?? []).filter(q => q.status === 'open');
  const teamRequested = open.some(q => q.kind === 'team');
  const wanted = new Set(open.filter(q => q.kind === 'facility').map(q => q.facilityId));
  const requested = FACILITIES.filter(f => wanted.has(f.id));
  const other = FACILITIES.filter(f => !wanted.has(f.id));
  return <main class="pr-panel pr-overlay pr-rs" aria-label="Research needs">
    <div class="pr-overlay-head"><h2>Research needs</h2><span class="muted small">{fmtM(budgetAvailableM(now.budget))} shared budget available</span></div>
    <div class="pr-rs-body">
      <section class="pr-rs-requested" aria-label="Open Science requests">
        <h3>Science requests · {open.length} open</h3>
        {!open.length ? <p class="muted">No open requests. Science can request facilities or another research team when needed.</p> : null}
        {requested.length ? <Facilities now={now} facilities={requested} requested /> : null}
        {teamRequested ? <Teams now={now} /> : null}
      </section>
      <details class="pr-rs-other"><summary>Other facilities and teams</summary>
        {!teamRequested ? <Teams now={now} /> : null}
        {other.length ? <section><h3>Facilities · not requested</h3><Facilities now={now} facilities={other} /></section> : null}
      </details>
    </div>
  </main>;
}
