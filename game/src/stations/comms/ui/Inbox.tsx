import { useState } from 'preact/hooks';
import type { EventInstance } from '../model/types';
import { actions, useComms, useToday, useUi } from './store';
import { Avatar, dueClass, eventById, eventCharacter } from './common';
import { formatDuration } from './format';

export const selectEvent = (instanceId: string) => actions.select(instanceId);

/** Left panel: open messages newest first, then a collapsed "Earlier" section. */
export function Inbox() {
  const inbox = useComms((s) => s.inbox);
  const selected = useUi((u) => u.selectedInstanceId);
  const today = useToday();
  const [showEarlier, setShowEarlier] = useState(false);

  const open = inbox.filter((i) => i.status === 'open').sort((a, b) => b.arrivedDay - a.arrivedDay);
  const earlier = inbox.filter((i) => i.status !== 'open').sort((a, b) => b.arrivedDay - a.arrivedDay);

  return (
    <section class="inbox glass">
      <div class="panel-head">
        <span class="label">Inbox</span>
        {open.length > 0 && <span class="count-badge">{open.length}</span>}
      </div>
      <div class="panel-scroll thin-scroll">
        {open.length === 0 && (
          <div class="empty-box">
            <div class="empty-icon">✉</div>
            No messages. Start a project to build relationships.
          </div>
        )}
        {open.map((i) => <MessageRow key={i.instanceId} inst={i} selected={i.instanceId === selected} today={today} />)}

        {earlier.length > 0 && (
          <div class="earlier">
            <button class="earlier-head" onClick={() => setShowEarlier(!showEarlier)} aria-expanded={showEarlier}>
              <span class={`chev${showEarlier ? ' open' : ''}`}>›</span>
              Earlier <span class="muted">· {earlier.length}</span>
            </button>
            {showEarlier && earlier.map((i) => (
              <MessageRow key={i.instanceId} inst={i} selected={i.instanceId === selected} today={today} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MessageRow({ inst, selected, today }: { inst: EventInstance; selected: boolean; today: number }) {
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
    <button class={`msg${selected ? ' sel' : ''}${isOpen ? '' : ' done'}`} onClick={() => selectEvent(inst.instanceId)}>
      <Avatar character={ch} size="sm" />
      <div class="msg-body">
        <div class="msg-name">{ch?.name ?? 'Unknown sender'}</div>
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
