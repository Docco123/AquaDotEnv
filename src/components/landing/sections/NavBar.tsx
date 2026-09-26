import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, FONT } from '@/theme';
import { webStyle, webTextStyle } from '@/components/motion';
import { LogoMark } from '../art/icons';
import { LinkButton } from '../ui/Buttons';
import { Container } from '../ui/Container';
import { useLayout } from '../ui/layout';
import { scrollToSection, SECTION_IDS } from '../ui/scroll';

const LINKS = [
  { label: 'Problem', id: SECTION_IDS.problem },
  { label: 'How it works', id: SECTION_IDS.how },
  { label: 'Data', id: SECTION_IDS.data },
];

/** Wordmark + brand mark. */
export function Wordmark() {
  return (
    <View style={styles.brand}>
      <LogoMark size={26} />
      <Text style={styles.wordmark}>UpstreamWatch</Text>
    </View>
  );
}

/** Sticky translucent top bar (made sticky by the page ScrollView's stickyHeaderIndices). */
export function NavBar() {
  const { isWide } = useLayout();
  return (
    <View role="navigation" style={styles.bar}>
      <Container style={styles.row}>
        <Wordmark />
        {isWide && (
          <View style={styles.links}>
            {LINKS.map((link) => (
              <Pressable key={link.id} role="link" onPress={() => scrollToSection(link.id)}>
                {(state) => (
                  <Text style={[styles.link, (state as { hovered?: boolean }).hovered && styles.linkHover]}>
                    {link.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
        <LinkButton href="/map" label="Open the map" size="sm" arrow />
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: webStyle({
    backgroundColor: `${C.background}d9`,
    backdropFilter: 'saturate(180%) blur(14px)',
    WebkitBackdropFilter: 'saturate(180%) blur(14px)',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: `${C.line}b3`,
  }),
  row: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontFamily: FONT.display, fontSize: 20, fontWeight: '600', letterSpacing: -0.4, color: C.text },
  links: { flexDirection: 'row', gap: 32 },
  link: webTextStyle({ fontFamily: FONT.sans, fontSize: 14, fontWeight: 500, color: C.muted, cursor: 'pointer', transitionProperty: 'color', transitionDuration: '150ms' }),
  linkHover: { color: C.text },
});
