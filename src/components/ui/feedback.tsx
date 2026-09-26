import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { C, RADIUS, RISK, SPACE } from '@/theme';
import { ActionLink } from './controls';
import { T } from './typography';

const NATIVE_DRIVER = Platform.OS !== 'web';

export function ErrorNote({ message, onRetry, retryLabel = 'Try again' }: { message: string; onRetry?(): void; retryLabel?: string }) {
  return (
    <View style={styles.error} accessibilityRole="alert">
      <Text style={[T.body, { color: RISK.high.color }]}>{message}</Text>
      {onRetry && <ActionLink label={retryLabel} onPress={onRetry} />}
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color={C.primary} />
      <Text style={T.small}>{label}</Text>
    </View>
  );
}

/** Fades and slides its children in once, after `delay` ms. */
export function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, delay]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  error: { padding: SPACE.md, borderRadius: RADIUS.sm, backgroundColor: RISK.high.soft, gap: SPACE.sm },
  loading: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingVertical: SPACE.sm },
});
