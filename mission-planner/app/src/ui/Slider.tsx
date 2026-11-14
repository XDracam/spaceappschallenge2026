import type { StatDef } from '../data/parts';
import { LockIcon, clamp, fmtNum } from './common';

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

/** A part stat slider from a StatDef with label, readout, research tick and lock. */
export function StatSlider({ def, value, limit, locked, onChange }: {
  def: StatDef;
  value: number;
  limit?: number;
  locked?: boolean;
  onChange: (v: number) => void;
}) {
  const f = def.displayFactor ?? 1;
  const unit = def.displayUnit ?? def.unit;
  const beyond = limit !== undefined && value > limit + 1e-9;
  return (
    <div class="stat">
      <div class="stat-head">
        <span class="stat-label">
          {locked && <LockIcon title="Fixed by contract" />} {def.label}
        </span>
        <span class={`stat-value num${beyond ? ' beyond' : ''}`}>
          {fmtNum(value * f)}{unit ? ` ${unit}` : ''}
          {limit !== undefined && (
            <span class="stat-limit" title="Current research limit">
              {' '}/ {fmtNum(limit * f)}
            </span>
          )}
        </span>
      </div>
      <Slider min={def.min} max={def.max} step={def.step} scale={def.scale} value={value} limit={limit}
        disabled={locked} onChange={onChange}
        title={limit !== undefined ? `Research limit ${fmtNum(limit * f)} ${unit}. Values beyond it can be planned with.` : undefined} />
    </div>
  );
}
