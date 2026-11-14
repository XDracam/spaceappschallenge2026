import type { EventDef, EventInstance } from '../model/types';
import { actions, useClock, useComms, useUi } from '../state/store';
import { optionEffects } from '../state/world';
import {
  Avatar, ChangeList, HintPills, InternalTag, SH, dueClass, eventById, eventCharacter, openByUrgency,
} from './common';
import { formatDay, formatDuration, formatMoney } from './format';
import { selectEvent } from './Inbox';

/** Centre panel: the selected conversation, or a calm empty state. */
export function Conversation() {
  const selected = useUi((u) => u.selectedInstanceId);
  const inbox = useComms((s) => s.inbox);
  const inst = inbox.find((i) => i.instanceId === selected);
  const def = inst ? eventById(inst.eventId) : undefined;

  if (!inst) {
    return (
      <section class="talk glass">
        <div class="talk-empty">
          <div class="calm-ring"><span /></div>
          <div class="display calm-title">All quiet</div>
          <p class="muted">No one is waiting for an answer. New messages arrive on the agency calendar, about one a month.</p>
          <p class="muted small">Meanwhile, start a project on the right to build trust before you need it.</p>
        </div>
      </section>
    );
  }
  if (!def) {
    return (
      <section class="talk glass">
        <div class="talk-empty"><p class="muted">Unknown event “{inst.eventId}”.</p></div>
      </section>
    );
  }
  return (
    <section class="talk glass">
      <TalkBody key={inst.instanceId} inst={inst} def={def} />
    </section>
  );
}

function TalkBody({ inst, def }: { inst: EventInstance; def: EventDef }) {
  const ch = eventCharacter(def);
  const today = useClock((c) => Math.floor(c.day));
  const budget = useComms((s) => s.budgetM);
  const startISO = useComms((s) => s.startDateISO);
  const launched = useComms((s) => s.phase === 'launched');
  const inbox = useComms((s) => s.inbox);
  const lastOutcome = useUi((u) => u.lastOutcome);
  const isOpen = inst.status === 'open';
  const left = Math.max(0, Math.ceil(inst.deadlineDay - today));
  const chosen = def.options.find((o) => o.id === inst.chosenOptionId);
  const next = openByUrgency(inbox).find((i) => i.instanceId !== inst.instanceId);

  let outcomeText = '';
  let outcomeEffects = chosen ? optionEffects(chosen) : [];
  if (inst.status === 'answered') {
    outcomeText = lastOutcome?.instanceId === inst.instanceId ? lastOutcome.text : chosen?.outcome ?? '';
  } else if (inst.status === 'expired') {
    outcomeText = def.ignored.outcome;
    outcomeEffects = def.ignored.effects;
  }

  return (
    <div class="talk-inner">
      <div class="who">
        <Avatar character={ch} size="lg" />
        <div class="who-text">
          <div class="who-name display">{ch?.name ?? 'Unknown sender'}</div>
          <div class="muted">
            {ch?.role ?? ''}{ch ? ' · ' : ''}
            {ch && <span style={{ color: SH[ch.stakeholder].color }}>{SH[ch.stakeholder].label}</span>}
          </div>
          <div class="who-due">
            {isOpen ? (
              <><span class="label">Answer within</span> <b class={`num ${dueClass(left) || 'calm'}`}>{left} day{left === 1 ? '' : 's'}</b>
                <span class="muted tiny"> · by {formatDay(inst.deadlineDay, startISO)}</span></>
            ) : (
              <span class={`status-pill ${inst.status}`}>{inst.status === 'answered' ? 'answered' : 'no answer in time'}</span>
            )}
          </div>
        </div>
        <div class="talk-title">
          <span class="label">Subject</span>
          <div>{def.title}</div>
          <div class="muted tiny">received {formatDay(inst.arrivedDay, startISO)}</div>
        </div>
      </div>

      <blockquote class="quote">“{def.message}”</blockquote>

      <div class="talk-foot thin-scroll">
        {!isOpen && (
          <div class={`outcome ${inst.status}`}>
            <div class="label">{inst.status === 'answered' ? 'Outcome' : 'Ignored — it resolved on its own'}</div>
            {outcomeText && <p class="outcome-text">{outcomeText}</p>}
            <div class="label tiny-gap">What changed</div>
            <ChangeList effects={outcomeEffects} />
            {next && (
              <button class="pill primary next-btn" onClick={() => selectEvent(next.instanceId)}>
                Next message · {formatDuration(Math.max(0, next.deadlineDay - today))} left →
              </button>
            )}
          </div>
        )}

        <div class={`opts${isOpen ? '' : ' answered'}`}>
          {def.options.map((o, idx) => {
            const tooExpensive = !!o.costM && o.costM > budget;
            const disabled = !isOpen || launched || tooExpensive;
            const isChosen = o.id === inst.chosenOptionId;
            if (!isOpen && !isChosen) return null;
            return (
              <button key={o.id} class={`opt${isChosen ? ' chosen' : ''}`} disabled={disabled && !isChosen}
                title={tooExpensive && isOpen ? `Needs ${formatMoney(o.costM!)}; only ${formatMoney(budget)} left` : undefined}
                onClick={() => {
                  if (!disabled) actions.answer(inst.instanceId, o.id);
                }}>
                <span class="opt-key">{isChosen ? '✓' : idx + 1}</span>
                <span class="opt-text">{o.text}</span>
                <span class="opt-meta">
                  <HintPills hints={o.hints} />
                  <InternalTag effects={o.effects} costM={o.costM} />
                  {!!o.costM && <span class={`opt-cost num${tooExpensive ? ' err-text' : ''}`}>costs {formatMoney(o.costM)}</span>}
                </span>
              </button>
            );
          })}
        </div>
        {isOpen && <div class="muted tiny opts-note">Hints show who is likely to react, not by how much. Exact effects are revealed after you answer.</div>}
      </div>
    </div>
  );
}
