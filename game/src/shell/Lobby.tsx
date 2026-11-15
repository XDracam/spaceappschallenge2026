// Lobby (D-015): host a game, resume it, or join with copy-paste connection codes;
// then pick a station. Shown whenever this browser is not at a station.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { STATIONS, type Seat, type StationId } from '../core/model';
import { DEFAULT_MISSION_ID, MISSIONS, missionById } from '../core/mission';
import { setLocalStation, useGame, useSync } from '../core/store';
import type { InviteInfo } from '../net/webrtc';
import { STATION_INFO } from './stations';
import { requestConfirmation } from '../shared/confirmation';
import {
  acceptReply, backToStart, cancelInvite, cancelJoin, createInvite, hasSavedGame, hostEnterMission,
  hostNewGame, hostTakeSeat, joinWithInvite, playerTakeSeat, resumeHostedGame, setName, setScreen, useSession,
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

function CodeBox({ code, label }: { code: string; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      ref.current?.select();
      document.execCommand('copy');
    }
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
      then open the game in more tabs or windows and join from there.
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

function MissionPicker({ onBack }: { onBack: () => void }) {
  const [pick, setPick] = useState(DEFAULT_MISSION_ID);
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
        <button class="shell-btn shell-btn-primary shell-btn-big" onClick={() => hostNewGame(chosen.id)}>
          Host “{chosen.name}”
        </button>
        <button class="shell-link" onClick={onBack}>← Back</button>
      </div>
    </section>
  );
}

function StartScreen() {
  const name = useSession((s) => s.name);
  const saved = useMemo(() => hasSavedGame(), []);
  const [picking, setPicking] = useState(false);
  if (picking) {
    return (
      <>
        <Brand />
        <MissionPicker onBack={() => setPicking(false)} />
      </>
    );
  }
  return (
    <>
      <Brand />
      <p class="shell-lead">
        Four players, four stations, one space mission. Each player runs a station on their own computer — planning,
        procurement, science and communications — and everything they do is shared live.
      </p>
      <label class="shell-field">
        <span class="shell-label">Your name</span>
        <input
          class="shell-input"
          value={name}
          maxLength={24}
          placeholder="e.g. Alex"
          onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <div class="shell-choices">
        <button class="shell-choice" onClick={() => setPicking(true)}>
          <span class="shell-choice-title">Host a new game</span>
          <span class="shell-choice-text">
            Pick a mission. Your browser runs the game. Invite up to three players — or start alone and switch between stations.
          </span>
        </button>
        {saved && (
          <button class="shell-choice" onClick={resumeHostedGame}>
            <span class="shell-choice-title">Resume hosted game</span>
            <span class="shell-choice-text">
              Continue the {saved.missionName} game saved in this browser ({saved.phase === 'lobby' ? 'not started yet' : dayLabel(saved.day)}).
              Players join again with new codes.
            </span>
          </button>
        )}
        <button class="shell-choice" onClick={() => setScreen('join')}>
          <span class="shell-choice-title">Join a game</span>
          <span class="shell-choice-text">Someone else is hosting and sent you an invite code.</span>
        </button>
      </div>
      <details class="shell-howto">
        <summary>How does connecting work?</summary>
        <p>
          There is no game server. The host's browser holds the game and each player connects to it directly. To connect,
          the host and the player swap two codes once — through chat, e-mail or anything else you can copy and paste into:
        </p>
        <ol>
          <li>The host makes an <b>invite code</b> and sends it to the player.</li>
          <li>The player pastes it here and gets a <b>reply code</b>, which they send back.</li>
          <li>The host pastes the reply code. Connected — the player picks a station.</li>
        </ol>
        <p>Trying it alone? Host in this tab, then open this page in another tab or window and join from there.</p>
      </details>
    </>
  );
}

// ------------------------------------------------------------------ host

function HostScreen() {
  const seats = useGame((s) => s.meta.seats);
  const phase = useGame((s) => s.meta.phase);
  const day = useGame((s) => s.clock.day);
  const invites = useSession((s) => s.invites);
  const names = useSession((s) => s.peerNames);
  const [busy, setBusy] = useState(false);
  const mine = STATIONS.find((st) => seats[st].claimedBy === 'host');
  const connected = invites.filter((i) => i.status === 'connected').length;
  const started = phase !== 'lobby';

  const invite = async () => {
    setBusy(true);
    await createInvite();
    setBusy(false);
  };
  const leave = async () => {
    if (connected > 0 && !await requestConfirmation('Close this game? Connected players will be disconnected. The game stays saved in this browser.', 'Close game')) return;
    backToStart();
  };

  return (
    <>
      <Brand tag={started ? `Hosting · ${dayLabel(day)}` : 'Hosting'} />
      <MissionLine />
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
          <Step n={2} title="Invite players" done={connected > 0 && invites.every((i) => i.status === 'connected')}>
            <p class="shell-muted">
              Make one invite per player. Send them the invite code (chat, e-mail…), they send a reply code back, you paste
              it below.
            </p>
            <div class="shell-invites">
              {invites.map((inv, i) => (
                <InviteCard key={inv.peerId} inv={inv} index={i + 1} name={names[inv.peerId]} seats={seats} />
              ))}
            </div>
            <button class="shell-btn" disabled={busy || invites.length >= 12} onClick={invite}>
              {busy ? 'Making invite code…' : invites.length ? '+ Invite another player' : '+ Invite a player'}
            </button>
          </Step>
        </div>
      </div>
      <footer class="shell-foot">
        <button class="shell-link" onClick={leave}>Close game and go back</button>
      </footer>
    </>
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
  const role = useSync((s) => s.role);
  const peerId = useSync((s) => s.peerId);
  const seats = useGame((s) => s.meta.seats);
  const phase = useGame((s) => s.meta.phase);
  const [code, setCode] = useState('');
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
      <Step n={1} title="Paste the invite code from the host" done={join.status !== 'idle'}>
        {join.status === 'idle' ? (
          <>
            <div class="shell-codebox">
              <textarea
                class="shell-code shell-code-input"
                rows={3}
                placeholder="Paste invite code (starts with MC1-)"
                aria-label="Invite code"
                value={code}
                onInput={(e) => setCode((e.currentTarget as HTMLTextAreaElement).value)}
              />
              <button class="shell-btn shell-btn-primary" disabled={!code.trim()} onClick={() => joinWithInvite(code)}>
                Next
              </button>
            </div>
            {join.error && <p class="shell-error" role="alert">{join.error}</p>}
          </>
        ) : (
          <p class="shell-muted">Invite code accepted.</p>
        )}
      </Step>

      {join.status !== 'idle' && (
        <Step n={2} title="Send your reply code to the host" done={join.status === 'connected'}>
          {join.status === 'creating' && <p class="shell-muted"><span class="shell-spin" /> Preparing your reply code (a few seconds)…</p>}
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
              <p class="shell-error" role="alert">{join.error || 'The connection failed.'} Ask the host for a new invite code.</p>
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
  return (
    <div class="shell-hostleft">
      <h2>{reason === 'lost' ? 'Connection to the host lost' : 'Host left the game'}</h2>
      <p class="shell-muted">
        {reason === 'lost'
          ? 'The connection to the host dropped. '
          : 'The host closed or reloaded the game. '}
        The game is saved in the host's browser: once they choose “Resume hosted game”, ask for a new invite code and join again.
      </p>
      <button class="shell-btn shell-btn-primary" onClick={backToStart}>Back to lobby</button>
    </div>
  );
}
