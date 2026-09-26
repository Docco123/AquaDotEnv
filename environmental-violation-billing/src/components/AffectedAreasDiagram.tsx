import { useNavigate } from '@tanstack/react-router';
import { impacts } from '@/data/impacts';
import { impactTier } from '@/lib/impact';
import { useEnviroBill } from '@/hooks/useEnviroBillStore';
import type { ImpactTier } from '@/types/envirobill-impact';

/**
 * A hand-laid-out schematic. NOT A MAP: no mapping library, no tiles, no
 * geocoding, no GeoJSON, no coordinates. Marker placement comes from the
 * `schematic` layout hints in the seed data and means nothing geographically.
 */

const VIEW_W = 1000;
const VIEW_H = 420;

/** Each branch runs left-to-right and bends toward the shared trunk. */
const BRANCHES: Record<0 | 1 | 2, { x0: number; x1: number; y0: number; y1: number }> = {
  0: { x0: 60, x1: 640, y0: 80, y1: 210 },
  1: { x0: 60, x1: 640, y0: 210, y1: 210 },
  2: { x0: 60, x1: 640, y0: 340, y1: 210 },
};

const TIER_FILL: Record<ImpactTier, string> = {
  Severe: '#f43f5e',
  Moderate: '#f59e0b',
  Low: '#38bdf8',
};

function pointOn(branch: 0 | 1 | 2, position: number): { x: number; y: number } {
  const b = BRANCHES[branch];
  const t = Math.min(Math.max(position, 0), 100) / 100;
  return { x: b.x0 + (b.x1 - b.x0) * t, y: b.y0 + (b.y1 - b.y0) * t };
}

function branchPath(branch: 0 | 1 | 2): string {
  const b = BRANCHES[branch];
  const midX = (b.x0 + b.x1) / 2;
  return `M ${b.x0} ${b.y0} C ${midX} ${b.y0}, ${midX} ${b.y1}, ${b.x1} ${b.y1}`;
}

export function AffectedAreasDiagram() {
  const { violations } = useEnviroBill();
  const navigate = useNavigate();

  const markers = impacts
    .map((impact) => {
      const violation = violations.find((v) => v.id === impact.violation_id);
      if (!violation) return null;
      const tier = impactTier(impact);
      const { x, y } = pointOn(impact.schematic.branch, impact.schematic.position);
      return { impact, violation, tier, x, y };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Stylised diagram of seeded violation sites along three waterways flowing toward two downstream drinking-water intakes"
        className="w-full"
      >
        {/* Waterway branches */}
        {([0, 1, 2] as const).map((b) => (
          <path
            key={b}
            d={branchPath(b)}
            fill="none"
            stroke="#1e40af"
            strokeOpacity="0.55"
            strokeWidth="10"
            strokeLinecap="round"
          />
        ))}

        {/* Shared trunk toward the intakes */}
        <path
          d={`M 640 210 L 880 210`}
          fill="none"
          stroke="#1e40af"
          strokeOpacity="0.75"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Intakes */}
        <g>
          <rect x="860" y="120" width="26" height="26" rx="4" fill="#34d399" />
          <text x="896" y="140" fill="#a7f3d0" fontSize="18">
            Riverbend Municipal Intake
          </text>
          <line x1="873" y1="146" x2="873" y2="204" stroke="#34d399" strokeWidth="3" strokeDasharray="6 5" />
        </g>
        <g>
          <rect x="860" y="274" width="26" height="26" rx="4" fill="#34d399" />
          <text x="896" y="294" fill="#a7f3d0" fontSize="18">
            Westfield Community Well Field
          </text>
          <line x1="873" y1="274" x2="873" y2="216" stroke="#34d399" strokeWidth="3" strokeDasharray="6 5" />
        </g>

        {/* Site markers */}
        {markers.map((m) => (
          <g
            key={m.impact.violation_id}
            role="link"
            tabIndex={0}
            aria-label={`${m.violation.location} — ${m.tier} impact`}
            className="site-marker-group cursor-pointer"
            onClick={() =>
              navigate({
                to: '/violations/$violationId',
                params: { violationId: m.impact.violation_id },
              })
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                event.preventDefault();
                navigate({
                  to: '/violations/$violationId',
                  params: { violationId: m.impact.violation_id },
                });
              }
            }}
          >
            {/* Generous invisible hit area for pointer and focus. */}
            <circle cx={m.x} cy={m.y} r="26" fill="transparent" />
            <circle
              cx={m.x}
              cy={m.y}
              r="13"
              fill={TIER_FILL[m.tier]}
              stroke="#0f172a"
              strokeWidth="3"
              className="site-marker"
            />
            <text x={m.x} y={m.y - 22} fill="#e2e8f0" fontSize="16" textAnchor="middle">
              {m.violation.location}
            </text>
            <text x={m.x} y={m.y + 34} fill="#94a3b8" fontSize="14" textAnchor="middle">
              {m.tier}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-slate-300">
        {(['Severe', 'Moderate', 'Low'] as const).map((tier) => (
          <span key={tier} className="inline-flex items-center gap-2">
            <span
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: TIER_FILL[tier] }}
            />
            {tier} impact
          </span>
        ))}
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 rounded-[3px] bg-emerald-400" />
          Downstream drinking-water intake
        </span>
      </div>

      <p className="mt-5 text-base text-slate-300">
        Illustrative diagram — a stylised view of how the seeded sites relate to one another and
        to downstream intakes. It is not a map and carries no geographic data.
      </p>
    </div>
  );
}
