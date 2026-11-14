// Embedded SVG artwork (ported from procurement/mockups, tinted to the planner palette).
import type { PartKind } from '../../../core/model';

export function ArtDefs() {
  return (
    <svg class="pr-symbols" aria-hidden="true">
      <defs>
        <linearGradient id="pr-metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#7f97b0" /><stop offset=".45" stop-color="#d3e0ee" /><stop offset="1" stop-color="#5f7690" /></linearGradient>
        <linearGradient id="pr-nozzle" x1="0" x2="1"><stop stop-color="#243a52" /><stop offset=".5" stop-color="#6c8aa8" /><stop offset="1" stop-color="#1f3348" /></linearGradient>
        <symbol id="pr-art-engine" viewBox="0 0 300 180"><ellipse cx="170" cy="161" rx="80" ry="10" fill="#3fc7ff" opacity=".12" /><path d="M145 61h47l-3 29h-41z" fill="url(#pr-metal)" /><path d="M150 88c0 25-16 38-35 65h106c-17-26-33-40-33-65z" fill="url(#pr-nozzle)" /><ellipse cx="168" cy="153" rx="53" ry="11" fill="#22405a" /><ellipse cx="168" cy="151" rx="40" ry="5" fill="#0c1a2a" /><rect x="143" y="45" width="52" height="24" rx="6" fill="#a9bccf" /><path d="M153 43V29h30v15m-39 6-16-7v34l18 10m50-34 17-13v42l-20 9" fill="none" stroke="#45627f" stroke-width="7" /><circle cx="133" cy="46" r="12" fill="#86a0b8" /><path d="M143 92h51m-57 10h62m-68 12h74m-82 13h90m-98 14h106" stroke="#8ea7c0" stroke-width="2" opacity=".55" /><path d="M176 27h22v18" fill="none" stroke="#3fc7ff" stroke-width="5" /></symbol>
        <symbol id="pr-art-tank" viewBox="0 0 300 180"><ellipse cx="160" cy="162" rx="70" ry="9" fill="#3fc7ff" opacity=".12" /><rect x="112" y="40" width="96" height="112" rx="10" fill="url(#pr-metal)" /><ellipse cx="160" cy="40" rx="48" ry="16" fill="#c4d4e4" /><ellipse cx="160" cy="152" rx="48" ry="12" fill="#5f7690" /><path d="M112 75h96M112 118h96" stroke="#5c7690" stroke-width="3" /><rect x="150" y="18" width="20" height="12" rx="3" fill="#45627f" /><path d="M126 60v80" stroke="#3fc7ff" stroke-width="3" opacity=".7" /></symbol>
        <symbol id="pr-art-camera" viewBox="0 0 300 180"><ellipse cx="174" cy="155" rx="93" ry="10" fill="#3fc7ff" opacity=".12" /><path d="m96 50 99-18 49 34-99 21z" fill="#c4d2e0" /><path d="M96 50v88l49 30V87z" fill="#5f7a96" /><path d="m145 87 99-21v78l-99 24z" fill="#9db1c6" /><ellipse cx="197" cy="112" rx="33" ry="34" fill="#38566f" /><ellipse cx="197" cy="112" rx="25" ry="27" fill="#1a3046" /><ellipse cx="197" cy="112" rx="17" ry="19" fill="#2f6c8f" /><ellipse cx="191" cy="106" rx="7" ry="8" fill="#9fdcff" opacity=".7" /><path d="m102 67 32 20v19l-32-19zm0 31 32 20v18l-32-19z" fill="#d6b56b" /></symbol>
        <symbol id="pr-art-lab" viewBox="0 0 300 180"><ellipse cx="169" cy="155" rx="95" ry="10" fill="#3fc7ff" opacity=".12" /><path d="M101 76h129v73H101z" fill="url(#pr-metal)" /><path d="M101 76 82 58h128l20 18z" fill="#b8c8d8" /><rect x="114" y="92" width="50" height="34" rx="3" fill="#1f3a52" /><path d="M121 113h11l8-13 7 17 10-8" fill="none" stroke="#3fe0a0" stroke-width="2" /><circle cx="201" cy="107" r="11" fill="#3a5670" /><path d="M119 58V32h15v26m21 0V24h15v34m20 0V38h13v20" fill="#a9bccf" stroke="#5f7a96" stroke-width="2" /></symbol>
        <symbol id="pr-art-panel" viewBox="0 0 300 180"><ellipse cx="165" cy="157" rx="105" ry="11" fill="#3fc7ff" opacity=".12" /><path d="m75 61 145-29 35 72-145 32z" fill="#1f4a6b" stroke="#6f8ea8" stroke-width="5" /><path d="m96 57 34 74m-7-78 34 73m-6-79 34 74m-7-79 34 73m-130-30 146-30m-135 53 145-31" stroke="#6fb6e0" stroke-width="1.5" /><path d="m157 130 16 31m-46 0h91" stroke="#5f7a96" stroke-width="6" /></symbol>
        <symbol id="pr-art-rtg" viewBox="0 0 300 180"><ellipse cx="160" cy="160" rx="70" ry="9" fill="#3fc7ff" opacity=".12" /><rect x="140" y="40" width="40" height="115" rx="8" fill="url(#pr-metal)" /><path d="M140 55l-30 8v70l30 8m40-86 30 8v70l-30 8" fill="#5f7a96" stroke="#45627f" stroke-width="3" /><circle cx="160" cy="97" r="11" fill="#ffc857" opacity=".85" /><path d="M160 86v22M149 97h22" stroke="#7a5a10" stroke-width="2" /></symbol>
        <symbol id="pr-art-antenna" viewBox="0 0 300 180"><ellipse cx="160" cy="162" rx="70" ry="9" fill="#3fc7ff" opacity=".12" /><path d="M90 50c20 70 120 90 150 30z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="3" /><path d="M165 95 200 40" stroke="#45627f" stroke-width="4" /><circle cx="202" cy="37" r="7" fill="#3fc7ff" /><path d="M160 105v50m-30 0h60" stroke="#5f7a96" stroke-width="7" /></symbol>
        <symbol id="pr-art-legs" viewBox="0 0 300 180"><ellipse cx="160" cy="160" rx="100" ry="9" fill="#3fc7ff" opacity=".12" /><rect x="120" y="40" width="80" height="50" rx="8" fill="url(#pr-metal)" /><path d="M125 85 80 150m115-65 45 65M140 90l-12 62m52-62 12 62" stroke="#5f7a96" stroke-width="6" /><path d="M66 152h28m132 0h28m-136 2h20m42 0h20" stroke="#a9bccf" stroke-width="6" stroke-linecap="round" /></symbol>
        <symbol id="pr-art-shield" viewBox="0 0 300 180"><ellipse cx="160" cy="158" rx="100" ry="10" fill="#3fc7ff" opacity=".12" /><path d="M60 120c30-80 170-80 200 0z" fill="#8a5a3c" /><path d="M72 118c30-66 146-66 176 0" fill="none" stroke="#c48a5a" stroke-width="5" /><path d="M60 120h200l-12 18H72z" fill="#45627f" /></symbol>
        <symbol id="pr-art-vault" viewBox="0 0 300 180"><ellipse cx="174" cy="156" rx="97" ry="10" fill="#3fc7ff" opacity=".12" /><path d="m87 75 88-39 84 37-87 42z" fill="#b4c4d4" /><path d="M96 82v55l76 33v-55zm76 33 76-36v54l-76 37z" fill="#5f7a96" /><path d="M172 115v55l76-37V79z" fill="#8ea7c0" /><path d="m112 87 61-27 55 24-57 26z" fill="#2c4a66" /><path d="m116 117 42 18m27-1 42-19" stroke="#3fc7ff" stroke-width="3" opacity=".6" /></symbol>
      </defs>
    </svg>
  );
}

export function artFor(kind: PartKind, variant: string): string {
  switch (kind) {
    case 'engine': return 'engine';
    case 'tank': return 'tank';
    case 'instrument': return variant === 'surfaceLab' ? 'lab' : 'camera';
    case 'power': return variant === 'rtg' ? 'rtg' : 'panel';
    case 'antenna': return 'antenna';
    case 'legs': return 'legs';
    case 'heatShield': return 'shield';
    default: return 'vault';
  }
}

export function Art({ kind, variant, label }: { kind: PartKind; variant: string; label?: string }) {
  return (
    <svg class="pr-asset" viewBox="0 0 300 180" role="img" aria-label={label ?? `${kind} illustration`}>
      <use href={`#pr-art-${artFor(kind, variant)}`} />
    </svg>
  );
}
