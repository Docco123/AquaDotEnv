import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { C } from '@/theme';
import { webTextStyle } from './webStyle';

type GradientTextProps = {
  children: ReactNode;
  colors?: readonly string[];
  /** CSS gradient angle in degrees. */
  angle?: number;
  style?: StyleProp<TextStyle>;
};

/** Web-only gradient-filled text (background-clip: text). Nest inside another <Text> for inline use. */
export function GradientText({ children, colors = C.gradient, angle = 100, style }: GradientTextProps) {
  const fill = webTextStyle({
    backgroundImage: `linear-gradient(${angle}deg, ${colors.join(', ')})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  });
  return <Text style={[style, fill]}>{children}</Text>;
}
