import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SPACE } from '@/theme';
import { webStyle } from '@/components/motion';

type GridProps = {
  columns: number;
  gap?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** CSS grid with equal columns (web). Children can span with `gridSpan(n)`. */
export function Grid({ columns, gap = SPACE.lg, children, style }: GridProps) {
  return (
    <View
      style={[
        { gap },
        webStyle({ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }),
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Style for a grid child spanning `n` columns. */
export const gridSpan = (n: number): ViewStyle => webStyle({ gridColumn: `span ${n} / span ${n}` });
