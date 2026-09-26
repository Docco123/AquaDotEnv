import { Text } from 'react-native';
import { C } from '@/theme';

// Native fallback: the app is web-only; icons.web.tsx holds the inline SVGs.
export interface ChatIconProps {
  size?: number;
  color?: string;
}

const glyph = (char: string) =>
  function Glyph({ size = 18, color = C.text }: ChatIconProps) {
    return <Text style={{ fontSize: size, lineHeight: size + 2, color }}>{char}</Text>;
  };

export const ChatBubbleIcon = (_: ChatIconProps) => null;
export const ArrowUpIcon = glyph('↑');
export const StopIcon = glyph('■');
export const CloseIcon = glyph('×');
