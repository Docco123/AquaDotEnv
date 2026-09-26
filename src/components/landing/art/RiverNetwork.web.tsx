import { C, COMPLIANCE } from '@/theme';
import { useHydrated } from '@/components/motion';

// Water flows top (upstream) → bottom-right pin (downstream). Paths are drawn upstream → downstream,
// so a decreasing stroke-dashoffset moves the dashes toward the pin.
const MAIN = 'M90 -10C110 50 70 110 130 150C180 185 215 195 220 235C225 270 240 285 262 300C285 318 305 335 320 360';
const TRIBUTARIES = [
  'M470 10C420 60 380 70 340 110C300 150 250 170 220 235',
  'M400 -10C395 30 370 70 340 110',
  'M-10 230C40 225 80 260 130 262C180 264 220 300 262 300',
  'M490 250C450 255 420 290 380 300C340 310 320 310 294 327',
  'M-10 70C30 80 60 130 130 150',
];
const CONTOURS = ['M-10 40C120 10 260 70 490 30', 'M-10 120C140 90 300 150 490 110', 'M-10 200C120 170 330 230 490 190'];
const DISCHARGERS = [
  { x: 95, y: 78, color: COMPLIANCE.ok.color },
  { x: 276, y: 163, color: COMPLIANCE.effluent.color, flagged: true },
  { x: 130, y: 262, color: COMPLIANCE.ok.color },
  { x: 380, y: 300, color: COMPLIANCE.violation.color },
  { x: 379, y: 50, color: COMPLIANCE.ok.color },
  { x: 49, y: 106, color: COMPLIANCE.nodata.color },
];
const PIN = { x: 320, y: 360 };

const CSS = `
.uw-rn .draw{stroke-dasharray:1;stroke-dashoffset:1}
.uw-rn.play .draw{animation:uw-draw 1.8s cubic-bezier(.65,0,.35,1) forwards}
.uw-rn .flow{stroke-dasharray:1 13;opacity:0;animation:uw-flow 1.4s linear infinite}
.uw-rn.play .flow{animation:uw-flow 1.4s linear infinite,uw-fade .6s 1.4s forwards}
.uw-rn .pulse{transform-box:fill-box;transform-origin:center;animation:uw-pulse 2.4s cubic-bezier(0,0,.2,1) infinite}
.uw-rn .dot{opacity:0}
.uw-rn.play .dot{animation:uw-fade .5s forwards}
@keyframes uw-draw{to{stroke-dashoffset:0}}
@keyframes uw-flow{to{stroke-dashoffset:-14}}
@keyframes uw-fade{to{opacity:1}}
@keyframes uw-pulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(3.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.uw-rn *{animation:none!important}.uw-rn .draw{stroke-dashoffset:0}.uw-rn .flow,.uw-rn .dot{opacity:1}}
`;

/** Decorative hero art: a stylized river network whose flow converges on a pulsing "your intake" pin. */
export function RiverNetwork() {
  const playing = useHydrated();
  return (
    <svg
      className={playing ? 'uw-rn play' : 'uw-rn'}
      viewBox="0 0 480 420"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <style>{CSS}</style>
      {CONTOURS.map((d) => (
        <path key={d} d={d} fill="none" stroke={C.line} strokeWidth={1} />
      ))}
      <path
        d="M-10 -10H490V250C440 330 370 372 320 376C250 370 150 320 -10 300Z"
        fill={`${C.primary}0a`}
        stroke={`${C.primary}40`}
        strokeDasharray="4 6"
      />
      {TRIBUTARIES.map((d, i) => (
        <g key={d}>
          <path className="draw" d={d} pathLength={1} fill="none" stroke={`${C.primary}55`} strokeWidth={3} strokeLinecap="round" style={{ animationDelay: `${i * 120}ms` }} />
          <path className="flow" d={d} fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}
      <path className="draw" d={MAIN} pathLength={1} fill="none" stroke={`${C.primary}66`} strokeWidth={6} strokeLinecap="round" />
      <path className="flow" d={MAIN} fill="none" stroke={C.primary} strokeWidth={3} strokeLinecap="round" />
      {DISCHARGERS.map((d, i) => (
        <g key={`${d.x}-${d.y}`} className="dot" style={{ animationDelay: `${900 + i * 110}ms` }}>
          {d.flagged && <circle cx={d.x} cy={d.y} r={11} fill="none" stroke={d.color} strokeOpacity={0.45} strokeWidth={1.5} />}
          <circle cx={d.x} cy={d.y} r={5.5} fill={d.color} stroke={C.surface} strokeWidth={2} />
        </g>
      ))}
      <circle className="pulse" cx={PIN.x} cy={PIN.y} r={9} fill={C.accent} />
      <path
        d={`M${PIN.x} ${PIN.y}C${PIN.x} ${PIN.y} ${PIN.x - 15} ${PIN.y - 17} ${PIN.x - 15} ${PIN.y - 29}A15 15 0 1 1 ${PIN.x + 15} ${PIN.y - 29}C${PIN.x + 15} ${PIN.y - 17} ${PIN.x} ${PIN.y} ${PIN.x} ${PIN.y}Z`}
        fill={C.accent}
        stroke={C.surface}
        strokeWidth={2}
      />
      <circle cx={PIN.x} cy={PIN.y - 29} r={5.5} fill={C.surface} />
      <g transform={`translate(${PIN.x + 22} ${PIN.y - 44})`}>
        <rect width={92} height={26} rx={13} fill={C.surface} stroke={C.line} />
        <text x={46} y={17} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={12} fontWeight={600} fill={C.text}>
          Your intake
        </text>
      </g>
    </svg>
  );
}
