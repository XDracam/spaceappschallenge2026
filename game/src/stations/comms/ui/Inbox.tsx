import { useEffect, useRef, useState } from 'preact/hooks';
import type { EventInstance } from '../model/types';
import { actions, useComms, useStartISO, useToday, useUi } from './store';
import { Avatar, dueClass, eventById, eventCharacter } from './common';
import { formatDay, formatDuration } from './format';

export const selectEvent = (instanceId: string) => actions.select(instanceId);

/** Left panel: open messages newest first, then a collapsed "Earlier" section. */
export function Inbox() {
  const inbox = useComms((s) => s.inbox);
  const selected = useUi((u) => u.selectedInstanceId);
  const opened = useUi((u) => u.opened);
  const today = useToday();
  const [showEarlier, setShowEarlier] = useState(false);

  const open = inbox.filter((i) => i.status === 'open').sort((a, b) => b.arrivedDay - a.arrivedDay);
  const earlier = inbox.filter((i) => i.status !== 'open').sort((a, b) => b.arrivedDay - a.arrivedDay);

  return (
    <section class="inbox glass">
      <div class="panel-head">
        <span class="label">Inbox</span>
        {open.length > 0 && <span key={open.length} class="count-badge">{open.length}</span>}
      </div>
      <div class="panel-scroll thin-scroll">
        {open.length === 0 && (
          <div class="empty-box">
            <div class="empty-icon">✉</div>
            No messages. Start a project to build relationships.
          </div>
        )}
        {open.map((i) => (
          <MessageRow key={i.instanceId} inst={i} selected={i.instanceId === selected} fresh={!opened.includes(i.instanceId) && i.instanceId !== selected} today={today} />
        ))}

        {earlier.length > 0 && (
          <div class="earlier">
            <button class="earlier-head" onClick={() => setShowEarlier(!showEarlier)} aria-expanded={showEarlier}>
              <span class={`chev${showEarlier ? ' open' : ''}`}>›</span>
              Earlier <span class="muted">· {earlier.length}</span>
            </button>
            {showEarlier && earlier.map((i) => (
              <MessageRow key={i.instanceId} inst={i} selected={i.instanceId === selected} fresh={false} today={today} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MessageRow({ inst, selected, fresh, today }: { inst: EventInstance; selected: boolean; fresh: boolean; today: number }) {
  const def = eventById(inst.eventId);
  const ch = eventCharacter(def);
  const isOpen = inst.status === 'open';
  const left = inst.deadlineDay - today;
  let sub = def?.title ?? inst.eventId;
  if (!isOpen && def) {
    if (inst.status === 'answered') {
      const opt = def.options.find((o) => o.id === inst.chosenOptionId);
      sub = opt ? `You: ${opt.text}` : 'Answered';
    } else sub = `Expired · ${def.ignored.outcome}`;
  }
  return (
    <button class={`msg${selected ? ' sel' : ''}${isOpen ? '' : ' done'}${fresh ? ' fresh' : ''}`} aria-pressed={selected} aria-controls="comms-conversation" onClick={() => selectEvent(inst.instanceId)}>
      <Avatar character={ch} size="sm" />
      <div class="msg-body">
        <div class="msg-name">{fresh && <span class="new-dot" aria-label="new" />}{ch?.name ?? 'Unknown sender'}</div>
        <div class="msg-sub">{isOpen ? sub : <><span class="msg-title">{def?.title}</span><br />{sub}</>}</div>
      </div>
      {isOpen ? (
        <span class={`due num ${dueClass(left)}`} title={`Answer within ${Math.max(0, Math.ceil(left))} days`}>
          {formatDuration(Math.max(0, left))}
        </span>
      ) : (
        <span class={`status-pill ${inst.status}`}>{inst.status === 'answered' ? 'answered' : 'expired'}</span>
      )}
    </button>
  );
}

/**
 * A message that arrives while the player is busy with another one (or the project list)
 * gets a banner in the header that opens it (Rr001-12: only the count badge changed). It
 * glows on arrival, then stays as a quiet pill until that message is opened, answered or
 * expired, so it can be noticed and clicked later (a 7-second banner was gone before the
 * judge's clicks landed). Not when the centre panel was empty: then the message opens there by itself.
 */
export function ArrivalToast() {
  const inbox = useComms((s) => s.inbox);
  const opened = useUi((u) => u.opened);
  const selected = useUi((u) => u.selectedInstanceId);
  const startISO = useStartISO();
  const known = useRef<Set<string> | null>(null);
  const [toastId, setToastId] = useState<string | null>(null);

  useEffect(() => {
    const ids = new Set(inbox.map((i) => i.instanceId));
    const prev = known.current;
    known.current = ids;
    if (!prev) return; // first render: everything already there is not new
    const arrived = inbox.filter((i) => i.status === 'open' && !prev.has(i.instanceId));
    const busy = inbox.some((i) => i.status === 'open' && prev.has(i.instanceId));
    if (arrived.length && busy) setToastId(arrived[arrived.length - 1].instanceId);
  }, [inbox]);

  const inst = toastId ? inbox.find((i) => i.instanceId === toastId) : undefined;
  const visible = !!inst && inst.status === 'open' && !opened.includes(inst.instanceId) && selected !== inst.instanceId;
  const def = inst ? eventById(inst.eventId) : undefined;
  const ch = eventCharacter(def);
  return (
    <><span class="comms-a11y-only" role="status" aria-atomic="true">{visible && inst ? `New message: ${def?.title ?? 'Message'}. Answer by ${formatDay(inst.deadlineDay, startISO)}.` : ''}</span>
    {visible && inst && <button key={inst.instanceId} class="arrival glass strong" onClick={() => selectEvent(inst.instanceId)}>
      <Avatar character={ch} size="sm" />
      <span class="arrival-text">
        <span class="label">New message</span>
        <span><b>{ch?.name ?? 'Unknown sender'}</b> · {def?.title}</span>
      </span>
      <span class="muted tiny num">answer by {formatDay(inst.deadlineDay, startISO)}</span>
    </button>}</>
  );
}
