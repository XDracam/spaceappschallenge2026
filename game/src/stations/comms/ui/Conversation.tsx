import { useEffect, useRef, useState } from 'preact/hooks';
import type { EventDef, EventInstance } from '../model/types';
import { useConfirmedGame, useSync } from '../../../core/store';
import { actions, useBudgetLeft, useLaunched, useStartISO, useToday, useUi } from './store';
import { optionEffects } from '../state/world';
import {
  Avatar, ChangeList, SH, changeLines, dueClass, eventById, eventCharacter, openByUrgency, previewLines,
} from './common';
import { formatDay, formatDuration, formatMoney, formatRealTime } from './format';
import { selectEvent } from './Inbox';

/** Centre panel: the selected conversation, or a calm empty state. */
export function Conversation() {
  const selected = useUi((u) => u.selectedInstanceId);
  const inbox = useConfirmedGame((s) => s.comms.inbox);
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
  const inbox = useConfirmedGame((s) => s.comms.inbox);
  // The previews read contracts, research, trust and the calendar: re-render with the shared state.
  const state = useConfirmedGame((s) => s);
  const connected = useSync(s => s.connected);
  const pending = useUi(u => u.pending);
  const feedback = useUi(u => u.feedback);
  const [draftId, setDraftId] = useState<string | null>(null);
  const review = useRef<HTMLDivElement>(null);
  const draft = def.options.find(o => o.id === draftId);
  useEffect(() => { if (draftId) review.current?.focus(); }, [draftId]);
  const running = state.clock.running;
  const lastOutcome = useUi((u) => u.lastOutcome);
  const isOpen = inst.status === 'open';
  const left = Math.max(0, Math.ceil(inst.deadlineDay - today));
  const realSec = Math.max(0, (inst.deadlineDay - state.clock.day) / Math.max(1e-9, state.clock.daysPerSecond));
  const chosen = def.options.find((o) => o.id === inst.chosenOptionId);
  const next = openByUrgency(inbox).find((i) => i.instanceId !== inst.instanceId);
  const blocked = (costM?: number) => launched ? 'The mission has launched; replies are closed.'
    : !connected ? 'Reconnect to the host before sending a reply.'
      : pending ? 'Waiting for the host to confirm your previous action.'
        : costM && costM > budget ? `Needs ${formatMoney(costM)}; ${formatMoney(budget)} remains. Choose another reply or ask your crew to free budget.` : '';

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
        {feedback && <p class="action-feedback small" role="status" aria-atomic="true">{feedback}</p>}
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

        {isOpen && <p class="muted small reply-instruction">Choose a reply, review its effects, then send. The calendar keeps moving while you decide.</p>}
        <div class={`opts${isOpen ? '' : ' answered'}`} role="group" aria-label="Reply choices">
          {def.options.map((o, idx) => {
            const why = isOpen ? blocked(o.costM) : 'This reply has already been sent.';
            const isChosen = o.id === inst.chosenOptionId;
            const isDraft = isOpen && o.id === draftId;
            if (!isOpen && !isChosen) return null;
            return (
              <button key={o.id} class={`opt${isChosen ? ' chosen' : ''}${isDraft ? ' selected' : ''}`}
                aria-pressed={isChosen || isDraft} aria-disabled={!!why}
                aria-describedby={isOpen && why ? `reply-block-${inst.instanceId}-${o.id}` : undefined}
                onClick={() => { if (isOpen && !why) setDraftId(o.id); }}>
                <span class="opt-key" aria-hidden="true">{isChosen ? '✓' : idx + 1}</span>
                <span class="opt-body">
                  <span class="opt-text">{o.text}</span>
                  {isOpen && <ChangeList lines={previewLines(state, o.effects, { costM: o.costM, shield: !o.costM })} empty="Changes nothing measurable." />}
                  {isOpen && why && <span id={`reply-block-${inst.instanceId}-${o.id}`} class="action-reason">{why}</span>}
                </span>
              </button>
            );
          })}
        </div>
        {isOpen && draft && <div ref={review} tabIndex={-1} class="reply-review" aria-label="Review reply">
          <h3>Review reply</h3>
          <p>{draft.text}</p>
          <ChangeList lines={previewLines(state, draft.effects, { costM: draft.costM, shield: !draft.costM })} empty="Changes nothing measurable." />
          <p class="muted small">Sending commits this answer and any shared budget cost. It cannot be changed.</p>
          {blocked(draft.costM) && <p id="reply-send-reason" class="action-reason">{blocked(draft.costM)}</p>}
          <div class="review-actions">
            <button class="pill" onClick={() => { setDraftId(null); review.current?.previousElementSibling?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus(); }}>Change reply</button>
            <button class="pill primary" aria-disabled={!!blocked(draft.costM)} aria-describedby={blocked(draft.costM) ? 'reply-send-reason' : undefined}
              onClick={() => { if (!blocked(draft.costM)) actions.answer(inst.instanceId, draft.id); }}>
              {pending?.type === 'answer' && pending.instanceId === inst.instanceId ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </div>}
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
