// Lobby (D-015, D-027): host a game, resume it, or join with a room code (manual
// copy-paste codes as fallback); then pick a station. Shown whenever this browser is
// not at a station.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { STATIONS, type Seat, type StationId } from '../core/model';
import { DEFAULT_MISSION_ID, MISSIONS, missionById } from '../core/mission';
import { setLocalStation, useGame, useSync } from '../core/store';
import type { InviteInfo } from '../net/webrtc';
import { formatRoomCode, roomLink, type RoomPlayer } from '../net/peerjs';
import { STATION_INFO } from './stations';
import { TitleScene } from './TitleScene';
import { requestConfirmation } from '../shared/confirmation';
import {
  acceptReply, backToStart, cancelInvite, cancelJoin, connectedPlayerCount, createInvite, hasSavedGame,
  hostEnterMission, hostNewGame, hostChooseMission, hostTakeSeat, isManualCode, joinGame, kickRoomPlayer, playerTakeSeat,
  rejoinRoom, resumeHostedGame, retryRoom, setName, setScreen, useSession,
} from './session';

export function Lobby() {
  const role = useSync((s) => s.role);
  const screen = useSession((s) => s.screen);
  let body;
  if (role === 'host') body = <HostScreen />;
  else if (role === 'client' || screen === 'join') body = <JoinScreen />;
  else body = <StartScreen />;
  return (
    <div class="shell-lobby">
      <div class="shell-lobby-inner">{body}</div>
    </div>
  );
}

// ------------------------------------------------------------------ shared bits

function Brand({ tag }: { tag?: string }) {
  return (
    <header class="shell-brand">
      <div class="shell-logo" aria-hidden="true" />
      <div>
        <h1>Mission Control</h1>
        <p class="shell-muted">Space mission design game · NASA Space Apps 2026</p>
      </div>
      {tag && <span class="shell-chip shell-chip-accent">{tag}</span>}
    </header>
  );
}

function Step({ n, title, children, done }: { n: number | string; title: string; children: ComponentChildren; done?: boolean }) {
  return (
    <section class={`shell-step${done ? ' is-done' : ''}`} data-n={n}>
      <div class="shell-step-head">
        <span class="shell-step-n">{done ? '✓' : n}</span>
        <h2>{title}</h2>
      </div>
      <div class="shell-step-body">{children}</div>
    </section>
  );
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

/** A button that copies `text` and says so for two seconds. */
function CopyButton({ text, label, primary }: { text: string; label: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return <button class={`shell-btn${primary ? ' shell-btn-primary' : ''}`} onClick={copy}>{copied ? 'Copied ✓' : label}</button>;
}

function CodeBox({ code, label }: { code: string; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div class="shell-codebox">
      <textarea
        ref={ref}
        class="shell-code"
        readOnly
        value={code}
        aria-label={label}
        rows={3}
        onFocus={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
      />
      <button class="shell-btn shell-btn-primary" onClick={copy}>{copied ? 'Copied ✓' : 'Copy code'}</button>
    </div>
  );
}

function NetHelp() {
  return (
    <div class="shell-help">
      <b>Connection trouble?</b> Some networks block direct connections between browsers (company, school or hotel
      Wi-Fi, some VPNs). Try another network, such as a phone hotspot — or play on one computer: host in this tab,
      then open the game in more tabs or windows and join from there. If room codes don't work at all, the host can
      use <i>manual codes</i> instead (under the room code).
    </div>
  );
}

function SeatGrid({ seats, me, onPick, names }: {
  seats: Record<StationId, Seat>;
  me: string;
  onPick: (st: StationId) => void;
  names?: Record<string, string>;
}) {
  return (
    <div class="shell-seats">
      {STATIONS.map((st) => {
        const info = STATION_INFO[st];
        const seat = seats[st];
        const mine = seat.claimedBy === me;
        const taken = !!seat.claimedBy && !mine;
        const who = mine ? 'You' : taken ? seat.playerName || names?.[seat.claimedBy!] || 'Another player' : 'Free';
        return (
          <button
            key={st}
            class={`shell-seat${mine ? ' is-mine' : ''}${taken ? ' is-taken' : ''}`}
            style={{ '--seat-c': info.color }}
            disabled={taken}
            onClick={() => onPick(st)}
            aria-pressed={mine}
          >
            <span class="shell-seat-name">{info.label}</span>
            <span class="shell-seat-blurb">{info.blurb}</span>
            <span class="shell-seat-who">
              <span class="shell-dot" />
              {who}
              {!taken && !mine && <span class="shell-seat-cta">Take this station</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The mission of the game this browser holds (host) or joined (player). */
function MissionLine() {
  const missionId = useGame((s) => s.meta.missionId);
  const m = missionById(missionId);
  const card = MISSION_CARD[m.id];
  return (
    <p class="shell-mission-line">
      <span class="shell-label">Mission</span> <b>{m.name}</b>
      {card && <span class="shell-muted"> · {card.text}</span>}
    </p>
  );
}

function dayLabel(day: number): string {
  return `day ${Math.floor(day)}`;
}

// ------------------------------------------------------------------ start

/** Lobby copy per mission (one line each); the first mission in MISSIONS is the default. */
const MISSION_CARD: Record<string, { tag: string; text: string }> = {
  'weather-geo': {
    tag: 'Start here',
    text: 'One satellite: launch to low Earth orbit, then raise it to geostationary orbit. Short game.',
  },
  'mars-orbiter-lander': {
    tag: 'Harder',
    text: 'An orbiter and a lander to Mars: launch windows, orbit insertion and a landing. Long game.',
  },
};

function MissionPicker({ onBack, current, onChoose }: { onBack?: () => void; current?: string; onChoose?: (id: string) => void }) {
  const [pick, setPick] = useState(current ?? DEFAULT_MISSION_ID);
  const chosen = MISSIONS.find((m) => m.id === pick) ?? MISSIONS[0];
  return (
    <section class="shell-missions" aria-labelledby="shell-missions-title">
      <h2 id="shell-missions-title">Pick a mission</h2>
      <div class="shell-mission-list" role="radiogroup" aria-labelledby="shell-missions-title">
        {MISSIONS.map((m) => {
          const card = MISSION_CARD[m.id];
          const on = m.id === pick;
          return (
            <button key={m.id} class={`shell-mission${on ? ' is-on' : ''}`} role="radio" aria-checked={on} onClick={() => setPick(m.id)}>
              <span class="shell-mission-head">
                <span class="shell-mission-radio" aria-hidden="true" />
                <span class="shell-choice-title">{m.name}</span>
                {card && <span class={`shell-chip${m.id === DEFAULT_MISSION_ID ? ' shell-chip-accent' : ''}`}>{card.tag}</span>}
              </span>
              <span class="shell-choice-text">{card?.text ?? m.briefing}</span>
            </button>
          );
        })}
      </div>
      <div class="shell-mission-actions">
        <button class="shell-btn shell-btn-primary shell-btn-big" onClick={() => onChoose ? onChoose(chosen.id) : hostNewGame(chosen.id)}>
          {onChoose ? 'Select' : 'Host'} “{chosen.name}”
        </button>
        {onBack && <button class="shell-link" onClick={onBack}>← Back</button>}
      </div>
    </section>
  );
}

function PlayerName() {
  const name = useSession((s) => s.name);
  return (
    <label class="shell-field">
      <span class="shell-label">Your name</span>
      <input class="shell-input" value={name} maxLength={24} placeholder="e.g. Alex" autoComplete="nickname"
        onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} />
    </label>
  );
}

function StartScreen() {
  const saved = useMemo(() => hasSavedGame(), []);
  const [picking, setPicking] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const newGame = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (picking) heading.current?.focus();
  }, [picking]);
  if (picking) {
    return (
      <div class="shell-start-setup">
        <Brand />
        <h2 ref={heading} tabIndex={-1}>Assemble your mission</h2>
        <p class="shell-muted">Choose a mission, then invite your crew. You can also start alone and use the free stations.</p>
        <PlayerName />
        <MissionPicker onBack={() => { setPicking(false); requestAnimationFrame(() => newGame.current?.focus()); }} />
      </div>
    );
  }
  return (
    <main class="title-screen">
      <TitleScene />
      <div class="title-content">
        <h1 class="title-name">MISSION<br />CONTROL<span class="title-period">.</span></h1>
        <p class="title-tagline">Four stations. One mission.<br /><strong>Make it fly.</strong></p>
        <nav class="title-menu" aria-label="Game menu">
          <button ref={newGame} class="title-action title-action-primary" onClick={() => setPicking(true)}>
            <span>New game</span><MenuArrow />
          </button>
          <button class="title-action" onClick={() => setScreen('join')}>
            <span>Join game</span><MenuArrow />
          </button>
          {saved && <button class="title-action title-continue" onClick={resumeHostedGame}>
            <span>Continue<span class="title-save">{saved.missionName} · {saved.phase === 'lobby' ? 'Not started' : dayLabel(saved.day)}</span></span>
            <MenuArrow />
          </button>}
        </nav>
        <p class="title-player-note">A cooperative space mission design game.<br />Best with four players. Playable with fewer.</p>
      </div>
      <footer class="title-footer">
        <div class="title-roles" aria-label="Four player stations">
          <div style={{ '--role-color': STATION_INFO.planner.color }}><b>Mission planning</b><span>Design the spacecraft.</span></div>
          <div style={{ '--role-color': STATION_INFO.procurement.color }}><b>Procurement</b><span>Secure the hardware.</span></div>
          <div style={{ '--role-color': STATION_INFO.science.color }}><b>Science</b><span>Advance the science.</span></div>
          <div style={{ '--role-color': STATION_INFO.comms.color }}><b>Communications</b><span>Win support.</span></div>
        </div>
        <div class="title-credits"><span>Made for NASA Space Apps 2026</span><span>Plan together. Launch together.</span></div>
      </footer>
    </main>
  );
}

function MenuArrow() {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

// ------------------------------------------------------------------ host

function HostScreen() {
  const seats = useGame((s) => s.meta.seats);
  const phase = useGame((s) => s.meta.phase);
  const day = useGame((s) => s.clock.day);
  const missionId = useGame((s) => s.meta.missionId);
  const invites = useSession((s) => s.invites);
  const names = useSession((s) => s.peerNames);
  const room = useSession((s) => s.room);
  const roomPlayers = useSession((s) => s.roomPlayers);
  const connected = useSession(connectedPlayerCount);
  const [busy, setBusy] = useState(false);
  const mine = STATIONS.find((st) => seats[st].claimedBy === 'host');
  const started = phase !== 'lobby';

  const invite = async () => {
    setBusy(true);
    await createInvite();
    setBusy(false);
  };
  const leave = async () => {
    if (connected > 0 && !await requestConfirmation('Close this game? Connected players will be disconnected. The browser may have a local save; check the save status before closing.', 'Close game')) return;
    backToStart();
  };

  return (
    <>
      <Brand tag={started ? `Hosting · ${dayLabel(day)}` : 'Hosting'} />
      <MissionLine />
      {!started && <MissionPicker key={missionId} current={missionId} onChoose={hostChooseMission} />}
      <div class="shell-cols">
        <div>
          <Step n={1} title="Choose your station" done={!!mine}>
            <p class="shell-muted">
              Your browser is a station too. Players who join pick from the free ones. During the game, anyone can switch
              to a free station.
            </p>
            <SeatGrid seats={seats} me="host" onPick={hostTakeSeat} names={names} />
          </Step>
          <Step n={3} title={started ? 'Back to the mission' : 'Start the mission'}>
            <p class="shell-muted">
              {started
                ? 'The mission is running. Invite players at any time — they join the mission in progress.'
                : 'You can start with fewer than four players. Free stations stay open for switching or late joiners.'}
            </p>
            <button class="shell-btn shell-btn-primary shell-btn-big" disabled={!mine} onClick={hostEnterMission}>
              {started ? 'Return to the mission' : 'Start mission'}
            </button>
            {!mine && <p class="shell-hint">Choose your station first.</p>}
          </Step>
        </div>
        <div>
          <Step n={2} title="Invite players" done={connected > 0}>
            <RoomPanel room={room} />
            {roomPlayers.length > 0 && (
              <div class="shell-invites">
                {roomPlayers.map((p) => (
                  <RoomPlayerRow key={p.peerId} p={p} name={names[p.peerId]} seats={seats} />
                ))}
              </div>
            )}
            <details class="shell-manual" open={room.status === 'error' || invites.length > 0}>
              <summary>Room code not working? Use manual codes</summary>
              <p class="shell-muted">
                Make one invite per player. Send them the invite code (chat, e-mail…), they send a reply code back, you
                paste it below. Works without the matchmaking service.
              </p>
              <div class="shell-invites">
                {invites.map((inv, i) => (
                  <InviteCard key={inv.peerId} inv={inv} index={i + 1} name={names[inv.peerId]} seats={seats} />
                ))}
              </div>
              <button class="shell-btn" disabled={busy || invites.length >= 12} onClick={invite}>
                {busy ? 'Making invite code…' : invites.length ? '+ Manual invite for another player' : '+ Manual invite'}
              </button>
            </details>
          </Step>
        </div>
      </div>
      <footer class="shell-foot">
        <button class="shell-link" onClick={leave}>Close game and go back</button>
      </footer>
    </>
  );
}

function RoomPanel({ room }: { room: { status: string; code: string; error: string } }) {
  const shown = formatRoomCode(room.code);
  return (
    <div class={`shell-room is-${room.status}`}>
      <span class="shell-label">Room code</span>
      <div class="shell-room-code" aria-live="polite">{room.status === 'error' ? '———' : shown || '···'}</div>
      {room.status === 'open' && (
        <>
          <p class="shell-muted">Tell your players this code, or send them the link. They choose “Join a game” and type it.</p>
          <div class="shell-room-actions">
            <CopyButton text={shown} label="Copy code" primary />
            <CopyButton text={roomLink(room.code)} label="Copy invite link" />
          </div>
        </>
      )}
      {room.status === 'opening' && <p class="shell-muted"><span class="shell-spin" /> Opening the room…</p>}
      {room.status === 'reconnecting' && (
        <p class="shell-muted"><span class="shell-spin" /> Reconnecting to the matchmaking service. Players already in stay connected.</p>
      )}
      {room.status === 'error' && (
        <>
          <p class="shell-error" role="alert">{room.error} Try again, or use manual codes below.</p>
          <button class="shell-btn" onClick={retryRoom}>Try again</button>
        </>
      )}
    </div>
  );
}

function RoomPlayerRow({ p, name, seats }: { p: RoomPlayer; name?: string; seats: Record<StationId, Seat> }) {
  const seat = STATIONS.find((st) => seats[st].claimedBy === p.peerId);
  const STATUS: Record<RoomPlayer['status'], string> = { connecting: 'Connecting…', connected: 'Connected', left: 'Left' };
  const where = p.status === 'connected' ? (seat ? `at ${STATION_INFO[seat].label}` : 'choosing a station…') : p.status === 'left' ? 'station free again' : '';
  return (
    <div class={`shell-invite is-${p.status}`}>
      <div class="shell-invite-head">
        <b>{name || (p.status === 'connecting' ? 'New player' : 'Player')}</b>
        <span class={`shell-chip is-${p.status}`}>{STATUS[p.status]}</span>
        <span class="shell-muted">{where}</span>
        <span class="shell-spacer" />
        {p.status !== 'connecting' && (
          <button class="shell-link" onClick={() => kickRoomPlayer(p.peerId)} title={p.status === 'connected' ? 'Disconnect this player' : 'Remove from the list'}>
            {p.status === 'connected' ? 'Disconnect' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  );
}

function InviteCard({ inv, index, name, seats }: { inv: InviteInfo; index: number; name?: string; seats: Record<StationId, Seat> }) {
  const [reply, setReply] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const seat = STATIONS.find((st) => seats[st].claimedBy === inv.peerId);
  const submit = async () => {
    setBusy(true);
    const e = await acceptReply(inv.peerId, reply);
    setBusy(false);
    setErr(e ?? '');
  };
  const who = name || `Player ${index}`;
  const STATUS: Record<InviteInfo['status'], string> = {
    creating: 'Making code…',
    waiting: 'Waiting for reply',
    connecting: 'Connecting…',
    connected: 'Connected',
    failed: 'Failed',
    left: 'Left',
  };
  return (
    <div class={`shell-invite is-${inv.status}`}>
      <div class="shell-invite-head">
        <b>{inv.status === 'connected' || inv.status === 'left' ? who : `Invite ${index}`}</b>
        <span class={`shell-chip is-${inv.status}`}>{STATUS[inv.status]}</span>
        <span class="shell-spacer" />
        <button class="shell-link" onClick={() => cancelInvite(inv.peerId)} title={inv.status === 'connected' ? 'Disconnect this player' : 'Remove this invite'}>
          {inv.status === 'connected' ? 'Disconnect' : 'Remove'}
        </button>
      </div>
      {inv.status === 'creating' && <p class="shell-muted">Preparing the invite code (a few seconds)…</p>}
      {inv.status === 'waiting' && (
        <>
          <p class="shell-small"><b>a.</b> Send this invite code to the player:</p>
          <CodeBox code={inv.code} label={`Invite code ${index}`} />
          <p class="shell-small"><b>b.</b> Paste the reply code they send back:</p>
          <div class="shell-codebox">
            <textarea
              class="shell-code shell-code-input"
              rows={2}
              placeholder="Paste reply code (starts with MC1-)"
              aria-label={`Reply code for invite ${index}`}
              value={reply}
              onInput={(e) => { setReply((e.currentTarget as HTMLTextAreaElement).value); setErr(''); }}
            />
            <button class="shell-btn shell-btn-primary" disabled={!reply.trim() || busy} onClick={submit}>Connect</button>
          </div>
          {err && <p class="shell-error" role="alert">{err}</p>}
        </>
      )}
      {inv.status === 'connecting' && <p class="shell-muted"><span class="shell-spin" /> Connecting to the player…</p>}
      {inv.status === 'connected' && (
        <p class="shell-muted">{seat ? `Sits at ${STATION_INFO[seat].label}.` : 'Choosing a station…'}</p>
      )}
      {inv.status === 'left' && <p class="shell-muted">Left the game; their station is free again. Make a new invite to bring them back.</p>}
      {inv.status === 'failed' && (
        <>
          <p class="shell-error" role="alert">{inv.error || 'The connection failed.'} Remove this invite and make a new one.</p>
          <NetHelp />
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ join

function JoinScreen() {
  const join = useSession((s) => s.join);
  const prefill = useSession((s) => s.joinPrefill);
  const role = useSync((s) => s.role);
  const peerId = useSync((s) => s.peerId);
  const seats = useGame((s) => s.meta.seats);
  const phase = useGame((s) => s.meta.phase);
  const [code, setCode] = useState(prefill);
  useEffect(() => { if (prefill) setCode(prefill); }, [prefill]);
  const manual = isManualCode(code);
  const submit = (e: Event) => {
    e.preventDefault();
    if (code.trim()) joinGame(code);
  };
  const ready = role === 'client' && join.status === 'connected' && join.hasSnapshot;
  const mine = ready ? STATIONS.find((st) => seats[st].claimedBy === peerId) : undefined;

  // Into the station once seated and the mission is running.
  useEffect(() => {
    if (ready && mine && phase !== 'lobby') setLocalStation(mine);
  }, [ready, mine, phase]);

  if (join.status === 'closed') {
    return (
      <>
        <Brand tag="Disconnected" />
        <HostLeft reason={join.closeReason} />
      </>
    );
  }

  return (
    <>
      <Brand tag={ready ? 'Connected' : 'Joining'} />
      {ready && <MissionLine />}
      <Step n={1} title="Enter the room code from the host" done={join.status !== 'idle'}>
        {join.status === 'idle' ? (
          <>
            <form class="shell-join" onSubmit={submit}>
              <PlayerName />
              <label class="shell-field shell-field-grow">
                <span class="shell-label">{manual ? 'Invite code' : 'Room code'}</span>
                {manual ? (
                  <textarea
                    class="shell-code shell-code-input"
                    rows={3}
                    aria-label="Invite code"
                    value={code}
                    onInput={(e) => setCode((e.currentTarget as HTMLTextAreaElement).value)}
                  />
                ) : (
                  <input
                    class="shell-input shell-room-input"
                    value={code}
                    placeholder="K7Q-4XM"
                    autoFocus
                    autoComplete="off"
                    spellcheck={false}
                    onInput={(e) => setCode((e.currentTarget as HTMLInputElement).value)}
                  />
                )}
              </label>
              <button type="submit" class="shell-btn shell-btn-primary shell-btn-big" disabled={!code.trim()}>Join</button>
            </form>
            {join.error && <p class="shell-error" role="alert">{join.error}</p>}
            <p class="shell-hint">Got a long manual code starting with MC1- instead? Paste it into the same box.</p>
          </>
        ) : (
          <p class="shell-muted">
            {join.mode === 'room' ? <>Room <b>{formatRoomCode(join.roomCode)}</b></> : 'Invite code accepted.'}
          </p>
        )}
      </Step>

      {join.status !== 'idle' && (
        <Step
          n={2}
          title={join.mode === 'room' ? 'Connect to the host' : 'Send your reply code to the host'}
          done={join.status === 'connected'}
        >
          {join.status === 'creating' && (
            <p class="shell-muted">
              <span class="shell-spin" /> {join.mode === 'room' ? 'Connecting to the host…' : 'Preparing your reply code (a few seconds)…'}
            </p>
          )}
          {join.status === 'waiting' && (
            <>
              <CodeBox code={join.replyCode} label="Your reply code" />
              <p class="shell-muted">
                <span class="shell-spin" /> Waiting for the host to paste it. This page continues by itself once you are
                connected.
              </p>
            </>
          )}
          {join.status === 'connected' && <p class="shell-muted">Connected to the host.</p>}
          {join.status === 'failed' && (
            <>
              <p class="shell-error" role="alert">
                {join.error || 'The connection failed.'}
                {join.mode === 'code' && ' Ask the host for a new invite code.'}
              </p>
              {join.mode === 'room' && <button class="shell-btn" onClick={rejoinRoom}>Try again</button>}
              <NetHelp />
            </>
          )}
        </Step>
      )}

      {join.status === 'connected' && (
        <Step n={3} title="Pick your station" done={!!mine}>
          {!join.hasSnapshot ? (
            <p class="shell-muted"><span class="shell-spin" /> Loading the game…</p>
          ) : (
            <>
              <SeatGrid seats={seats} me={peerId} onPick={playerTakeSeat} />
              {mine && phase === 'lobby' && (
                <div class="shell-banner">
                  <span>
                    You are at <b>{STATION_INFO[mine].label}</b>. The mission starts when the host presses Start — you will
                    be taken there automatically.
                  </span>
                  <button class="shell-btn" onClick={() => setLocalStation(mine)}>Look around now</button>
                </div>
              )}
            </>
          )}
        </Step>
      )}

      <footer class="shell-foot">
        <button class="shell-link" onClick={join.status === 'idle' ? () => setScreen('start') : join.status === 'connected' ? backToStart : cancelJoin}>
          {join.status === 'idle' ? '← Back' : join.status === 'connected' ? 'Leave game' : 'Start over'}
        </button>
      </footer>
    </>
  );
}

export function HostLeft({ reason }: { reason: 'bye' | 'lost' | null }) {
  const roomCode = useSession((s) => (s.join.mode === 'room' ? s.join.roomCode : ''));
  return (
    <div class="shell-hostleft">
      <h2>{reason === 'lost' ? 'Connection to the host lost' : 'Host left the game'}</h2>
      <p class="shell-muted">
        {reason === 'lost'
          ? 'The connection to the host dropped. '
          : 'The host closed or reloaded the game. '}
        {roomCode
          ? `If a local save succeeded in the host's browser, ask the host to continue that game, then rejoin room ${formatRoomCode(roomCode)}.`
          : "If a local save succeeded in the host's browser, ask the host to continue that game, then send you a new invite code to join again."}
      </p>
      <div class="shell-room-actions">
        {roomCode && <button class="shell-btn shell-btn-primary" onClick={rejoinRoom}>Rejoin {formatRoomCode(roomCode)}</button>}
        <button class={`shell-btn${roomCode ? '' : ' shell-btn-primary'}`} onClick={backToStart}>Back to lobby</button>
      </div>
    </div>
  );
}
