import { StyleSheet, Text, View } from 'react-native';
import { Card, Section, T } from '@/components/ui';
import { C, COMPLIANCE, RISK, SPACE } from '@/theme';
import type { Facility } from '@/types';
import { InfoRow } from './InfoRow';

const QUARTERS = 13;
/** qtrHistory chars: "_" none, "V" violation, "E" effluent violation, "S" significant noncompliance. */
const QTR_COLOR: Record<string, string> = {
  S: COMPLIANCE.snc.color,
  E: COMPLIANCE.effluent.color,
  V: COMPLIANCE.violation.color,
};

function QuarterStrip({ history }: { history: string }) {
  const quarters = history.slice(-QUARTERS).padStart(QUARTERS, '_').split('');
  return (
    <View style={styles.strip} accessibilityLabel={`Last ${QUARTERS} quarters, most recent right: ${history}`}>
      {quarters.map((q, i) => (
        <View key={i} style={[styles.quarter, { backgroundColor: QTR_COLOR[q] ?? C.surfaceAlt }]} />
      ))}
    </View>
  );
}

/** 13-quarter strip plus the counts that matter: exceedances, NC quarters, enforcement, penalties. */
export function ComplianceRecord({ facility: f }: { facility: Facility }) {
  const history = f.qtrHistory.slice(-QUARTERS);
  const ncQuarters = history.replace(/_/g, '').length;
  const sncQuarters = history.split('').filter((q) => q === 'S').length;
  const alert = (n: number) => (n > 0 ? RISK.high.color : undefined);

  return (
    <Section title="Compliance record">
      <Card style={styles.card}>
        <Text style={T.small}>Last 13 quarters, most recent on the right</Text>
        <QuarterStrip history={f.qtrHistory} />
        <Text style={T.tiny}>
          <Text style={{ color: COMPLIANCE.snc.color }}>■</Text> significant noncompliance{'  '}
          <Text style={{ color: COMPLIANCE.effluent.color }}>■</Text> effluent{'  '}
          <Text style={{ color: COMPLIANCE.violation.color }}>■</Text> other violation
        </Text>
        <InfoRow k="Effluent exceedances (1 yr)" v={String(f.effluentExceedances1yr)} color={alert(f.effluentExceedances1yr)} />
        {f.exceedancePollutants1yr && <InfoRow k="Pollutants exceeded" v={f.exceedancePollutants1yr} />}
        <InfoRow k="Quarters in noncompliance" v={`${ncQuarters} of ${QUARTERS}`} color={alert(ncQuarters)} />
        <InfoRow k="Quarters in SNC" v={`${sncQuarters} of ${QUARTERS}`} color={alert(sncQuarters)} />
        {f.sncStatus && <InfoRow k="Current SNC status" v={f.sncStatus} />}
        {f.pollWithViolation && <InfoRow k="Pollutants with violations" v={f.pollWithViolation} />}
        {f.qtrsUndetermined !== undefined && f.qtrsUndetermined > 0 && (
          <InfoRow k="Quarters undetermined (missing DMRs)" v={`${f.qtrsUndetermined} of 12`} />
        )}
        {f.inspections5yr !== undefined && <InfoRow k="Inspections (5 yr)" v={String(f.inspections5yr)} />}
        {f.informalActions !== undefined && <InfoRow k="Informal enforcement (5 yr)" v={String(f.informalActions)} />}
        <InfoRow k="Formal enforcement (5 yr)" v={String(f.formalActions)} />
        {f.penalties && <InfoRow k="Penalties (5 yr)" v={f.penalties} />}
        {f.cso && <InfoRow k="Combined sewer overflows" v="Yes, has CSO outfalls" color={RISK.elevated.color} />}
        <InfoRow k="Discharge monitoring" v={f.hasDmrs ? `Reports DMRs${f.lastDmrDate ? ` · last ${f.lastDmrDate}` : ''}` : 'No DMRs on file'} />
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACE.sm },
  strip: { flexDirection: 'row', gap: 3 },
  quarter: { flex: 1, height: 16, borderRadius: 3 },
});
