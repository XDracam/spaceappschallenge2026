import { useRef, useState } from 'preact/hooks';
import type { StatDef } from '../data/parts';
import { clamp, fmtNum } from './common';
import { statLabel } from './partInfo';

const RES = 1000;

export interface SliderScale {
  min: number;
  max: number;
  step: number;
  scale: 'linear' | 'log';
}

function toPos(s: SliderScale, v: number): number {
  if (s.max <= s.min) return 0;
  if (s.scale === 'log' && s.min > 0) return clamp(Math.log(v / s.min) / Math.log(s.max / s.min), 0, 1);
  return clamp((v - s.min) / (s.max - s.min), 0, 1);
}

function roundStep(v: number, step: number): number {
  if (!step) return v;
  return Number((Math.round(v / step) * step).toPrecision(12));
}

function fromPos(s: SliderScale, p: number): number {
  const raw = s.scale === 'log' && s.min > 0 ? s.min * Math.pow(s.max / s.min, p) : s.min + p * (s.max - s.min);
  return clamp(roundStep(raw, s.step), s.min, s.max);
}

function roundSig(v: number, digits: number): number {
  if (v === 0) return 0;
  return Number(v.toPrecision(digits));
}

/** One fine step: ±5 % on log sliders, about 1 % of the range on linear ones. */
function nudge(s: SliderScale, v: number, dir: 1 | -1): number {
  let next: number;
  if (s.scale === 'log') {
    next = roundStep(roundSig(v * (dir > 0 ? 1.05 : 1 / 1.05), 3), s.step);
  } else {
    const delta = s.step * Math.max(1, Math.round((s.max - s.min) / s.step / 100));
    next = roundStep(v + dir * delta, s.step);
  }
  if (next === v) next = roundStep(v + dir * s.step, s.step);
  return clamp(next, s.min, s.max);
}

/** Range slider with linear or log scale, an optional research-limit tick and shading beyond it. */
export function Slider(props: SliderScale & {
  value: number;
  onChange: (v: number) => void;
  limit?: number;
  disabled?: boolean;
  /** Extra markers (e.g. current value of something else). */
  title?: string;
}) {
  const { value, onChange, limit, disabled } = props;
  const pos = toPos(props, value);
  const limitPos = limit !== undefined ? toPos(props, limit) : undefined;
  const beyond = limit !== undefined && value > limit + 1e-9;
  return (
    <div class={`slider${disabled ? ' disabled' : ''}${beyond ? ' is-beyond' : ''}`} title={props.title}>
      <div class="slider-track">
        <div class="slider-fill" style={{ width: `${pos * 100}%` }} />
        {limitPos !== undefined && limitPos < 1 && (
          <div class="slider-beyond" style={{ left: `${limitPos * 100}%` }} />
        )}
        {limitPos !== undefined && <div class="slider-tick" style={{ left: `${limitPos * 100}%` }} />}
      </div>
      <input
        type="range" min={0} max={RES} step={1}
        value={Math.round(pos * RES)}
        disabled={disabled}
        onInput={(e) => onChange(fromPos(props, Number((e.currentTarget as HTMLInputElement).value) / RES))}
      />
    </div>
  );
}

/** Display number for a stat (performance-like 1–10 scores keep one decimal). */
function fmtDisplay(def: StatDef, v: number): string {
  return def.key === 'performance' ? v.toFixed(1) : fmtNum(v);
}

/** Editable number in display units; commits on Enter or blur. */
function NumberField({ value, factor, disabled, onCommit, label, format, onNudge }: {
  value: number; factor: number; disabled?: boolean; onCommit: (v: number) => void; label: string; format: (v: number) => string;
  onNudge?: (dir: 1 | -1) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  const shown = draft ?? format(value * factor).replace(/,/g, '');
  const commit = (text: string) => {
    const n = Number(text.replace(/,/g, '').trim());
    if (!Number.isFinite(n) || text.trim() === '' || text.trim() === format(value * factor).replace(/,/g, '')) return;
    onCommit(n / factor);
  };
  return (
    <input class="ss-input num" type="text" inputMode="decimal" value={shown} disabled={disabled} aria-label={label}
      onFocus={(e) => { setDraft(shown); (e.currentTarget as HTMLInputElement).select(); }}
      onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
      onBlur={(e) => { if (!cancelled.current) commit((e.currentTarget as HTMLInputElement).value); cancelled.current = false; setDraft(null); }}
      onKeyDown={(e) => {
        if (onNudge && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          setDraft(null);
          onNudge(e.key === 'ArrowUp' ? 1 : -1);
          return;
        }
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
        if (e.key === 'Escape') { cancelled.current = true; (e.currentTarget as HTMLInputElement).blur(); }
      }} />
  );
}

/** Research hint for a stat slider's tooltip (the yellow tick), or undefined without a research limit. */
export function researchHint(def: StatDef, value: number, limit: number | undefined): string | undefined {
  if (limit === undefined) return undefined;
  const f = def.displayFactor ?? 1;
  const unit = def.displayUnit ?? def.unit;
  const max = `${fmtDisplay(def, limit * f)}${unit ? ` ${unit}` : ''}`;
  return value > limit + 1e-9
    ? `Beyond current research (yellow tick: max researched ${max}). Procurement may pay more or get a less reliable part.`
    : `Yellow tick: max researched ${max}`;
}

/**
 * Compact stat value of a slider line: an editable number (click to type, Enter
 * to set, Escape to cancel; arrow keys nudge) and its unit.
 */
export function StatValue({ def, value, locked, beyond, onChange }: {
  def: StatDef;
  value: number;
  locked?: boolean;
  beyond?: boolean;
  onChange: (v: number) => void;
}) {
  const f = def.displayFactor ?? 1;
  const unit = def.displayUnit ?? def.unit;
  const set = (v: number) => onChange(clamp(roundStep(v, def.step), def.min, def.max));
  return (
    <span class={`sv${beyond ? ' sv-beyond' : ''}`}>
      <NumberField value={value} factor={f} disabled={locked} onCommit={set} label={statLabel(def)}
        format={(v) => fmtDisplay(def, v)} onNudge={(dir) => set(nudge(def, value, dir))} />
      {unit && <span class="sv-unit">{unit}</span>}
    </span>
  );
}
