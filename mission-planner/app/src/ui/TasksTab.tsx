import type { Contract, ProcurementTask } from '../model/types';
import { cancellationRefundM, useClock, useGame } from '../state/store';
import { PART_KIND_LABEL, statDefs, variantLabel } from '../data/parts';
import { formatDay, formatDuration, formatMoney } from '../model/units';
import { findPart } from '../model/rocketUtils';
import { fmtNum, pctFine } from './common';

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
    <div class="beyond-box">
      <div><b>Beyond research:</b> {task.beyondResearch.join(', ')}</div>
      <div class="muted">Ways to get this part:</div>
      <ol>
        <li><b>Research first</b> — science researches the limit or unlock, then procurement buys it cheaper.</li>
        <li><b>Buy without research</b> — procurement buys it expensively from someone else.</li>
        <li><b>Diplomacy</b> — communications negotiates with another country for the research or the part.</li>
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
        <div class="kv"><span>Cancellation refund now</span><span class="num">{formatMoney(cancellationRefundM(c, day))}</span></div>
      )}
      {c.status === 'cancelled' && (
        <div class="kv"><span>Refunded</span><span class="num">{formatMoney(c.refundM ?? 0)}</span></div>
      )}
      <div class="kv"><span>Contract status</span><span class={`chip c-${c.status}`}>{c.status}</span></div>
    </div>
  );
}

export function TasksTab() {
  const tasks = useGame((g) => g.tasks);
  const contracts = useGame((g) => g.contracts);
  const rocket = useGame((g) => g.rocket);
  const launchDay = useGame((g) => g.plan.launchDay);
  const startISO = useGame((g) => g.mission.startDateISO);

  if (tasks.length === 0) {
    return (
      <div class="tab-pad">
        <p class="empty">No procurement tasks yet. Use “Send to procurement” on a part in the Rocket tab.</p>
      </div>
    );
  }

  return (
    <div class="tab-pad">
      <p class="hint">Read-only for the planner: procurement signs and cancels contracts.</p>
      {[...tasks].reverse().map((t) => {
        const tc = contracts.filter((c) => c.taskId === t.id);
        const inDesign = !!findPart(rocket, t.partId);
        return (
          <div class={`card task-card t-${t.status}`} key={t.id}>
            <div class="card-head">
              <span class={`chip t-${t.status}`}>{t.status}</span>
              <b>{t.partName}</b>
              <span class="muted small">{PART_KIND_LABEL[t.partKind]} · {variantLabel(t.partKind, t.variant)}</span>
            </div>
            <div class="muted small">
              Created {formatDay(t.createdDay, startISO)}
              {t.updatedDay !== t.createdDay && ` · updated ${formatDay(t.updatedDay, startISO)}`}
              {!inDesign && ' · part no longer in the design'}
            </div>
            <MinimumsTable task={t} />
            {(t.status === 'open' || t.status === 'changed') && <BeyondResearchPaths task={t} />}
            {tc.map((c) => <ContractInfo key={c.id} c={c} launchDay={launchDay} startISO={startISO} />)}
          </div>
        );
      })}
    </div>
  );
}
