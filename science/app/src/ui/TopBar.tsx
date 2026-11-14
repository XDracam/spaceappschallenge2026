import { GRAPH } from '../model/graph';

const real = GRAPH.nodes.filter((n) => n.state !== 'fog');
const established = real.filter((n) => n.state === 'est').length;
const frontier = real.filter((n) => n.state === 'fr').length;

/** The pills and the launch and budget figures are placeholders until the stations are connected. */
export function TopBar() {
  return (
    <header class="topbar">
      <div class="row">
        <span class="badge">SCIENCE</span>
        <span class="topbar-title">Research field map</span>
      </div>
      <div class="stats">
        <span>Role <strong>Principal investigator</strong></span>
        <span>
          Knowledge base <strong class="mono">{real.length}</strong> fields · <strong class="mono">{established}</strong> established ·{' '}
          <strong class="mono">{frontier}</strong> at the frontier
        </span>
        <span>Launch in <strong class="mono">286 d</strong></span>
        <span>Research budget <strong class="mono">3.1 / 4.2 M</strong></span>
      </div>
      <div class="grow" />
      <div class="row">
        <span class="chip-static">Planning <span class="count blue">1</span></span>
        <span class="chip-static">Procurement <span class="count blue">2</span></span>
        <span class="chip-static">Comms <span class="count amber">1</span></span>
      </div>
    </header>
  );
}
