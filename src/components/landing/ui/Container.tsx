import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CONTAINER_MAX, GUTTER } from './layout';

/** Centered page column: max 1120px of content with 20px side gutters. */
export function Container({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: CONTAINER_MAX + GUTTER * 2,
    paddingHorizontal: GUTTER,
    alignSelf: 'center',
  },
});
