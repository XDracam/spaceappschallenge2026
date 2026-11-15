import { useState } from 'preact/hooks';
import { contractTiming } from '../timing';
import { fmtDate, fmtM, quoteAmendment, taskCode } from '../rules';
import { setUi, useP, useUi } from './uiState';

export function marginText(margin: number | undefined): string {
  if (margin === undefined) return 'No need date';
  if (Math.abs(margin) < 1) return margin === 0 ? 'Same time' : margin > 0 ? 'Less than 1 day early' : 'Less than 1 day late';
  const days = Math.round(Math.abs(margin) * 10) / 10;
  return `${days} ${days === 1 ? 'day' : 'days'} ${margin > 0 ? 'early' : 'late'}`;
}
function shortMargin(margin: number | undefined): string {
  if (margin === undefined) return 'No date';
  if (margin === 0) return 'Same time';
  const d = Math.round(Math.abs(margin) * 10) / 10;
  return `${d < 1 ? '<1' : d}d ${margin < 0 ? 'late' : 'early'}`;
}

export function ContractTimeline() {
  const v = useP();
  const selected = useUi(u => u.contractId);
  const preview = useUi(u => u.amendmentPreview);
  const active = v.market.contracts.filter(k => k.status === 'active');
  const state = { market: v.market, research: { projects: v.research.projects ?? [] } };
  const rows = active.flatMap(k => contractTiming(state, k).needs.map(need => ({ k, need })));
  const fit = () => {
    const dates = rows.flatMap(({ k, need }) => [k.expectedAt, ...(need.neededAt === undefined ? [] : [need.neededAt])]);
    if (preview && preview.contractId === selected) {
      const quote = quoteAmendment(v, preview.contractId, preview.delivery);
      if (!quote.unavailable) dates.push(quote.expectedAt);
    }
    const start = Math.floor(Math.min(v.clock.day, ...dates) / 7) * 7;
    const end = Math.max(v.clock.day + 30, ...dates);
    return { start, span: Math.max(35, Math.ceil((end - start + 14) / 7) * 7) };
  };
  const [range, setRange] = useState(fit);
  const pos = (day: number) => (day - range.start) / range.span * 100;
  const within = (day: number) => day >= range.start && day <= range.start + range.span;
  const ticks = Array.from({ length: 5 }, (_, i) => range.start + range.span * i / 4);
  return <div class="pr-timeline pr-timeline-redesign">
    <div class="pr-timeline-toolbar"><div class="pr-timeline-key"><span><i class="pr-key-arrival" /> Arrival</span><span><i class="pr-key-need" /> Needed</span><span><i class="pr-key-preview" /> Proposed</span><span><i class="pr-key-buffer" /> Early: time before need</span><span><i class="pr-key-late" /> Late: time past need</span></div><button type="button" class="pr-btn small" onClick={() => setRange(fit())}>Fit dates</button></div>
    {rows.length ? <div class="pr-timeline-scroll">
      <div class="pr-timeline-axis"><span>Incoming</span><div class="pr-axis-scale">{ticks.map((day, i) => <span key={i} style={{ left: `${i * 25}%`, transform: i === 0 ? 'none' : i === 4 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{fmtDate(day).replace(/ \d{4}$/, '')}</span>)}{within(v.clock.day) ? <span class="pr-axis-reference" style={{ left: `${pos(v.clock.day)}%` }}>Today</span> : null}{within(v.planner.plan.launchDay) ? <span class="pr-axis-reference launch" style={{ left: `${pos(v.planner.plan.launchDay)}%` }}>Launch</span> : null}</div><span>Margin</span></div>
      {rows.map(({ k, need }) => {
        const arrival = k.expectedAt;
        const isSelected = selected === k.id;
        const q = isSelected && preview?.contractId === k.id ? quoteAmendment(v, k.id, preview.delivery) : undefined;
        const proposal = q && !q.unavailable ? q.expectedAt : undefined;
        const allocation = v.market.allocations.find(a => a.id === need.id);
        const task = v.market.tasks.find(t => t.id === allocation?.taskId);
        const recipient = allocation?.department ? allocation.department[0].toUpperCase() + allocation.department.slice(1) : task ? taskCode(task) : allocation?.taskId ? 'Task' : 'Shared';
        const gapStyle = (a: number, b: number) => ({ left: `${Math.max(0, Math.min(100, pos(Math.min(a, b))))}%`, width: `${Math.max(0, Math.min(100, pos(Math.max(a, b))) - Math.max(0, pos(Math.min(a, b))))}%` });
        return <button type="button" key={`${k.id}-${need.id}`} class={`pr-timeline-row${isSelected ? ' selected' : ''}`} aria-pressed={isSelected} aria-label={`${k.offerSnapshot.resource.name}, ${need.quantity}, ${recipient}${need.source === 'research-bonus' ? ', research bonus' : ''}, arrival ${fmtDate(arrival)}, ${need.neededAt === undefined ? 'no need date' : `${need.source === 'requested' ? 'order requested' : need.source === 'research-bonus' ? 'bonus by' : 'needed'} ${fmtDate(need.neededAt)}, ${marginText(need.margin)}`}${proposal !== undefined ? `, proposed ${fmtDate(proposal)}, ${marginText(need.neededAt === undefined ? undefined : need.neededAt - proposal)}, fee ${fmtM(q!.feeM)}` : ''}`} onClick={() => setUi({ contractId: k.id, amendmentPreview: preview?.contractId === k.id ? preview : null })}>
          <span class="pr-timeline-label"><strong>{k.offerSnapshot.resource.name} ×{need.quantity}</strong><span>{recipient}{need.source === 'research-bonus' ? ' · Research bonus' : need.source === 'requested' ? ' · Order request' : ''}</span></span>
          <span class="pr-timeline-track" aria-hidden="true">
            {within(v.clock.day) ? <i class="pr-time-reference today" style={{ left: `${pos(v.clock.day)}%` }} /> : null}
            {within(v.planner.plan.launchDay) ? <i class="pr-time-reference launch" style={{ left: `${pos(v.planner.plan.launchDay)}%` }} /> : null}
            {need.neededAt !== undefined ? <i class={`pr-margin-line${need.margin !== undefined && need.margin < 0 ? ' late' : ''}`} style={gapStyle(arrival, need.neededAt)} /> : null}
            {proposal !== undefined && need.neededAt !== undefined ? <i class="pr-proposal-line" style={gapStyle(proposal, need.neededAt)} /> : null}
            {within(arrival) ? <i class="pr-time-arrival" style={{ left: `${pos(arrival)}%` }} /> : <b class="pr-time-edge" style={{ left: arrival < range.start ? '0%' : '100%' }}>{arrival < range.start ? '‹' : '›'}</b>}
            {need.neededAt !== undefined ? within(need.neededAt) ? <i class="pr-time-need" style={{ left: `${pos(need.neededAt)}%` }} /> : <b class="pr-time-edge need" style={{ left: need.neededAt < range.start ? '0%' : '100%' }}>{need.neededAt < range.start ? '‹' : '›'}</b> : null}
            {proposal !== undefined ? within(proposal) ? <i class="pr-time-proposal" style={{ left: `${pos(proposal)}%` }} /> : <b class="pr-time-edge proposal" style={{ left: proposal < range.start ? '0%' : '100%' }}>{proposal < range.start ? '‹' : '›'}</b> : null}
            {within(arrival) ? <small class="pr-marker-date arrival" style={{ left: `${pos(arrival)}%` }}>Arrives {fmtDate(arrival).replace(/ \d{4}$/, '')}</small> : null}
            {need.neededAt !== undefined && within(need.neededAt) ? <small class="pr-marker-date need" style={{ left: `${pos(need.neededAt)}%` }}>{need.source === 'research-bonus' ? 'Bonus by' : need.source === 'requested' ? 'Requested' : 'Needed'} {fmtDate(need.neededAt).replace(/ \d{4}$/, '')}</small> : null}
          </span>
          <span class="pr-timeline-result"><strong class={need.margin !== undefined && need.margin < 0 ? 'late' : ''}>{shortMargin(need.margin)}</strong>{proposal !== undefined ? <small>→ {shortMargin(need.neededAt === undefined ? undefined : need.neededAt - proposal)} · {fmtM(q!.feeM)}</small> : null}</span>
        </button>;
      })}
    </div> : <div class="pr-empty"><h3>No incoming contracts</h3><p>Delivered and cancelled contracts remain in Table.</p></div>}
  </div>;
}
