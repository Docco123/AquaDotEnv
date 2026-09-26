import { StyleSheet, Text, View } from 'react-native';
import { C, SPACE } from '@/theme';
import { ATTRIBUTION } from '../content';
import { Container } from '../ui/Container';
import { useLayout } from '../ui/layout';
import { TYPE } from '../ui/typography';
import { Wordmark } from './NavBar';

/** Footer: brand, data attribution, and the non-affiliation notice. */
export function Footer() {
  const { isWide } = useLayout();
  return (
    <View role="contentinfo" style={styles.footer}>
      <Container style={[styles.row, isWide && styles.rowWide]}>
        <View style={styles.brand}>
          <Wordmark />
          <Text style={TYPE.small}>Public data, delivered downstream.</Text>
        </View>
        <View style={[styles.meta, isWide && styles.metaWide]}>
          <Text style={TYPE.small}>{ATTRIBUTION}</Text>
          <Text style={[TYPE.small, styles.notice]}>Not affiliated with EPA or USGS.</Text>
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 40, marginTop: SPACE.xxl },
  row: { gap: SPACE.xl },
  rowWide: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { gap: SPACE.sm },
  meta: { gap: SPACE.sm },
  metaWide: { maxWidth: 520 },
  notice: { color: C.text, fontWeight: '600' },
});
