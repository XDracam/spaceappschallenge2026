import { useEffect, useRef } from 'preact/hooks';
import { MapRenderer, type MapInsets } from './renderer';
import { usePlanner } from '../state/store';
import { COLORS } from './style';

export type { MapInsets };

interface Props {
  /**
   * CSS px of the map covered by floating UI on each side. The map still
   * draws full-bleed underneath, but fits and centres its default view, HUD
   * and tooltips inside the remaining free rectangle.
   */
  insets?: MapInsets;
}

/**
 * Interactive solar-system map. Fills its parent (which must be
 * `position: relative`). Reads the game/ui/clock stores directly and redraws
 * on change; writes view centre, selection, hover and popups to uiStore.
 */
export function MapCanvas({ insets }: Props) {
  const summary = usePlanner(game => `${game.mission.name}. ${game.plan.branches.length} route branch${game.plan.branches.length === 1 ? '' : 'es'}, ${game.plan.branches.reduce((n, branch) => n + branch.maneuvers.length, 0)} planned maneuvers. Use Next step and Edit route & mission tips for keyboard route controls; Rocket edits spacecraft and parts.`);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MapRenderer | null>(null);

  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return;
    const renderer = new MapRenderer(canvasRef.current, wrapRef.current);
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  const t = insets?.top ?? 0;
  const r = insets?.right ?? 0;
  const b = insets?.bottom ?? 0;
  const l = insets?.left ?? 0;
  useEffect(() => {
    rendererRef.current?.setInsets({ top: t, right: r, bottom: b, left: l });
  }, [t, r, b, l]);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: COLORS.bg }}>
      <canvas ref={canvasRef} role="img" aria-label={`Mission map. ${summary}`} style={{ display: 'block', touchAction: 'none', userSelect: 'none' }}>{summary}</canvas>
    </div>
  );
}
