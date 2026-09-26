import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { webStyle } from '@/components/motion';
import { C } from '@/theme';

/** Blinking 2px caret shown at the end of a streaming answer. Renders inline inside <Text>. */
export function StreamCursor() {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 450, delay: 250, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View aria-hidden style={[styles.bar, { opacity }]} />;
}

const styles = StyleSheet.create({
  bar: {
    width: 2,
    height: 15,
    marginLeft: 2,
    borderRadius: 1,
    backgroundColor: C.text,
    ...webStyle({ verticalAlign: 'text-bottom' }),
  },
});
