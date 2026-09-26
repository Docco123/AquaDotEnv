import { StyleSheet, Text, View } from 'react-native';
import { echoReportUrl } from '@/api';
import { ActionLink, Card, ExternalLink, Section, T } from '@/components/ui';
import { distanceAndTravel } from '@/map/format';
import { COMPLIANCE, GROUPS, RISK, SPACE, fmtNum } from '@/theme';
import type { UpstreamFacility } from '@/types';
import { RiskTag } from '../RiskDot';
import { ComplianceRecord } from './ComplianceRecord';
import { EffluentSection } from './EffluentSection';
import { InfoRow } from './InfoRow';
import { LoadsSection } from './LoadsSection';

interface Props {
  facility: UpstreamFacility;
  /** Fallback HUC-8 for the loads lookup when the facility has no HUC-12 of its own. */
  pinHuc8: string | null;
  onBack(): void;
}

/** One discharger: identity, why it scored the way it did, and its compliance record. */
export function FacilityDetail({ facility: f, pinHuc8, onBack }: Props) {
  const risk = RISK[f.risk.level];
  const huc8 = f.huc12 ? f.huc12.slice(0, 8) : pinHuc8;
  return (
    <View style={styles.stack}>
      <ActionLink label="← All upstream dischargers" onPress={onBack} />
      <Card style={styles.card}>
        <RiskTag level={f.risk.level} />
        <Text style={T.display}>{f.name}</Text>
        <Text style={T.mono}>
          {f.id} · {f.city}, {f.state}
        </Text>
        {f.permitStatus && (
          <InfoRow k="Permit status" v={f.permitStatus} color={f.permitActive === false ? RISK.unknown.color : undefined} />
        )}
        <Text style={[T.body, styles.headline, { color: risk.color }]}>{COMPLIANCE[f.compliance].label}</Text>
        <InfoRow k="Upstream" v={`${distanceAndTravel(f.riverKm, f.travelHours)}${f.onMainstem ? ' · on the main stem' : ''}`} />
        {f.nearestOutfallId && <Text style={T.tiny}>Distance measured to outfall {f.nearestOutfallId}</Text>}
        <InfoRow k="Permit" v={`${f.permitType || 'NPDES'} · ${GROUPS[f.group]}${f.potw ? ' · sewage plant' : ''}`} />
        {f.receivingWater && <InfoRow k="Receiving water" v={f.receivingWater} />}
        {f.designFlowMgd !== null && <InfoRow k="Design flow" v={`${fmtNum(f.designFlowMgd)} million gal/day`} />}
      </Card>

      <Section title={`Risk score · ${f.risk.score}/100`}>
        <Card style={styles.card}>
          {f.risk.reasons.length === 0 ? (
            <Text style={T.small}>No risk factors recorded.</Text>
          ) : (
            f.risk.reasons.map((r) => (
              <Text key={r} style={T.body}>
                • {r}
              </Text>
            ))
          )}
        </Card>
      </Section>

      <ComplianceRecord facility={f} />
      <ExternalLink label="Full ECHO report" url={echoReportUrl(f.registryId)} />
      <EffluentSection permitId={f.id} />
      <LoadsSection huc8={huc8} permitId={f.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: SPACE.lg },
  card: { gap: SPACE.sm },
  headline: { fontWeight: '700' },
});
