import { useState } from 'preact/hooks';
import type { Contract, ProcurementTask } from '../model/types';
import { cancellationRefundM, useClock, useGame } from '../state/store';
import { PART_KIND_LABEL, statDefs, variantLabel } from '../data/parts';
import { formatDay, formatDuration, formatMoney } from '../model/units';
import { findPart } from '../model/rocketUtils';
import { ChevronIcon, fmtNum, pctFine } from './common';

export function MinimumsTable({ task }: { task: ProcurementTask }) {
  const defs = statDefs(task.partKind, task.variant);
  return (
    <table class="mini-table">
      <tbody>
        {defs.map((d) => {
          const v = task.minimums[d.key];
          if (v === undefined) return null;
          const f = d.displayFactor ?? 1;
          const unit = d.displayUnit ?? d.unit;
          const beyond = task.beyondResearch.some((k) => k.endsWith(`.${d.key}`));
          return (
            <tr class={beyond ? 'beyond' : ''}>
              <td>{d.label}</td>
              <td class="num">≥ {fmtNum(v * f)}{unit ? ` ${unit}` : ''}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function BeyondResearchPaths({ task }: { task: ProcurementTask }) {
  if (task.beyondResearch.length === 0) return null;
  return (
    <div class="beyond-box" title={task.beyondResearch.join(', ')}>
      <div class="label warn-text">Beyond research · ways to get it</div>
      <div class="tiny muted">{task.beyondResearch.join(', ')}</div>
      <ol>
        <li title="Science researches the limit or unlock, then procurement buys it cheaper"><b>Research first</b>, then buy cheaper</li>
        <li title="Procurement buys it expensively from someone else"><b>Buy without research</b>, expensive</li>
        <li title="Communications negotiates with another country for the research or the part"><b>Diplomacy</b> for research or part</li>
      </ol>
    </div>
  );
}

function ContractInfo({ c, launchDay, startISO }: { c: Contract; launchDay: number; startISO: string }) {
  const day = useClock((cl) => Math.floor(cl.day));
  const late = c.status !== 'cancelled' && c.deliveryDay > launchDay;
  return (
    <div class="contract-box">
      <div class="kv"><span>Supplier</span><b>{c.supplier}</b></div>
      <div class="kv"><span>Price</span><b class="num">{formatMoney(c.priceM)}</b></div>
      <div class="kv"><span>Signed</span><span class="num">{formatDay(c.signedDay, startISO)}</span></div>
      <div class={`kv${late ? ' err-text' : ''}`}>
        <span>{c.status === 'delivered' ? 'Delivered' : 'Delivery'}</span>
        <span class="num">
          {formatDay(c.deliveryDay, startISO)}
          {c.status === 'running' && (late
            ? ` · ${formatDuration(c.deliveryDay - launchDay)} after launch`
            : ` · ${formatDuration(launchDay - c.deliveryDay)} before launch`)}
        </span>
      </div>
      <div class="kv"><span>Reliability</span><b class="num">{pctFine(c.reliability)}</b></div>
      {c.status === 'running' && (
        <div class="kv" title="Only procurement can cancel; the refund falls from 50 % at signing to 0 % at delivery">
          <span>Refund if cancelled now</span><span class="num">{formatMoney(cancellationRefundM(c, day))}</span>
        </div>
      )}
      {c.status === 'cancelled' && (
        <div class="kv"><span>Refunded</span><span class="num">{formatMoney(c.refundM ?? 0)}</span></div>
      )}
      <div class="kv"><span>Contract</span><span class={`status-pill c-${c.status}`}>{c.status}</span></div>
    </div>
  );
}

export function TasksTab() {
  const tasks = useGame((g) => g.tasks);
  const contracts = useGame((g) => g.contracts);
  const rocket = useGame((g) => g.rocket);
  const launchDay = useGame((g) => g.plan.launchDay);
  const startISO = useGame((g) => g.mission.startDateISO);
  const [openId, setOpenId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <div class="empty" title="Use “Send to procurement” on a part in the Rocket panel">No procurement tasks yet.</div>;
  }

  return (
    <div class="tasks-tab">
      <div class="muted tiny panel-note" title="Procurement signs and cancels contracts; the planner only sends tasks">Read-only: procurement signs and cancels.</div>
      {[...tasks].reverse().map((t) => {
        const tc = contracts.filter((c) => c.taskId === t.id);
        const live = tc.find((c) => c.status !== 'cancelled');
        const late = !!live && live.status === 'running' && live.deliveryDay > launchDay;
        const inDesign = !!findPart(rocket, t.partId);
        const open = openId === t.id;
        return (
          <div class={`task${open ? ' open' : ''} t-${t.status}`} key={t.id}>
            <div class={`row${open ? ' open' : ''}`} onClick={() => setOpenId(open ? null : t.id)}>
              <span class="row-name" title={t.partName}>{t.partName}{!inDesign && <span class="row-sub">not in design</span>}</span>
              <span class={`status-pill t-${t.status}`}>{t.status}</span>
              <span class={`row-num num${late ? ' err-text' : ''}`}
                title={live ? (late ? 'Delivery after the launch date' : live.status === 'delivered' ? 'Delivered' : 'Delivery date') : 'No contract yet'}>
                {live ? formatDay(live.deliveryDay, startISO) : '—'}
              </span>
              <ChevronIcon open={open} />
            </div>
            {open && (
              <div class="row-detail">
                <div class="muted tiny">
                  {PART_KIND_LABEL[t.partKind]} · {variantLabel(t.partKind, t.variant)} · created {formatDay(t.createdDay, startISO)}
                  {t.updatedDay !== t.createdDay && ` · updated ${formatDay(t.updatedDay, startISO)}`}
                </div>
                <MinimumsTable task={t} />
                {(t.status === 'open' || t.status === 'changed') && <BeyondResearchPaths task={t} />}
                {tc.map((c) => <ContractInfo key={c.id} c={c} launchDay={launchDay} startISO={startISO} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
