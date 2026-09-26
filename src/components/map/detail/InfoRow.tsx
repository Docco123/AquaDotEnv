import { StyleSheet, Text, View } from 'react-native';
import { T } from '@/components/ui';
import { C, SPACE } from '@/theme';

export function InfoRow({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[T.small, styles.key]}>{k}</Text>
      <Text style={[T.small, T.num, styles.value, color ? { color } : null]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACE.sm },
  key: { width: 150 },
  value: { flex: 1, color: C.text },
});
