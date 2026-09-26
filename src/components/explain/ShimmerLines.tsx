import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { C, RADIUS, SPACE } from '@/theme';

const WIDTHS = ['92%', '100%', '64%'] as const;

/** Three pulsing placeholder lines while the summary is generated. */
export function ShimmerLines() {
  const [pulse] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.root} accessibilityLabel="Writing a plain-English summary" accessibilityRole="progressbar">
      {WIDTHS.map((width) => (
        <Animated.View key={width} style={[styles.line, { width, opacity: pulse }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACE.sm, paddingVertical: SPACE.xs },
  line: { height: 12, borderRadius: RADIUS.sm, backgroundColor: C.surfaceAlt },
});
