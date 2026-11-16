// Floating station pill (bottom-left): current station, connection, who sits where,
// hop to a free station (D-015), calendar pause. Shows "Host left" for players.
import { useEffect, useRef, useState } from 'preact/hooks';
import { STATIONS, type StationId } from '../core/model';
import { coreActions } from '../core/coreActions';
import { setLocalStation, useGame, useSync } from '../core/store';
import { HostLeft } from './Lobby';
import { STATION_INFO } from './stations';
import { backToStart, connectedPlayerCount, playerName, useSession } from './session';
import { requestConfirmation } from '../shared/confirmation';
import { useDialog } from '../shared/useDialog';

export function StationSwitcher() {
  const seats = useGame((s) => s.meta.seats);
  const day = useGame((s) => s.clock.day);
  const running = useGame((s) => s.clock.running);
  const phase = useGame((s) => s.meta.phase);
  const { station, peerId, role, connected } = useSync((s) => s);
  const connectedPeers = useSession(connectedPlayerCount);
  const closeReason = useSession((s) => s.join.closeReason);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const disconnectRef = useRef<HTMLDivElement>(null);
  useDialog({ open: role === 'client' && !connected, root: disconnectRef });

  // If someone else got this seat first (our optimistic claim was rejected), go back
  // to the seat we hold, or to the lobby seat picker.
  useEffect(() => {
    if (!station) return;
    const holder = seats[station].claimedBy;
    if (holder && holder !== peerId) setLocalStation(STATIONS.find((st) => seats[st].claimedBy === peerId) ?? null);
  }, [seats, station, peerId]);

  // Close the panel on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('pointerdown', onDown, true);
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('pointerdown', onDown, true);
      removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (role === 'client' && !connected) {
    return (
      <div ref={disconnectRef} class="shell-overlay" role="dialog" aria-modal="true" aria-label="Connection interrupted">
        <HostLeft reason={closeReason} />
      </div>
    );
  }
  if (!station) return null;

  const hop = (st: StationId) => {
    coreActions.claimSeat(st, peerId, playerName());
    setLocalStation(st);
    setOpen(false);
  };
  const players = STATIONS.filter((st) => seats[st].claimedBy).length;
  const status =
    role === 'host' ? (connectedPeers ? `Hosting · ${connectedPeers} connected` : 'Hosting · alone')
    : role === 'client' ? 'Connected to host'
    : 'Offline';
  const info = STATION_INFO[station];

  return (
    <div class="shell-switcher" ref={rootRef} style={{ '--seat-c': info.color }}>
      {open && (
        <div class="shell-pop" role="dialog" aria-label="Stations and players">
          <div class="shell-pop-row shell-pop-status">
            <span class={`shell-dot is-${role === 'client' ? 'client' : role}`} />
            <span>{status}</span>
            <span class="shell-spacer" />
            <span class="shell-muted shell-num">Day {Math.floor(day)}</span>
          </div>
          <div class="shell-label shell-pop-title">Stations</div>
          {STATIONS.map((st) => {
            const seat = seats[st];
            const mine = seat.claimedBy === peerId;
            const free = !seat.claimedBy;
            return (
              <div key={st} class={`shell-pop-row shell-pop-seat${st === station ? ' is-current' : ''}`} style={{ '--seat-c': STATION_INFO[st].color }}>
                <span class="shell-seat-bar" />
                <span class="shell-pop-seat-name">{STATION_INFO[st].label}</span>
                <span class="shell-spacer" />
                {st === station ? (
                  <span class="shell-muted">You are here</span>
                ) : mine ? (
                  <button class="shell-btn shell-btn-sm" onClick={() => hop(st)}>Go</button>
                ) : free ? (
                  <button class="shell-btn shell-btn-sm" onClick={() => hop(st)} title="This station is free — switch to it">Switch here</button>
                ) : (
                  <span class="shell-pop-who">{seat.playerName || 'Player'}</span>
                )}
              </div>
            );
          })}
          <div class="shell-pop-actions">
            {/* Only the host may pause the shared calendar (user direction: no pause in the station UIs). */}
            {phase === 'planning' && role !== 'client' && (
              <button class="shell-btn shell-btn-sm" onClick={() => coreActions.setRunning(!running)}>
                {running ? '❚❚ Pause calendar' : '▶ Resume calendar'}
              </button>
            )}
            <span class="shell-spacer" />
            {role === 'host' ? (
              <button class="shell-btn shell-btn-sm" onClick={() => setLocalStation(null)} title="Invite players or check seats (the game keeps running)">
                Invite / lobby
              </button>
            ) : (
              <button
                class="shell-btn shell-btn-sm"
                onClick={async () => {
                  if (role !== 'client' || await requestConfirmation('Leave the game? Your station becomes free for others.', 'Leave game')) backToStart();
                }}
              >
                Leave game
              </button>
            )}
          </div>
        </div>
      )}
      <button class={`shell-pill${open ? ' is-open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} title="Stations, players and connection">
        <span class="shell-seat-bar" />
        <span class="shell-pill-name">{info.label}</span>
        <span class="shell-pill-seats" aria-label={`${players} of 4 stations taken`}>
          {STATIONS.map((st) => (
            <span
              key={st}
              class={`shell-pip${seats[st].claimedBy ? ' is-taken' : ''}${st === station ? ' is-current' : ''}`}
              style={{ '--seat-c': STATION_INFO[st].color }}
              title={`${STATION_INFO[st].label}: ${seats[st].claimedBy ? seats[st].playerName || 'taken' : 'free'}`}
            />
          ))}
        </span>
        <span class={`shell-dot is-${role}`} title={status} />
        {!running && phase === 'planning' && <span class="shell-pill-paused">Paused</span>}
        <span class="shell-caret" aria-hidden="true">{open ? '▾' : '▴'}</span>
      </button>
    </div>
  );
}
