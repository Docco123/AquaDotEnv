import type { ReactNode } from 'react';
import { C } from '@/theme';

export interface ChatIconProps {
  size?: number;
  color?: string;
}

function Svg({ size = 18, color = C.text, fill = 'none', children }: ChatIconProps & { fill?: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

export const ChatBubbleIcon = (p: ChatIconProps) => (
  <Svg {...p}>
    <path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4.5 19.5l1.3-4.2A7.5 7.5 0 1 1 20 11.5z" />
  </Svg>
);

export const ArrowUpIcon = (p: ChatIconProps) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);

export const StopIcon = ({ size = 12, color = C.text }: ChatIconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="1" y="1" width="10" height="10" rx="2" fill={color} />
  </svg>
);

export const CloseIcon = (p: ChatIconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
