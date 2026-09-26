import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SHADOW, SPACE } from '@/theme';
import { FadeUp, HoverCard } from '@/components/motion';
import { BasinIcon, BellIcon, FlowNetworkIcon, GaugeIcon, ImpairedIcon, PermitIcon, SpillIcon } from '../art/icons';
import type { IconProps } from '../art/types';
import { DATA_SOURCES, type DataSource, type SourceIcon } from '../content';
import { Badge } from '../ui/Badge';
import { Grid } from '../ui/Grid';
import { Section } from '../ui/Section';
import { SectionHeading } from '../ui/SectionHeading';
import { useLayout } from '../ui/layout';
import { SECTION_IDS } from '../ui/scroll';
import { TYPE } from '../ui/typography';

const ICONS: Record<SourceIcon, ComponentType<IconProps>> = {
  network: FlowNetworkIcon,
  permit: PermitIcon,
  gauge: GaugeIcon,
  basin: BasinIcon,
  spill: SpillIcon,
  impaired: ImpairedIcon,
  bell: BellIcon,
};

function SourceCard({ source, index }: { source: DataSource; index: number }) {
  const live = source.status === 'live';
  const Icon = ICONS[source.icon];
  return (
    <FadeUp delay={(index % 4) * 80}>
      <HoverCard style={[styles.card, !live && styles.cardComing]} spotlight={live}>
        <View style={styles.top}>
          <View style={[styles.iconWrap, !live && styles.iconWrapComing]}>
            <Icon size={20} color={live ? C.primary : C.faint} />
          </View>
          <Badge kind={source.status} />
        </View>
        <Text style={styles.name}>{source.name}</Text>
        <Text style={TYPE.mono}>{source.org}</Text>
        <Text style={TYPE.small}>{source.use}</Text>
      </HoverCard>
    </FadeUp>
  );
}

/** Data sources: live federal datasets plus what's coming next. */
export function DataSources() {
  const { isWide, isNarrow } = useLayout();
  const live = DATA_SOURCES.filter((s) => s.status === 'live');
  const coming = DATA_SOURCES.filter((s) => s.status === 'coming');
  const columns = isWide ? 4 : isNarrow ? 1 : 2;
  return (
    <Section id={SECTION_IDS.data} style={styles.band}>
      <SectionHeading
        eyebrow="Data"
        title="Where the data comes from."
        lede="Every trace and every compliance record comes straight from federal sources at the moment you ask."
        style={{ marginBottom: 48 }}
      />
      <Grid columns={columns}>
        {live.map((source, index) => (
          <SourceCard key={source.name} source={source} index={index} />
        ))}
      </Grid>
      <Text style={[TYPE.eyebrow, styles.comingLabel]}>Coming next</Text>
      <Grid columns={isWide ? 3 : isNarrow ? 1 : 2}>
        {coming.map((source, index) => (
          <SourceCard key={source.name} source={source} index={index} />
        ))}
      </Grid>
    </Section>
  );
}

const styles = StyleSheet.create({
  band: { backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  card: {
    height: '100%',
    gap: SPACE.sm,
    padding: SPACE.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.background,
    ...SHADOW.card,
  },
  cardComing: { borderStyle: 'dashed', borderColor: C.lineStrong, backgroundColor: 'transparent', shadowOpacity: 0 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accentSoft,
  },
  iconWrapComing: { backgroundColor: C.surfaceAlt },
  name: { fontFamily: FONT.sans, fontSize: 17, fontWeight: '700', color: C.text },
  comingLabel: { color: C.muted, marginTop: 40, marginBottom: SPACE.lg },
});
