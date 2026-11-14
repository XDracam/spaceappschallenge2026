import type { Discipline, Edge, Graph, GraphNode } from './types';
import { CROSS_LINKS, DISCIPLINES, FRONTIER_IDS, HINTED_IDS, UNKNOWN_FIELDS } from '../data/fields';

export const GRAPH_WIDTH = 2200;
export const GRAPH_HEIGHT = 1500;

const GOLDEN_ANGLE = 2.39996;

function makeNodes(): GraphNode[] {
  const nodes: GraphNode[] = [];
  (Object.keys(DISCIPLINES) as Discipline[]).forEach((d) => {
    const def = DISCIPLINES[d];
    def.fields.forEach((label, index) => {
      const id = def.prefix + (index + 1);
      const state = FRONTIER_IDS.includes(id) ? 'fr' : HINTED_IDS.includes(id) ? 'hint' : 'est';
      nodes.push({ id, label, discipline: d, index, state, w: 0, h: 36, x: 0, y: 0 });
    });
  });
  for (const u of UNKNOWN_FIELDS) {
    nodes.push({ id: u.id, label: '?', discipline: u.discipline, index: 99, state: 'fog', w: 0, h: 36, x: 0, y: 0 });
  }
  return nodes;
}

function makeEdges(): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const add = (a: string, b: string, kind: Edge[2]) => {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) return; // a cross link can repeat a link inside a discipline
    seen.add(key);
    edges.push([a, b, kind]);
  };
  (Object.keys(DISCIPLINES) as Discipline[]).forEach((d) => {
    const { prefix, fields } = DISCIPLINES[d];
    for (let k = 2; k <= fields.length; k++) {
      add(prefix + (k - 1), prefix + k, 0);
      if (k % 3 === 0 && k > 3) add(prefix + (k - 3), prefix + k, 0);
    }
  });
  for (const [a, b] of CROSS_LINKS) add(a, b, 1);
  for (const u of UNKNOWN_FIELDS) add(u.id, u.anchor, 2);
  return edges;
}

/**
 * Deterministic layout: a sunflower spiral per discipline, then edge springs and
 * rectangle collision passes. Runs once at load, so the map never moves between visits.
 */
function layout(nodes: GraphNode[], edges: Edge[], byId: Record<string, GraphNode>): void {
  for (const n of nodes) {
    const fog = n.state === 'fog';
    n.w = fog ? 44 : Math.round(40 + 6.6 * n.label.length);
    const c = DISCIPLINES[n.discipline];
    const k = fog ? 22 + (n.id.charCodeAt(1) % 5) : n.index;
    const ang = k * GOLDEN_ANGLE;
    const r = 58 * Math.sqrt(k + 0.6);
    n.x = c.cx + r * Math.cos(ang) * 1.55;
    n.y = c.cy + r * Math.sin(ang) * 0.95;
  }
  const clamp = (n: GraphNode) => {
    n.x = Math.max(n.w / 2 + 30, Math.min(GRAPH_WIDTH - n.w / 2 - 30, n.x));
    n.y = Math.max(60, Math.min(GRAPH_HEIGHT - 60, n.y));
  };
  const collide = (extra: number) => {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i], B = nodes[j];
        const ox = (A.w + B.w) / 2 + 14 - Math.abs(A.x - B.x);
        const oy = (A.h + B.h) / 2 + 10 - Math.abs(A.y - B.y);
        if (ox > 0 && oy > 0) {
          if (oy < ox) {
            const s = (A.y <= B.y ? 1 : -1) * (oy / 2 + extra);
            A.y -= s; B.y += s;
          } else {
            const s = (A.x <= B.x ? 1 : -1) * (ox / 2 + extra);
            A.x -= s; B.x += s;
          }
        }
      }
    }
  };
  for (let it = 0; it < 260; it++) {
    for (const [a, b, kind] of edges) {
      const A = byId[a], B = byId[b];
      const dx = B.x - A.x, dy = B.y - A.y;
      const d = Math.hypot(dx, dy) || 1;
      const target = kind === 0 ? 200 : 300;
      const f = ((d - target) / d) * 0.04 * (kind === 1 ? 0.35 : 1);
      A.x += dx * f; A.y += dy * f;
      B.x -= dx * f; B.y -= dy * f;
    }
    for (const n of nodes) {
      const c = DISCIPLINES[n.discipline];
      n.x += (c.cx - n.x) * 0.004;
      n.y += (c.cy - n.y) * 0.004;
    }
    collide(0);
    collide(0);
    nodes.forEach(clamp);
  }
  for (let it = 0; it < 400; it++) {
    collide(0.5);
    nodes.forEach(clamp);
  }
}

export function buildGraph(): Graph {
  const nodes = makeNodes();
  const byId: Record<string, GraphNode> = {};
  for (const n of nodes) byId[n.id] = n;
  const edges = makeEdges();
  layout(nodes, edges, byId);

  const adjacency: Record<string, string[]> = {};
  for (const n of nodes) adjacency[n.id] = [];
  for (const [a, b] of edges) {
    adjacency[a].push(b);
    adjacency[b].push(a);
  }
  const titles = (Object.keys(DISCIPLINES) as Discipline[]).map((discipline) => {
    const mine = nodes.filter((n) => n.discipline === discipline && n.state !== 'fog');
    return {
      discipline,
      name: DISCIPLINES[discipline].name,
      color: DISCIPLINES[discipline].color,
      x: mine.reduce((s, n) => s + n.x, 0) / mine.length,
      y: mine.reduce((s, n) => s + n.y, 0) / mine.length,
    };
  });
  return { width: GRAPH_WIDTH, height: GRAPH_HEIGHT, nodes, byId, edges, adjacency, titles };
}

/** Built once; the graph is static content in this prototype. */
export const GRAPH: Graph = buildGraph();

/** SVG path data for a set of edges. */
export function edgePath(graph: Graph, pairs: Iterable<[string, string]>): string {
  let d = '';
  for (const [a, b] of pairs) {
    const A = graph.byId[a], B = graph.byId[b];
    d += `M${A.x.toFixed(0)},${A.y.toFixed(0)} L${B.x.toFixed(0)},${B.y.toFixed(0)} `;
  }
  return d;
}
