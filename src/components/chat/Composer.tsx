import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputKeyPressEventData,
} from 'react-native';
import { webTextStyle } from '@/components/motion';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import { CHAT, CHAT_LAYOUT } from './config';
import { ArrowUpIcon, StopIcon } from './icons';

const { composerLineHeight: LINE, composerPaddingY: PAD, composerMaxLines } = CHAT_LAYOUT;
const MIN_HEIGHT = LINE + PAD * 2;
const MAX_HEIGHT = LINE * composerMaxLines + PAD * 2;
const clampHeight = (h: number) => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(h)));

/** Web: true content height of a textarea (lets the input shrink when lines are deleted). */
function measureTextarea(node: unknown): number | null {
  const el = node as HTMLTextAreaElement | null;
  if (Platform.OS !== 'web' || !el || typeof el.scrollHeight !== 'number' || !el.style) return null;
  const previous = el.style.height;
  el.style.height = '0px';
  const height = el.scrollHeight;
  el.style.height = previous;
  return height;
}

type KeyInfo = { key: string; shiftKey?: boolean; isComposing?: boolean };

interface Props {
  streaming: boolean;
  onSend(text: string): void;
  onStop(): void;
}

/** Growing input (1–4 lines). Enter sends, Shift+Enter adds a line; the button stops a running answer. */
export function Composer({ streaming, onSend, onStop }: Props) {
  const [text, setText] = useState('');
  const [height, setHeight] = useState(MIN_HEIGHT);
  const canSend = text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
    setHeight(MIN_HEIGHT);
  };

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const { key, shiftKey, isComposing } = e.nativeEvent as KeyInfo;
    if (key !== 'Enter' || shiftKey || isComposing) return;
    e.preventDefault();
    submit();
  };

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) =>
    setHeight(clampHeight(e.nativeEvent.contentSize.height));

  const onChange = (e: { target: unknown }) => {
    const measured = measureTextarea(e.target);
    if (measured !== null) setHeight(clampHeight(measured));
  };

  const button = streaming ? (
    <Pressable onPress={onStop} accessibilityRole="button" accessibilityLabel="Stop answer" style={[styles.button, styles.buttonOn]}>
      <StopIcon size={10} color={C.surface} />
    </Pressable>
  ) : (
    <Pressable
      onPress={submit}
      disabled={!canSend}
      accessibilityRole="button"
      accessibilityLabel="Send"
      accessibilityState={{ disabled: !canSend }}
      style={[styles.button, canSend ? styles.buttonOn : styles.buttonOff]}
    >
      <ArrowUpIcon size={16} color={C.surface} />
    </Pressable>
  );

  return (
    <View style={styles.box}>
      <TextInput
        value={text}
        onChangeText={setText}
        onChange={onChange}
        onKeyPress={onKeyPress}
        onContentSizeChange={onContentSizeChange}
        placeholder={CHAT.placeholder}
        placeholderTextColor={C.faint}
        multiline
        autoFocus
        accessibilityLabel="Message"
        style={[styles.input, { height }]}
      />
      {button}
    </View>
  );
}

const BUTTON = 30;

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACE.sm,
    marginHorizontal: SPACE.md,
    paddingLeft: SPACE.md + 2,
    paddingRight: 5,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.lineStrong,
    borderRadius: RADIUS.lg,
    backgroundColor: C.surface,
  },
  input: {
    flex: 1,
    fontFamily: FONT.sans,
    fontSize: 14,
    lineHeight: LINE,
    paddingVertical: PAD,
    color: C.text,
    ...webTextStyle({ outlineStyle: 'none' }),
  },
  button: { width: BUTTON, height: BUTTON, borderRadius: BUTTON / 2, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  buttonOn: { backgroundColor: C.text },
  buttonOff: { backgroundColor: C.lineStrong },
});
