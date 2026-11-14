import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { Science } from '../state/science';
import { ZOOMS } from '../state/science';
import type { FieldState, GraphNode } from '../model/types';
import { GRAPH, edgePath } from '../model/graph';
import { DISCIPLINES } from '../data/fields';
import { DisciplineOverview } from './DisciplineOverview';

const STATE_LABEL: Record<FieldState, string> = { est: 'Established', fr: 'Frontier', hint: 'Hinted', fog: 'Unknown' };

const WITHIN = edgePath(GRAPH, GRAPH.edges.filter((e) => e[2] === 0).map((e) => [e[0], e[1]]));
const CROSS = edgePath(GRAPH, GRAPH.edges.filter((e) => e[2] === 1).map((e) => [e[0], e[1]]));
const FOG = edgePath(GRAPH, GRAPH.edges.filter((e) => e[2] === 2).map((e) => [e[0], e[1]]));

function nodeStyle(n: GraphNode, o: { zoom: number; pill: boolean; selected: boolean; benched: boolean; related: boolean; dim: boolean }): JSX.CSSProperties {
  const col = DISCIPLINES[n.discipline].color;
  const detail = o.zoom >= 0.7;
  const s: JSX.CSSProperties = {
    position: 'absolute', left: `${n.x.toFixed(0)}px`, top: `${n.y.toFixed(0)}px`,
    transform: 'translate(-50%,-50%)' + (o.pill && !detail ? ` scale(${(1 / o.zoom).toFixed(3)})` : ''),
    boxSizing: 'border-box', cursor: 'pointer',
  };
  if (o.pill) {
    Object.assign(s, {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', height: '36px', padding: '0 12px',
      borderRadius: '18px', fontSize: '12.5px', fontWeight: 500, whiteSpace: 'nowrap', color: '#e6edf7',
      minWidth: n.state === 'fog' ? '44px' : undefined,
    });
  } else {
    Object.assign(s, { padding: 0, width: '34px', height: '34px', borderRadius: '50%' });
  }
  if (n.state === 'est') { s.background = o.pill ? '#1a2438' : col + '88'; s.border = `1px solid ${o.pill ? col + '77' : col + 'cc'}`; }
  if (n.state === 'fr') { s.background = '#121826'; s.border = `${o.pill ? 2 : 4}px solid ${col}`; s.boxShadow = `0 0 0 ${o.pill ? 5 : 8}px ${col}26`; }
  if (n.state === 'hint') { s.background = 'rgba(11,15,23,0.75)'; s.border = '2px dashed #7d8aa3'; }
  if (n.state === 'fog') { s.background = 'rgba(11,15,23,0.4)'; s.border = '2px dotted #4a5873'; s.color = '#8a97ad'; }
  if (o.selected) { s.outline = '2px solid #e6edf7'; s.outlineOffset = '4px'; s.zIndex = 5; }
  if (o.related) { s.outline = '2px dashed #f2b84b'; s.outlineOffset = '4px'; s.zIndex = 4; }
  if (o.benched) { s.outline = '3px solid #5fb3ff'; s.outlineOffset = '4px'; s.zIndex = 5; }
  if (o.dim) { s.opacity = 0.13; s.pointerEvents = 'none'; }
  return s;
}

export function FieldMap({ s }: { s: Science }) {
  const detail = s.zoom >= 0.7;
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the selected field in view, for example after opening a task.
  useEffect(() => {
    const el = scroller.current;
    const n = s.selected ? GRAPH.byId[s.selected] : null;
    if (!el || !n) return;
    el.scrollTo({ left: n.x * s.zoom - el.clientWidth / 2, top: n.y * s.zoom - el.clientHeight / 2, behavior: 'smooth' });
  }, [s.selected, s.zoom]);

  const related = new Set(s.activeTask?.fieldIds ?? []);

  const highlight = edgePath(GRAPH, GRAPH.edges.filter(([a, b]) => s.selected !== null && (a === s.selected || b === s.selected)).map(([a, b]) => [a, b]));
  const pairs: [string, string][] = [];
  for (let i = 0; i < s.bench.length; i++) for (let j = i + 1; j < s.bench.length; j++) pairs.push([s.bench[i], s.bench[j]]);
  const benchPath = edgePath(GRAPH, pairs);

  return (
    <main class="graph">
      <div class="toolbar">
        <span class="hint grow">Click a field to read about it. Click empty space to deselect.</span>
        <div class="seg" role="group" aria-label="Zoom">
          {ZOOMS.map((z) => (
            <button key={z.value} aria-pressed={s.zoom === z.value} class={s.zoom === z.value ? 'on' : ''} onClick={() => s.setZoom(z.value)}>
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <div class="viewport-wrap">
      {s.zoom === ZOOMS[0].value && <DisciplineOverview s={s} />}
      <div
        class="viewport"
        ref={scroller}
        onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) s.select(null); }}
      >
        <div style={{ position: 'relative', width: `${Math.round(GRAPH.width * s.zoom)}px`, height: `${Math.round(GRAPH.height * s.zoom)}px` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: `${GRAPH.width}px`, height: `${GRAPH.height}px`, transform: `scale(${s.zoom})`, transformOrigin: '0 0' }}>
            {GRAPH.titles.map((t) => (
              <div
                key={t.discipline}
                class="cluster-title"
                style={{ left: `${t.x.toFixed(0)}px`, top: `${t.y.toFixed(0)}px`, color: t.color, fontSize: detail ? '60px' : '72px', opacity: detail ? 0.1 : 0.24 }}
              >
                {t.name}
              </div>
            ))}
            <svg width={GRAPH.width} height={GRAPH.height} viewBox={`0 0 ${GRAPH.width} ${GRAPH.height}`} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
              <path d={CROSS} stroke="#2b3956" stroke-width="1.2" fill="none" vector-effect="non-scaling-stroke" />
              <path d={WITHIN} stroke="#34445f" stroke-width="1.6" fill="none" vector-effect="non-scaling-stroke" />
              <path d={FOG} stroke="#3b4a66" stroke-width="1.4" stroke-dasharray="2 5" fill="none" vector-effect="non-scaling-stroke" />
              <path d={highlight || 'M0,0'} stroke="#e6edf7" stroke-opacity="0.75" stroke-width="2.4" fill="none" vector-effect="non-scaling-stroke" />
              <path d={benchPath || 'M0,0'} stroke="#5fb3ff" stroke-width="3.2" stroke-dasharray="7 6" fill="none" vector-effect="non-scaling-stroke" />
            </svg>
            {GRAPH.nodes.map((n) => {
              const selected = n.id === s.selected;
              const benched = s.bench.includes(n.id);
              const dim = !!s.hidden[n.discipline];
              const isRelated = related.has(n.id);
              const pill = detail || selected || benched || isRelated;
              return (
                <button
                  key={n.id}
                  aria-pressed={selected || benched}
                  aria-label={`${n.label}, ${STATE_LABEL[n.state]} field in ${DISCIPLINES[n.discipline].name}`}
                  style={nodeStyle(n, { zoom: s.zoom, pill, selected, benched, related: isRelated, dim })}
                  onClick={() => s.select(n.id)}
                >
                  {pill && (
                    <>
                      <span class="dot" style={{ background: DISCIPLINES[n.discipline].color }} />
                      <span>{n.label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
