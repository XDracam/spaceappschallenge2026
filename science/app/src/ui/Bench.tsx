import { Fragment } from 'preact';
import type { Science } from '../state/science';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';
import { MAX_BENCH } from '../model/combine';

const ODDS_COLOR = { Good: '#4cc38a', Medium: '#f2b84b', 'Long shot': '#ff8a5d' } as const;

export function Bench({ s }: { s: Science }) {
  const canCombine = s.bench.length >= 2;
  const r = s.result;
  return (
    <section class="bench" aria-label="Combination bench">
      <div class="bench-left">
        <div class="row baseline">
          <h2 class="bench-title">Combination bench</h2>
          <span class="muted small">pick two or three fields and see what they make</span>
        </div>
        <div class="row wrap">
          {Array.from({ length: MAX_BENCH }, (_, i) => {
            const id = s.bench[i];
            return (
              <Fragment key={i}>
                {i > 0 && <span class="plus" aria-hidden="true">+</span>}
                {id ? (
                  <div class="slot filled">
                    <span class="dot" style={{ background: DISCIPLINES[GRAPH.byId[id].discipline].color }} />
                    <span class="ellipsis grow">{GRAPH.byId[id].label}</span>
                    <button class="x" aria-label={`Remove ${GRAPH.byId[id].label} from bench`} onClick={() => s.removeFromBench(id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a97ad" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                ) : (
                  <div class="slot empty">{i < 2 ? 'Pick a field' : 'Optional third'}</div>
                )}
              </Fragment>
            );
          })}
        </div>
        <div class="row wrap">
          <button class={'combine' + (canCombine ? ' ready' : '')} disabled={!canCombine} onClick={s.runCombine}>Combine</button>
          <button class="ghost" onClick={s.clearBench}>Clear bench</button>
          <span class="muted small">
            {s.bench.length < 2 ? 'Needs at least two fields' : s.bench.length === 2 ? 'Add a third for a rarer result' : 'Three-way combinations are rare'}
          </span>
        </div>
      </div>

      <div class="bench-mid">
        {!r && (
          <div class="result empty">
            <div class="strong">Nothing combined yet</div>
            <div>Select a field on the map, press Add to bench in the details pane, then press Combine.</div>
          </div>
        )}
        {r?.kind === 'recipe' && (
          <div class="result recipe">
            <div class="row baseline wrap">
              <span class="eyebrow green">New project idea</span>
              <span class="muted small">{r.names}</span>
            </div>
            <div class="result-title">{r.recipe.title}</div>
            <div class="soft">{r.recipe.pitch}</div>
            <div class="facts">
              <span class="muted">Method</span><span>{r.recipe.method}</span>
              <span class="muted">Needs</span><span>{r.recipe.needs}</span>
              <span class="muted">Time</span><span class="mono">{r.recipe.time}</span>
              <span class="muted">Odds</span><span class="strong" style={{ color: ODDS_COLOR[r.recipe.odds] }}>{r.recipe.odds}</span>
            </div>
            <button class="primary" onClick={s.openDraft}>Draft this project →</button>
          </div>
        )}
        {r?.kind === 'known' && (
          <div class="result known">
            <span class="eyebrow">Textbook territory</span>
            <div class="muted small">{r.names}</div>
            <div class="soft">Your group already knows how these fit together. No new project here. Try pairing one of them with a frontier field.</div>
          </div>
        )}
        {r?.kind === 'none' && (
          <div class="result none">
            <span class="eyebrow orange">No obvious link</span>
            <div class="muted small">{r.names}</div>
            <div class="soft">Nobody has seen these together. You can still draft it as a long shot: cheap to start, very unlikely to pay off.</div>
            <button class="outline-orange" onClick={s.openDraft}>Draft as a long shot</button>
          </div>
        )}
      </div>

    </section>
  );
}
