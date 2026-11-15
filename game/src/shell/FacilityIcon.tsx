// Hand-drawn line icons for the research facilities and teams (D-032). Original artwork, 64×64 grid,
// `currentColor` strokes with one accent colour (`--fi-accent`, default amber). Used by Procurement and Science.
import type { ComponentChildren } from 'preact';

const A = 'var(--fi-accent, #f2c14e)';

const ICONS: Record<string, ComponentChildren> = {
  'test-stand': <>
    <path d="M10 56h44M16 56V14M48 56V14M16 14h32" />
    <path d="M26 20h12l4 16H22z" />
    <path d="M24 36h16" />
    <path d="M27 40q5 14 10 0" stroke={A} />
    <path d="M30 40q2 8 4 0" stroke={A} />
  </>,
  'cryo-plant': <>
    <rect x="14" y="14" width="26" height="40" rx="12" />
    <path d="M14 30h26M14 38h26" />
    <path d="M40 22h8q4 0 4 4v16" />
    <path d="M52 42v6" />
    <g stroke={A}><path d="M50 10v10M45 15h10M46.5 11.5l7 7M53.5 11.5l-7 7" /></g>
  </>,
  'vacuum-chamber': <>
    <circle cx="28" cy="34" r="20" />
    <circle cx="28" cy="34" r="12" strokeDasharray="3 4" />
    <path d="M48 34h10M58 28v12" />
    <circle cx="48" cy="12" r="7" />
    <path d="M48 12l3-4" stroke={A} />
    <path d="M44 18q-8 4-10 8" />
  </>,
  'solar-simulator': <>
    <g stroke={A}><circle cx="32" cy="16" r="6" /><path d="M32 4v3M20 16h3M41 16h3M23.500 7.500l2 2M40.500 7.500l-2 2" /></g>
    <path d="M14 30h36l6 24H8z" />
    <path d="M22 30l-3 24M32 30v24M42 30l3 24M11 42h42" />
  </>,
  'hot-cell': <>
    <rect x="8" y="10" width="48" height="44" rx="3" />
    <rect x="14" y="16" width="36" height="22" rx="2" />
    <g stroke={A}><circle cx="32" cy="27" r="2" />
      <path d="M32 25.500l-5-8M28 31l-9 0.500M36 31l9 0.500" /></g>
    <path d="M18 46h8M38 46h8" />
  </>,
  'clean-room': <>
    <path d="M8 12h48v8H8z" />
    <path d="M14 12v8M22 12v8M30 12v8M38 12v8M46 12v8" />
    <g stroke={A}><path d="M18 26v14M18 40l-3-4M18 40l3-4M32 26v14M32 40l-3-4M32 40l3-4M46 26v14M46 40l-3-4M46 40l3-4" /></g>
    <path d="M8 54h48" />
    <circle cx="32" cy="45" r="3" /><path d="M32 48v6" />
  </>,
  'optical-bench': <>
    <path d="M6 48h52M10 48v6M54 48v6" />
    <path d="M14 38h8v10h-8z" />
    <path d="M32 24q-8 10 0 20q8-10 0-20z" />
    <path d="M46 36h8v12h-8z" />
    <g stroke={A}><path d="M22 41h6M36 41h6l4 -2M36 41l10 3" /><path d="M22 41h4" /></g>
  </>,
  'radar-range': <>
    <path d="M10 52h26" />
    <path d="M12 44q4-18 24-20" />
    <path d="M12 44h24" />
    <path d="M24 44v8" />
    <path d="M30 22l-4 6" />
    <g stroke={A}><path d="M40 28q8 4 4 14M45 22q14 8 8 26" /></g>
    <path d="M52 52V36M48 36h8" />
  </>,
  'rf-chamber': <>
    <rect x="8" y="10" width="48" height="44" rx="3" />
    <path d="M8 24l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6M8 54l0 0" />
    <path d="M8 48l6 6M20 48l6 6M32 48l6 6M44 48l6 6" />
    <path d="M32 30v14" /><path d="M26 34l6-4 6 4" />
    <g stroke={A}><path d="M22 36q-4 3 0 6M42 36q4 3 0 6" /></g>
  </>,
  'ground-dish': <>
    <path d="M10 28q4 22 26 22" />
    <path d="M10 28l26 22" />
    <path d="M22 32l8-12" />
    <circle cx="31" cy="18" r="2.500" stroke={A} />
    <path d="M36 50v6M26 56h20" />
    <g stroke={A}><path d="M44 16q6 4 6 12M50 10q10 6 10 18" /></g>
  </>,
  irradiation: <>
    <rect x="6" y="24" width="14" height="16" rx="2" />
    <path d="M20 29h6M20 35h6" />
    <g stroke={A}><path d="M28 32h14" strokeDasharray="3 3" /><circle cx="30" cy="32" r="1.500" /><path d="M38 28l4 4-4 4" /></g>
    <rect x="46" y="16" width="10" height="32" rx="2" />
    <path d="M46 26h10M46 38h10" />
  </>,
  'arc-jet': <>
    <path d="M6 24h30l12 8-12 8H6z" />
    <path d="M10 24v16M16 24v16" />
    <g stroke={A}><path d="M14 32l5-4 5 8 5-8 5 8" /></g>
    <path d="M48 32h10" />
    <g stroke={A}><path d="M50 26l6 2M50 38l6-2" /></g>
  </>,
  'team-6': <>
    <circle cx="32" cy="20" r="8" /><path d="M16 54q0-18 16-18t16 18z" />
    <g stroke={A}><circle cx="50" cy="14" r="7" /><path d="M50 10v4l3 2" /></g>
  </>,
  'team-12': <>
    <circle cx="24" cy="22" r="7" /><path d="M10 54q0-16 14-16t14 16z" />
    <circle cx="42" cy="26" r="6" /><path d="M36 40q10-4 18 14" />
    <g stroke={A}><circle cx="50" cy="12" r="7" /><path d="M50 8v4l3 2" /></g>
  </>,
  'team-perm': <>
    <circle cx="20" cy="22" r="6" /><path d="M8 52q0-14 12-14t12 14z" />
    <circle cx="44" cy="22" r="6" /><path d="M32 52q0-14 12-14t12 14z" />
    <g stroke={A}><path d="M22 10l10-6 10 6v6H22z" /><path d="M32 12v2" /></g>
  </>,
};

export function FacilityIcon({ id, size = 68, class: cls }: { id: string; size?: number; class?: string }) {
  const g = ICONS[id];
  if (!g) return null;
  return (
    <svg class={`facility-icon ${cls ?? ''}`} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor"
      stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false">
      {g}
    </svg>
  );
}
