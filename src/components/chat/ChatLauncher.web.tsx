import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { EASE_OUT, webStyle } from '@/components/motion';
import { ELEVATION } from '@/components/ui';
import { C } from '@/theme';
import { CHAT_LAYOUT } from './config';
import { ChatBubbleIcon } from './icons';
import type { ChatLauncherProps } from './types';

/** Round button floating at the map's bottom-right corner; toggles the chat panel. */
export function ChatLauncher({ open, onPress }: ChatLauncherProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel="Ask about this trace"
      accessibilityState={{ expanded: open }}
      style={[styles.launcher, hovered && styles.lifted]}
    >
      <ChatBubbleIcon size={20} color={C.surface} />
    </Pressable>
  );
}

const size = CHAT_LAYOUT.launcherSize;

const styles = StyleSheet.create({
  launcher: {
    position: 'absolute',
    bottom: CHAT_LAYOUT.launcherBottom,
    right: CHAT_LAYOUT.launcherRight,
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.text,
    zIndex: CHAT_LAYOUT.zIndex,
    ...ELEVATION.float,
    ...webStyle({ transitionProperty: 'transform', transitionDuration: '200ms', transitionTimingFunction: EASE_OUT, cursor: 'pointer' }),
  },
  lifted: { transform: [{ translateY: -2 }] },
});
