import { StyleSheet, Text } from 'react-native';
import { webStyle } from '@/components/motion';
import { ELEVATION, FadeIn } from '@/components/ui';
import type { ChatModel } from '@/hooks/useChat';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import type { UpstreamFacility, UpstreamTrace } from '@/types';
import { ChatHeader } from './ChatHeader';
import { Composer } from './Composer';
import { CHAT, CHAT_LAYOUT } from './config';
import { MessageList } from './MessageList';
import { SuggestionChips } from './SuggestionChips';

interface Props {
  trace: UpstreamTrace;
  facility: UpstreamFacility | null;
  chat: ChatModel;
  onClose(): void;
  /** Fill the screen (narrow viewports) instead of floating over the map. */
  fullScreen: boolean;
}

/** The chat surface: header, conversation, starter questions, composer and data caveat. */
export function ChatPanel({ trace, facility, chat, onClose, fullScreen }: Props) {
  return (
    <FadeIn style={[styles.panel, fullScreen ? styles.full : styles.floating]}>
      <ChatHeader trace={trace} facility={facility} onClose={onClose} />
      <MessageList turns={chat.turns} onRetry={chat.retry} />
      {chat.turns.length === 0 && <SuggestionChips onPick={chat.send} />}
      <Composer streaming={chat.streaming} onSend={chat.send} onStop={chat.stop} />
      <Text style={styles.caption}>{CHAT.caption}</Text>
    </FadeIn>
  );
}

const { launcherBottom, launcherSize, panelGap, launcherRight } = CHAT_LAYOUT;
const floatingBottom = launcherBottom + launcherSize + panelGap;

const styles = StyleSheet.create({
  panel: { backgroundColor: C.surface, overflow: 'hidden' },
  floating: {
    position: 'absolute',
    right: launcherRight,
    bottom: floatingBottom,
    width: CHAT_LAYOUT.panelWidth,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.line,
    zIndex: CHAT_LAYOUT.zIndex,
    ...ELEVATION.float,
    ...webStyle({
      height: `min(${CHAT_LAYOUT.panelMaxHeight}px, ${CHAT_LAYOUT.panelViewportShare})`,
      maxHeight: `calc(100% - ${floatingBottom + SPACE.lg}px)`,
      maxWidth: `calc(100% - ${launcherRight * 2}px)`,
    }),
  },
  full: { flex: 1 },
  caption: {
    fontFamily: FONT.sans,
    fontSize: 11,
    lineHeight: 15,
    color: C.faint,
    textAlign: 'center',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.md,
  },
});
