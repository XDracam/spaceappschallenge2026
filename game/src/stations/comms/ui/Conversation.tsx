import type { EventDef, EventInstance } from '../model/types';
import { useGame } from '../../../core/store';
import { actions, useBudgetLeft, useComms, useLaunched, useStartISO, useToday, useUi } from './store';
import { optionEffects } from '../state/world';
import {
  Avatar, ChangeList, SH, changeLines, dueClass, eventById, eventCharacter, openByUrgency, previewLines,
} from './common';
import { formatDay, formatDuration, formatMoney, formatRealTime } from './format';
import { selectEvent } from './Inbox';

/** Centre panel: the selected conversation, or a calm empty state. */
export function Conversation() {
  const selected = useUi((u) => u.selectedInstanceId);
  const inbox = useComms((s) => s.inbox);
  const inst = inbox.find((i) => i.instanceId === selected);
  const def = inst ? eventById(inst.eventId) : undefined;

  if (!inst) {
    return (
      <section id="comms-conversation" class="talk glass" aria-label="Selected conversation">
        <div class="talk-empty">
          <div class="calm-ring"><span /></div>
          <div class="display calm-title">All quiet</div>
          <p class="muted">No one is waiting for an answer. New messages arrive on the agency calendar, about one a month.</p>
          <p class="muted small">Meanwhile, start a project on the right: trust at launch decides the in-flight events.</p>
        </div>
      </section>
    );
  }
  if (!def) {
    return (
      <section id="comms-conversation" class="talk glass" aria-label="Selected conversation">
        <div class="talk-empty"><p class="muted">Unknown event “{inst.eventId}”.</p></div>
      </section>
    );
  }
  return (
    <section id="comms-conversation" class="talk glass" aria-label="Selected conversation">
      <TalkBody key={inst.instanceId} inst={inst} def={def} />
    </section>
  );
}

function TalkBody({ inst, def }: { inst: EventInstance; def: EventDef }) {
  const ch = eventCharacter(def);
  const today = useToday();
  const budget = useBudgetLeft();
  const startISO = useStartISO();
  const launched = useLaunched();
  const inbox = useComms((s) => s.inbox);
  // The previews read contracts, research, trust and the calendar: re-render with the shared state.
  const state = useGame((s) => s);
  const running = state.clock.running;
  const lastOutcome = useUi((u) => u.lastOutcome);
  const isOpen = inst.status === 'open';
  const left = Math.max(0, Math.ceil(inst.deadlineDay - today));
  const realSec = Math.max(0, (inst.deadlineDay - state.clock.day) / Math.max(1e-9, state.clock.daysPerSecond));
  const chosen = def.options.find((o) => o.id === inst.chosenOptionId);
  const next = openByUrgency(inbox).find((i) => i.instanceId !== inst.instanceId);

  let outcomeText = '';
  let outcomeLines = chosen ? changeLines(optionEffects(chosen)) : [];
  if (inst.status === 'answered') {
    const mine = lastOutcome?.instanceId === inst.instanceId && lastOutcome.optionId === inst.chosenOptionId ? lastOutcome : null;
    outcomeText = mine?.text ?? chosen?.outcome ?? '';
    if (mine) outcomeLines = mine.lines;
  } else if (inst.status === 'expired') {
    outcomeText = def.ignored.outcome;
    outcomeLines = changeLines(def.ignored.effects);
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
                <span class="muted tiny num"> · by {formatDay(inst.deadlineDay, startISO)}{running ? ` · ${formatRealTime(realSec)} real time` : ''}</span></>
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
            <ChangeList lines={outcomeLines} />
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
              <button key={o.id} class={`opt${isChosen ? ' chosen' : ''}`} aria-pressed={isChosen} disabled={disabled && !isChosen}
                title={tooExpensive && isOpen ? `Needs ${formatMoney(o.costM!)}; only ${formatMoney(budget)} left` : undefined}
                onClick={() => {
                  if (!disabled) actions.answer(inst.instanceId, o.id);
                }}>
                <span class="opt-key">{isChosen ? '✓' : idx + 1}</span>
                <span class="opt-body">
                  <span class="opt-text">{o.text}</span>
                  {isOpen && <ChangeList lines={previewLines(state, o.effects, { costM: o.costM, shield: !o.costM })} empty="Changes nothing measurable." />}
                </span>
              </button>
            );
          })}
        </div>
        {isOpen && (
          <div class="ignore-line">
            <span class="label">No answer by {formatDay(inst.deadlineDay, startISO)}</span>
            <ChangeList lines={previewLines(state, def.ignored.effects, { shield: true })} empty="Nothing changes." />
          </div>
        )}
      </div>
    </div>
  );
}
