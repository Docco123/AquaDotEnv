import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SHADOW, SPACE } from '@/theme';
import { FadeUp, HoverCard } from '@/components/motion';
import { FarmIcon, LakeIcon, UtilityIcon, WellIcon } from '../art/icons';
import type { IconProps } from '../art/types';
import { AUDIENCES, type Audience as AudienceItem, type AudienceIcon } from '../content';
import { Grid } from '../ui/Grid';
import { Section } from '../ui/Section';
import { SectionHeading } from '../ui/SectionHeading';
import { useLayout } from '../ui/layout';
import { headingProps, TYPE } from '../ui/typography';

const ICONS: Record<AudienceIcon, ComponentType<IconProps>> = {
  utility: UtilityIcon,
  lake: LakeIcon,
  farm: FarmIcon,
  well: WellIcon,
};

function AudienceCard({ item, index }: { item: AudienceItem; index: number }) {
  const Icon = ICONS[item.icon];
  return (
    <FadeUp delay={index * 90}>
      <HoverCard style={styles.card} spotlightColor={`${C.secondary}1a`}>
        <View style={styles.iconWrap}>
          <Icon size={22} color={C.secondary} />
        </View>
        <Text {...headingProps(3)} style={styles.title}>
          {item.title}
        </Text>
        <Text style={TYPE.small}>{item.body}</Text>
      </HoverCard>
    </FadeUp>
  );
}

/** Who it's for: the downstream parties enforcement leaves out. */
export function Audience() {
  const { isWide, isNarrow } = useLayout();
  return (
    <Section>
      <SectionHeading
        eyebrow="Who it’s for"
        title="For the people downstream."
        lede="The town, the lake association, the farm, the well owner: everyone who isn’t part of the enforcement conversation."
        style={{ marginBottom: 48 }}
      />
      <Grid columns={isWide ? 4 : isNarrow ? 1 : 2}>
        {AUDIENCES.map((item, index) => (
          <AudienceCard key={item.title} item={item} index={index} />
        ))}
      </Grid>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: {
    height: '100%',
    gap: SPACE.md,
    padding: SPACE.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    ...SHADOW.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${C.secondary}14`,
  },
  title: { fontFamily: FONT.sans, fontSize: 17, lineHeight: 23, fontWeight: '700', color: C.text },
});
