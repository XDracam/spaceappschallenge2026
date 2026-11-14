import { useEffect, useRef, useState } from 'preact/hooks';
import type { StakeholderId } from '../model/types';
import { TRUST_STRAINED, TRUST_STRONG } from '../data/mission';
import { useComms } from './store';
import { passiveModifiers } from '../state/world';
import type { PassiveModifiers } from '../state/world';
import { SH, STAKEHOLDER_ORDER } from './common';
import { signed } from './format';

/** Passive effect of each trust band in plain words (README proposal). */
const PASSIVE: Record<StakeholderId, { strong: string; neutral: string; strained: string }> = {
  government: {
    strong: 'Strong government trust: budget reviews are more likely to add funding.',
    neutral: 'No passive effect. Above 70, budget reviews favour you; below 30, audits and cuts get likelier.',
    strained: 'Strained government trust: audits and budget cuts are likelier.',
  },
  industry: {
    strong: 'Strong industry trust: cheaper, faster deliveries (about −10 % price and delivery time).',
    neutral: 'No passive effect. Above 70, suppliers deliver cheaper and faster; below 30, slower and dearer.',
    strained: 'Strained industry trust: dearer, slower deliveries (about +10 % price and delivery time).',
  },
  public: {
    strong: 'Strong public trust: budget cuts are smaller and the press is on your side.',
    neutral: 'No passive effect. Above 70, budget cuts shrink; below 30, protests and scandals get likelier.',
    strained: 'Strained public trust: protests and press scandals are likelier.',
  },
  partners: {
    strong: 'Strong partner trust: more partner deals for parts, research and services are offered.',
    neutral: 'No passive effect. Above 70, partners offer more deals; below 30, they offer fewer.',
    strained: 'Strained partner trust: partners offer fewer deals.',
  },
};

/** Live passive effect in words, from the engine's passiveModifiers (null when neutral). */
function liveEffect(id: StakeholderId, pm: PassiveModifiers): string | null {
  switch (id) {
    case 'government':
      return pm.governmentFundingBonus === 1 ? null : `Now: funding opportunities ×${pm.governmentFundingBonus} as likely.`;
    case 'industry':
      return pm.procurementPricePct === 0 ? null
        : `Now: procurement prices ${signed(pm.procurementPricePct, ' %')}, delivery times ${signed(pm.procurementDeliveryPct, ' %')}.`;
    case 'public':
      return pm.budgetCutShieldPct === 0 ? null : `Now: budget cuts from events are ${pm.budgetCutShieldPct} % smaller.`;
    case 'partners':
      return pm.partnerDealsBonus === 1 ? null : `Now: partner deal offers ×${pm.partnerDealsBonus} as likely.`;
  }
}

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

  const trust = useComms((s) => s.trust);
  const live = liveEffect(id, passiveModifiers(trust));
  const meta = SH[id];
  const b = band(value);
  const barColor = b === 'strained' ? 'var(--err)' : meta.color;
  return (
    <div class={`meter ${b}`} tabIndex={0} style={{ '--c': meta.color } as Record<string, string>}>
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
      <div class="meter-tip glass strong" role="tooltip">
        <div class="label" style={{ color: meta.color }}>{meta.label} · {value}</div>
        <div>{PASSIVE[id][b]}</div>
        {live && <div class="tip-live">{live}</div>}
        <div class="muted tiny">Below {TRUST_STRAINED} strained · above {TRUST_STRONG} strong{b === 'strong' ? ' (also opens a third project slot)' : ''}</div>
      </div>
    </div>
  );
}
