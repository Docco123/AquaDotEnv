import { alpha, boxShadow } from '@/components/ui/color';
import { C, FONT, RADIUS, SHADOW } from '@/theme';

const STYLE_ID = 'uw-map-styles';

/** Map chrome, animated flow lines, the pulsing pin and tooltips. Colors come from theme tokens. */
const CSS = `
.leaflet-container { font-family: ${FONT.sans}; background: ${C.surfaceAlt}; }
.leaflet-bar, .leaflet-control-layers { border: 1px solid ${C.line} !important; border-radius: ${RADIUS.sm}px !important; box-shadow: ${boxShadow(SHADOW.card)} !important; }
.leaflet-bar a { color: ${C.text}; }
.leaflet-control-layers-expanded { padding: 8px 12px; font-size: 12px; color: ${C.text}; }
.leaflet-control-scale-line { border-color: ${C.muted}; color: ${C.muted}; background: ${alpha(C.surface, 0.8)}; }

@keyframes uw-flow { from { stroke-dashoffset: 28; } to { stroke-dashoffset: 0; } }
.uw-flow { stroke-dasharray: 4 10; animation: uw-flow 1.4s linear infinite; }

@keyframes uw-pulse { 0% { transform: scale(0.35); opacity: 0.9; } 100% { transform: scale(1.5); opacity: 0; } }
.uw-pin { background: none; border: 0; }
.uw-pin-ring { position: absolute; inset: 0; border-radius: 50%; background: ${alpha(C.accent, 0.35)}; animation: uw-pulse 1.8s ease-out infinite; }
.uw-pin-dot { position: absolute; left: 50%; top: 50%; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%;
  background: ${C.accent}; border: 3px solid ${C.surface}; box-shadow: 0 2px 6px ${alpha(C.text, 0.35)}; }

.uw-tip { font: 12px/1.4 ${FONT.sans}; color: ${C.text}; background: ${C.surface}; border: 1px solid ${C.line};
  border-radius: ${RADIUS.sm}px; box-shadow: ${boxShadow(SHADOW.float)}; padding: 7px 10px; max-width: 280px; white-space: normal; }
.uw-tip::before { display: none; }
.uw-tip-name { font-weight: 600; margin-bottom: 2px; }
.uw-tip-meta { color: ${C.muted}; font-variant-numeric: tabular-nums; }
.uw-tip-risk { font-weight: 600; }

@media (prefers-reduced-motion: reduce) { .uw-flow, .uw-pin-ring { animation: none; } }
`;

/** Injects the map stylesheet once per document. */
export function injectMapStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}
