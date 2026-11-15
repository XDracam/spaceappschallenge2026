// Research needs (D-032): what Science asks Procurement for, the facilities (labs, equipment, rented machine
// time) that higher-tier research needs, and research teams to hire. Spending is immediate from the shared budget.
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
import { FacilityArt } from '../../../shell/FacilityArt';

function Status({ f, now }: { f: Facility; now: ReturnType<typeof useRes> }) {
  const day = now.day;
  const until = facilityCoveredUntil(now.research, f.id, day);
  if (facilityActive(now.research, f.id, day)) {
    return <span class="pr-rs-ok">In use{until !== undefined && Number.isFinite(until) ? ` until ${fmtDate(until)}` : ' · owned'}</span>;
  }
  const from = facilityComing(now.research, f.id, day);
  if (from !== undefined) return <span class="pr-rs-soon">Ready {fmtDate(from)}</span>;
  return <span class="muted">Not held</span>;
}

function useRes() {
  const research = useGame((s) => s.research);
  const budget = useGame((s) => s.budget);
  const day = useGame((s) => s.clock.day);
  const planning = useGame((s) => s.meta.phase === 'planning');
  return { research, budget, day, planning, available: budgetAvailableM(budget) };
}

export function ResearchSupport() {
  const now = useRes();
  const { research, day, planning, available } = now;
  const open = (research.supplyRequests ?? []).filter((q) => q.status === 'open');
  const hired = hiredTeams(research, day);
  const owned = (id: string) => (research.facilities ?? []).some((l) => l.facilityId === id && l.until === undefined);
  return (
    <main class="pr-panel pr-overlay pr-rs" aria-label="Research needs">
      <div class="pr-overlay-head">
        <h2>Research needs</h2>
        <span class="muted small">Science needs labs, equipment and machine time for its higher techs, and teams to work in parallel · {fmtM(available)} available</span>
      </div>
      <div class="pr-rs-body">
        <section>
          <h3>Science asks</h3>
          {open.length === 0 ? <p class="muted">Nothing open. Science asks here when a tech needs a facility or when its teams are full.</p> : (
            <ul class="pr-rs-asks">
              {open.map((q) => q.kind === 'team'
                ? <li key={q.id}><b>Another research team</b><span class="muted"> · all teams are busy · hire one below</span></li>
                : <li key={q.id}><b>{FACILITIES.find((f) => f.id === q.facilityId)?.name}</b>
                  <span class="muted"> · for {(q.techIds ?? []).map((t) => TECH_BY_ID[t]?.name).filter(Boolean).join(', ')} · rent or buy below</span></li>)}
            </ul>
          )}
        </section>

        <section>
          <h3>Research teams <span class="muted small">own {INITIAL_SLOTS} · hired {hired.length} of {MAX_HIRED_TEAMS} · at work now {INITIAL_SLOTS + activeTeams(research, day).length}</span></h3>
          {hired.length > 0 ? (
            <ul class="pr-rs-asks">
              {hired.map((t) => (
                <li key={t.id}>{TEAM_OFFERS.find((o) => o.id === t.offerId)?.label}
                  <span class="muted"> · {t.from > day ? `starts ${fmtDate(t.from)}` : 'at work'}{t.until === undefined ? ' · permanent' : ` · until ${fmtDate(t.until)}`}</span></li>
              ))}
            </ul>
          ) : null}
          <div class="pr-grid pr-rs-grid">
            {TEAM_OFFERS.map((o) => {
              const blocked = !planning || hired.length >= MAX_HIRED_TEAMS || o.feeM > available + 1e-9;
              return (
                <div class="pr-card" key={o.id}>
                  <span class="pr-card-art"><FacilityArt id={o.id} /><span class="pr-card-kind">Research team</span></span>
                  <span class="pr-card-body">
                    <h3>{o.label}</h3>
                    <span class="pr-card-stats">{o.blurb}</span>
                    <span class="pr-card-match">At work {o.leadDays} days after hiring</span>
                    <span class="pr-card-bottom">
                      <span class="pr-card-price">{fmtM(o.feeM)}</span>
                      <button type="button" class="pr-btn" disabled={blocked}
                        title={hired.length >= MAX_HIRED_TEAMS ? 'The most teams are hired.' : o.feeM > available ? 'Not enough budget available.' : undefined}
                        onClick={() => procurementActions.hireTeam(o.id)}>Hire</button>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3>Facilities</h3>
          <div class="pr-grid pr-rs-grid">
            {FACILITIES.map((f) => {
              const wanted = open.some((q) => q.kind === 'facility' && q.facilityId === f.id);
              const lowest = Math.round(f.rentPerMonthM * RENT_MONTHS[0] * 100) / 100;
              return (
                <div class={`pr-card${wanted ? ' related' : ''}`} key={f.id}>
                  <span class="pr-card-art"><FacilityArt id={f.id} /><span class="pr-card-kind">{KIND_LABEL[f.kind]}</span>
                    {wanted ? <span class="pr-card-lock">Science asked</span> : null}</span>
                  <span class="pr-card-body">
                    <h3>{f.name}</h3>
                    <span class="pr-card-stats">{f.blurb}</span>
                    <span class="pr-card-match"><Status f={f} now={now} /></span>
                    <span class="pr-card-bottom">
                      <span class="pr-card-price">{fmtM(lowest)}<small> / {RENT_MONTHS[0]} mo</small></span>
                      <span class="pr-card-eta">Ready after {f.leadDays} days{f.buyM !== undefined ? <><br />Buy {fmtM(f.buyM)}</> : <><br />Rent only</>}</span>
                    </span>
                    <span class="pr-rs-actions">
                      {RENT_MONTHS.map((m) => {
                        const cost = Math.round(f.rentPerMonthM * m * 100) / 100;
                        return <button type="button" class="pr-btn small" key={m} disabled={!planning || owned(f.id) || cost > available + 1e-9}
                          title={`Rent for ${m} months. Ready ${f.leadDays} days after signing.`} onClick={() => procurementActions.leaseFacility(f.id, m)}>{m} mo · {fmtM(cost)}</button>;
                      })}
                      {f.buyM !== undefined ? (
                        <button type="button" class="pr-btn small" disabled={!planning || owned(f.id) || f.buyM > available + 1e-9}
                          title={`Buy it for good. Ready ${f.leadDays * 2} days after signing.`} onClick={() => procurementActions.leaseFacility(f.id, 'buy')}>Buy · {fmtM(f.buyM)}</button>
                      ) : null}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
