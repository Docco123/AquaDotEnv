import { useId, type ReactNode } from 'react';
import { C } from '@/theme';
import type { IconProps } from './types';

/** 24×24 stroke-icon frame; icons inherit size/color from props. */
function Svg({ size = 20, color = C.text, strokeWidth = 1.75, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

/** Brand mark: a gradient droplet crossed by a wave. */
export function LogoMark({ size = 28 }: IconProps) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.gradient[0]} />
          <stop offset="0.55" stopColor={C.gradient[1]} />
          <stop offset="1" stopColor={C.gradient[2]} />
        </linearGradient>
      </defs>
      <path d="M16 2.5S5.5 13.6 5.5 20.3a10.5 10.5 0 0 0 21 0C26.5 13.6 16 2.5 16 2.5Z" fill={`url(#${gradientId})`} />
      <path d="M9.4 20.6c2.2-1.7 4.4-1.7 6.6 0s4.4 1.7 6.6 0" fill="none" stroke={C.surface} strokeWidth="2" strokeLinecap="round" />
      <path d="M11.5 25c1.5-1 3-1 4.5 0s3 1 4.5 0" fill="none" stroke={C.surface} strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const FlowNetworkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3c0 5 7 5 7 10v7M19 3c0 5-7 5-7 10M12 3v4" />
    <circle cx="12" cy="20.5" r="1.4" fill={p.color ?? C.text} />
  </Svg>
);

export const PermitIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h7l4 4v14H7z M14 3v4h4" />
    <path d="M10 14.5l1.8 1.8 3.2-3.8" />
  </Svg>
);

export const GaugeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 17a8 8 0 1 1 16 0M12 17l4-5" />
    <path d="M4 20h16" />
  </Svg>
);

export const BasinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8.5C7 4 13 2.5 17 5.5s4 9-1 12.5-11 2-12-3 1-6.5 1-6.5z" strokeDasharray="2.5 2.5" />
    <path d="M9 8c1.5 2 2 4 3 8M15 8.5c-1 2-2 4-3 7.5" />
  </Svg>
);

export const SpillIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
);

export const ImpairedIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M16 4l4 4M20 4l-4 4" />
  </Svg>
);

export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </Svg>
);

export const UtilityIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10h9a3 3 0 0 1 3 3v1M3 7v6M8 10V7M6 7h4" />
    <path d="M15 17.5c0 1.1-.7 2-1.5 2s-1.5-.9-1.5-2 1.5-3 1.5-3 1.5 1.9 1.5 3z" />
    <path d="M17 21h4M19 4v17" />
  </Svg>
);

export const LakeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11l4-5 3 3 2.5-2.5L17 11" />
    <path d="M3 15c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0M3 19c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
  </Svg>
);

export const FarmIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V10l6-4.5 6 4.5v10z" />
    <path d="M8 20v-5h4v5M16 13h5M16 16.5h5M16 20h5" />
  </Svg>
);

export const WellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 10l7-5 7 5M7 10v10h10V10M5 20h14" />
    <path d="M12 5v7M10.5 12h3v2.5h-3z" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
);
