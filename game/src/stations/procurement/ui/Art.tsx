// Shared catalogue and inspector artwork, grouped by hardware family.
import type { PartKind } from '../../../core/model';
import { PropulsionArtDefs } from './art/PropulsionArt';
import { InstrumentsArtDefs } from './art/InstrumentsArt';
import { StructuresArtDefs } from './art/StructuresArt';

export function ArtDefs() {
  return (
    <svg class="pr-symbols" aria-hidden="true">
      <defs>
        <linearGradient id="pr-metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#7f97b0" /><stop offset=".45" stop-color="#d3e0ee" /><stop offset="1" stop-color="#5f7690" /></linearGradient>
        <linearGradient id="pr-nozzle" x1="0" x2="1"><stop stop-color="#243a52" /><stop offset=".5" stop-color="#6c8aa8" /><stop offset="1" stop-color="#1f3348" /></linearGradient>
        <PropulsionArtDefs />
        <InstrumentsArtDefs />
        <StructuresArtDefs />
      </defs>
    </svg>
  );
}

export function artFor(kind: PartKind, variant: string): string {
  switch (kind) {
    case 'engine': return ['solid', 'hydrolox', 'hypergolic', 'ion'].includes(variant) ? `engine-${variant}` : 'engine';
    case 'tank': return ['solid', 'hydrolox', 'hypergolic', 'ion'].includes(variant) ? `tank-${variant}` : 'tank';
    case 'instrument':
      if (variant === 'surfaceLab') return 'lab';
      return variant === 'spectrometer' || variant === 'radar' ? variant : 'camera';
    case 'power': return variant === 'rtg' ? 'rtg' : 'panel';
    case 'antenna': return 'antenna';
    case 'legs': return 'legs';
    case 'heatShield': return 'shield';
    case 'radShield': return 'vault';
    case 'heatProtection': return 'thermal';
  }
}

export function Art({ kind, variant, label }: { kind: PartKind; variant: string; label?: string }) {
  return (
    <svg class="pr-asset" viewBox="0 0 300 180" role="img" aria-label={label ?? `${kind} illustration`}>
      <use href={`#pr-art-${artFor(kind, variant)}`} />
    </svg>
  );
}
