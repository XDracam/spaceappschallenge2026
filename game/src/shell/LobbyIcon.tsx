type LobbyIconName = 'planner' | 'procurement' | 'science' | 'comms' | 'weather' | 'moon' | 'mars';

/** Original shell icons; matching viewbox, stroke and optical size. */
export function LobbyIcon({ name }: { name: LobbyIconName }) {
  const shapes = {
    planner: <><path d="M14 4c3-2 6-2 6-2s0 3-2 6l-7 7-4-4zM7 11H3l-1 5 6-1m3 0-1 6 5-1v-4" /><circle cx="15" cy="7" r="2" /><path d="M5 17l-3 5 5-3" /></>,
    procurement: <><path d="m3 7 9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5v5" /></>,
    science: <><path d="M9 2h6M10 2v7L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V2M7 15h10" /><path d="M10 18h.01M14 19h.01" /></>,
    comms: <><circle cx="12" cy="7" r="1" /><path d="M8.5 3.5a5 5 0 0 0 0 7m7-7a5 5 0 0 1 0 7M5 1a9 9 0 0 0 0 12M19 1a9 9 0 0 1 0 12M12 9l-5 13m5-13 5 13M9 17h6" /></>,
    weather: <><circle cx="17" cy="5" r="3" /><path d="M17 0v1m5 4h1M21 1l-1 1M8 12a4 4 0 0 1 7-2 3 3 0 1 1 1 6H6a3 3 0 1 1 2-4M8 19l-1 3m6-3-1 3m6-3-1 3" /></>,
    moon: <><path d="M20 15A9 9 0 1 1 9 4a7 7 0 0 0 11 11z" /><circle cx="9" cy="13" r="1.5" /><circle cx="13" cy="18" r="1" /></>,
    mars: <><circle cx="12" cy="12" r="10" /><path d="m6 5 2 4-2 3 3 3-1 5M15 3l-2 4 3 3 4-1M15 15l3 1-1 4" /><circle cx="12" cy="13" r="1" /></>,
  };
  return <svg class="lobby-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
