import type { ComponentType } from 'react';
import type { IconProps } from './types';

// Native fallback: the landing page is web-only; icons.web.tsx holds the real inline SVGs.
const Empty: ComponentType<IconProps> = () => null;

export const LogoMark = Empty;
export const ArrowRightIcon = Empty;
export const FlowNetworkIcon = Empty;
export const PermitIcon = Empty;
export const GaugeIcon = Empty;
export const BasinIcon = Empty;
export const SpillIcon = Empty;
export const ImpairedIcon = Empty;
export const BellIcon = Empty;
export const UtilityIcon = Empty;
export const LakeIcon = Empty;
export const FarmIcon = Empty;
export const WellIcon = Empty;
export const PinIcon = Empty;
