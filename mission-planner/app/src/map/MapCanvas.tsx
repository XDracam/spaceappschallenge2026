import { useEffect, useRef } from 'preact/hooks';
import { MapRenderer } from './renderer';

/**
 * Interactive solar-system map. Fills its parent (which must be
 * `position: relative`). Reads the game/ui/clock stores directly and redraws
 * on change; writes view centre, selection, hover and popups to uiStore.
 */
export function MapCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return;
    const renderer = new MapRenderer(canvasRef.current, wrapRef.current);
    return () => renderer.destroy();
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b0f17' }}>
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none', userSelect: 'none' }} />
    </div>
  );
}
