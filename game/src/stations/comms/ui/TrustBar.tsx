import { useEffect, useRef, useState } from 'preact/hooks';
import type { StakeholderId } from '../model/types';
import { TRUST_STRAINED, TRUST_STRONG } from '../data/mission';
import { useComms } from './store';
import { SH, STAKEHOLDER_ORDER } from './common';
import { signed } from './format';

/**
 * What each trust band does, always visible under the meter (Rr001-12: it was only in a
 * hover tooltip). Same rules as state/world.ts passiveModifiers and the engine's poolWeight.
 */
const EFFECT: Record<StakeholderId, { strong: string; neutral: string; strained: string }> = {
  government: {
    strong: 'More funding offers, fewer cuts',
    neutral: `Above ${TRUST_STRONG}: more funding offers`,
    strained: 'Audits and budget cuts likelier',
  },
  industry: {
    strong: 'New orders −10 % price and lead time',
    neutral: `Above ${TRUST_STRONG}: orders −10 % price and time`,
    strained: 'New orders +10 % price and lead time',
  },
  public: {
    strong: 'Budget cuts from events halved',
    neutral: `Above ${TRUST_STRONG}: event budget cuts halved`,
    strained: 'Protests and scandals likelier',
  },
  partners: {
    strong: 'More partner deals offered',
    neutral: `Above ${TRUST_STRONG}: more partner deals`,
    strained: 'Fewer partner deals offered',
  },
};

function band(v: number): 'strong' | 'neutral' | 'strained' {
  return v < TRUST_STRAINED ? 'strained' : v > TRUST_STRONG ? 'strong' : 'neutral';
}

export function TrustBar() {
  return (
    <section class="trustbar glass">
      {STAKEHOLDER_ORDER.map((s) => <Meter key={s} id={s} />)}
    </section>
  );
}

/** Number that eases towards its target. */
function useTween(target: number, ms = 600): number {
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);
  const shownRef = useRef(target);
  shownRef.current = shown;
  useEffect(() => {
    fromRef.current = shownRef.current;
    if (fromRef.current === target) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(fromRef.current + (target - fromRef.current) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

function Meter({ id }: { id: StakeholderId }) {
  const value = useComms((s) => s.trust[id] ?? 0);
  const shown = useTween(value);
  const prev = useRef(value);
  const [flash, setFlash] = useState<{ d: number; k: number } | null>(null);
  useEffect(() => {
    const d = Math.round(value - prev.current);
    prev.current = value;
    if (d === 0) return;
    setFlash({ d, k: Date.now() });
    const t = setTimeout(() => setFlash(null), 1800);
    return () => clearTimeout(t);
  }, [value]);

  const meta = SH[id];
  const b = band(value);
  const barColor = b === 'strained' ? 'var(--err)' : meta.color;
  return (
    <div class={`meter ${b}`} style={{ '--c': meta.color } as Record<string, string>}>
      <div class="meter-row">
        <span class="label">{meta.label}</span>
        <span class="meter-state">{b === 'strong' ? 'strong' : b === 'strained' ? 'strained' : ''}</span>
        {flash && <span key={flash.k} class={`meter-delta ${flash.d > 0 ? 'up' : 'down'}`}>{signed(flash.d)}</span>}
        <span class="meter-val num" style={{ color: b === 'strained' ? 'var(--err)' : meta.color }}>{Math.round(shown)}</span>
      </div>
      <div class="tbar">
        <i style={{ width: `${Math.max(0, Math.min(100, shown))}%`, background: barColor }} />
        <span class="tick" style={{ left: `${TRUST_STRAINED}%` }} />
        <span class="tick" style={{ left: `${TRUST_STRONG}%` }} />
      </div>
      <div class={`meter-effect${b === 'neutral' ? '' : ' live'}`}>{EFFECT[id][b]}</div>
    </div>
  );
}
