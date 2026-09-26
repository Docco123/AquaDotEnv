import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SPACE } from '@/theme';

/** The user's message: right-aligned bubble. */
export function UserMessage({ content }: { content: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.text} selectable>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md + 2,
    paddingVertical: SPACE.sm + 2,
  },
  text: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 21, color: C.text },
});
