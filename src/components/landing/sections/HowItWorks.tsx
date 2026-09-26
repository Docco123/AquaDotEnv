import { C } from '@/theme';
import { FlowNetworkIcon, PinIcon } from '../art/icons';
import { STEPS } from '../content';
import { Grid, gridSpan } from '../ui/Grid';
import { Section } from '../ui/Section';
import { SectionHeading } from '../ui/SectionHeading';
import { useLayout } from '../ui/layout';
import { SECTION_IDS } from '../ui/scroll';
import { IconArt, StepCard } from './StepCard';
import { RiskExplainer } from './RiskExplainer';

/** How it works: a 3-step bento (pin → upstream trace → plain-English risk). */
export function HowItWorks() {
  const { isWide } = useLayout();
  const [pin, trace, explain] = STEPS;
  return (
    <Section id={SECTION_IDS.how}>
      <SectionHeading
        eyebrow="How it works"
        title="From a pin on the map to a plain-English answer."
        style={{ marginBottom: 48 }}
      />
      <Grid columns={isWide ? 5 : 1} gap={20}>
        <StepCard
          step={pin}
          index={0}
          style={isWide && gridSpan(2)}
          art={
            <IconArt>
              <PinIcon size={32} color={C.accent} />
            </IconArt>
          }
        />
        <StepCard
          step={trace}
          index={1}
          style={isWide && gridSpan(3)}
          art={
            <IconArt>
              <FlowNetworkIcon size={32} color={C.primary} />
            </IconArt>
          }
        />
        <StepCard step={explain} index={2} horizontal={isWide} style={isWide && gridSpan(5)} art={<RiskExplainer />} />
      </Grid>
    </Section>
  );
}
