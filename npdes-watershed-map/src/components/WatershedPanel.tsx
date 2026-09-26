import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { C, COMPLIANCE, GROUPS, fmtLbs } from '../theme';
import type { ComplianceClass, Facility, Huc, LoadRow, PermitGroup } from '../types';
import { Bar, Chip, Dot, ErrorNote, Loading, Section, Stat, s } from './ui';

interface Props {
  huc8: Huc;
  huc12: Huc | null;
  onClearHuc12(): void;
  facilities: Facility[] | null;
  facError: string | null;
  onRetryFacilities(): void;
  visible: Facility[];
  groups: Set<PermitGroup>;
  onToggleGroup(g: PermitGroup): void;
  violationsOnly: boolean;
  onToggleViolations(): void;
  loads: LoadRow[] | null;
  loadsError: string | null;
  loadYear: number;
  loadYears: number[];
  onLoadYear(y: number): void;
  onSelectFacility(id: string): void;
}

const VIOLATING: ComplianceClass[] = ['snc', 'effluent', 'violation'];

export default function WatershedPanel(p: Props) {
  const [showAllViol, setShowAllViol] = useState(false);
  const [weighted, setWeighted] = useState(false);

  // Facilities in scope (HUC-12 filter applied, permit-type/violation filters not applied).
  const inScope = useMemo(
    () => (p.facilities ?? []).filter((f) => !p.huc12 || f.huc12 === p.huc12.code),
    [p.facilities, p.huc12],
  );
  const groupCounts = useMemo(() => {
    const c: Record<PermitGroup, number> = { major: 0, individual: 0, general: 0, pretreatment: 0 };
    inScope.forEach((f) => c[f.group]++);
    return c;
  }, [inScope]);
  const classCounts = useMemo(() => {
    const c: Record<ComplianceClass, number> = { snc: 0, effluent: 0, violation: 0, ok: 0, nodata: 0 };
    p.visible.forEach((f) => c[f.compliance]++);
    return c;
  }, [p.visible]);
  const violators = useMemo(
    () =>
      p.visible
        .filter((f) => VIOLATING.includes(f.compliance))
        .sort(
          (a, b) =>
            COMPLIANCE[a.compliance].rank - COMPLIANCE[b.compliance].rank ||
            b.effluentExceedances1yr - a.effluentExceedances1yr,
        ),
    [p.visible],
  );

  // Loads limited to the permits currently shown on the map.
  const visibleIds = useMemo(() => new Set(p.visible.map((f) => f.id)), [p.visible]);
  const nameById = useMemo(() => new Map((p.facilities ?? []).map((f) => [f.id, f.name])), [p.facilities]);
  const { pollutants, dischargers, total, overLimit } = useMemo(() => {
    const byParam = new Map<string, { lbs: number; twpe: number; over: number; permits: Set<string> }>();
    const byPermit = new Map<string, number>();
    let total = 0;
    let overLimit = 0;
    for (const r of p.loads ?? []) {
      if (!visibleIds.has(r.permit)) continue;
      const e = byParam.get(r.param) ?? { lbs: 0, twpe: 0, over: 0, permits: new Set<string>() };
      e.lbs += r.lbs;
      e.twpe += r.lbs * (r.twf ?? 0);
      e.over += r.overLimitLbs ?? 0;
      e.permits.add(r.permit);
      byParam.set(r.param, e);
      byPermit.set(r.permit, (byPermit.get(r.permit) ?? 0) + r.lbs);
      total += r.lbs;
      overLimit += r.overLimitLbs ?? 0;
    }
    const pollutants = [...byParam.entries()]
      .map(([param, e]) => ({ param, ...e }))
      .filter((e) => (weighted ? e.twpe > 0 : true))
      .sort((a, b) => (weighted ? b.twpe - a.twpe : b.lbs - a.lbs))
      .slice(0, 12);
    const dischargers = [...byPermit.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { pollutants, dischargers, total, overLimit };
  }, [p.loads, visibleIds, weighted]);

  const maxPoll = pollutants.length ? (weighted ? pollutants[0].twpe : pollutants[0].lbs) : 1;

  return (
    <View>
      <Section title={p.huc12 ? 'Subwatershed (HUC-12)' : 'Subbasin (HUC-8)'}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{(p.huc12 ?? p.huc8).name}</Text>
        <Text style={s.muted}>
          HUC {(p.huc12 ?? p.huc8).code}
          {(p.huc12 ?? p.huc8).areaSqKm ? ` · ${Math.round((p.huc12 ?? p.huc8).areaSqKm! / 2.59).toLocaleString()} sq mi` : ''}
          {p.huc8.states ? ` · ${p.huc8.states}` : ''}
        </Text>
        {p.huc12 ? (
          <Pressable onPress={p.onClearHuc12} style={{ marginTop: 6 }}>
            <Text style={s.link}>← All of {p.huc8.name} ({p.huc8.code})</Text>
          </Pressable>
        ) : (
          <Text style={[s.small, { marginTop: 6 }]}>Tap a subwatershed outline on the map to narrow to HUC-12.</Text>
        )}
      </Section>

      {p.facError ? (
        <ErrorNote message={`Couldn't load ECHO permits: ${p.facError}`} onRetry={p.onRetryFacilities} />
      ) : !p.facilities ? (
        <Loading label="Loading active NPDES permits from EPA ECHO…" />
      ) : (
        <>
          <Section title="Last 4 quarters">
            <View style={s.statRow}>
              <Stat value={p.visible.length.toLocaleString()} label="permits shown" />
              <Stat value={p.visible.filter((f) => f.major).length} label="major dischargers" />
              <Stat value={violators.length} label="with violations" color={violators.length ? COMPLIANCE.snc.color : undefined} />
              <Stat
                value={p.visible.reduce((a, f) => a + f.effluentExceedances1yr, 0).toLocaleString()}
                label="effluent limit exceedances"
                color={COMPLIANCE.effluent.color}
              />
            </View>
          </Section>

          <Section title="Show">
            <View style={s.chipRow}>
              {(Object.keys(GROUPS) as PermitGroup[]).map((g) => (
                <Chip key={g} label={`${GROUPS[g]} · ${groupCounts[g]}`} active={p.groups.has(g)} onPress={() => p.onToggleGroup(g)} />
              ))}
              <Chip label="Violations only" active={p.violationsOnly} onPress={p.onToggleViolations} color={COMPLIANCE.snc.color} />
            </View>
            <View style={{ marginTop: 10, gap: 4 }}>
              {(Object.keys(COMPLIANCE) as ComplianceClass[]).map((c) => (
                <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Dot cls={c} />
                  <Text style={[s.small, { color: C.ink, flex: 1 }]}>{COMPLIANCE[c].label}</Text>
                  <Text style={[s.small, { fontVariant: ['tabular-nums'] }]}>{classCounts[c]}</Text>
                </View>
              ))}
              <Text style={[s.small, { marginTop: 4 }]}>Marker size scales with permitted design flow (MGD).</Text>
            </View>
          </Section>

          <Section title={`Violations · ${violators.length}`}>
            {violators.length === 0 ? (
              <Text style={s.muted}>No violations reported in the last 4 quarters for the permits shown.</Text>
            ) : (
              (showAllViol ? violators : violators.slice(0, 12)).map((f, i) => (
                <Pressable key={f.id} onPress={() => p.onSelectFacility(f.id)} style={[s.row, i > 0 && s.rowDivider]}>
                  <Dot cls={f.compliance} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle} numberOfLines={1}>{f.name}</Text>
                    <Text style={s.small} numberOfLines={2}>
                      {f.id} · {COMPLIANCE[f.compliance].short}
                      {f.effluentExceedances1yr ? ` · ${f.effluentExceedances1yr} exceedances` : ''}
                      {f.exceedancePollutants1yr ? ` · ${f.exceedancePollutants1yr}` : f.sncStatus ? ` · ${f.sncStatus}` : ''}
                    </Text>
                  </View>
                  <Text style={s.link}>›</Text>
                </Pressable>
              ))
            )}
            {violators.length > 12 && (
              <Pressable onPress={() => setShowAllViol(!showAllViol)}>
                <Text style={[s.link, { marginTop: 6 }]}>{showAllViol ? 'Show fewer' : `Show all ${violators.length}`}</Text>
              </Pressable>
            )}
          </Section>

          <Section
            title="Pollutant loads"
            right={
              <View style={s.chipRow}>
                {p.loadYears.map((y) => (
                  <Chip key={y} label={y === new Date().getFullYear() ? `${y} YTD` : String(y)} active={p.loadYear === y} onPress={() => p.onLoadYear(y)} />
                ))}
              </View>
            }
          >
            {p.loadsError ? (
              <ErrorNote message={`Couldn't load annual loads: ${p.loadsError}`} />
            ) : !p.loads ? (
              <Loading label="Computing loads (EPA Loading Tool)…" />
            ) : pollutants.length === 0 ? (
              <Text style={s.muted}>No DMR-based loads reported for the permits shown in {p.loadYear}.</Text>
            ) : (
              <>
                <Text style={s.muted}>
                  {fmtLbs(total)} total from monitored outfalls
                  {overLimit > 0 ? ` · ${fmtLbs(overLimit)} over permit limits` : ''}
                </Text>
                <View style={[s.chipRow, { marginVertical: 8 }]}>
                  <Chip label="Pounds" active={!weighted} onPress={() => setWeighted(false)} />
                  <Chip label="Toxic-weighted" active={weighted} onPress={() => setWeighted(true)} />
                </View>
                {pollutants.map((e) => (
                  <View key={e.param} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={[s.small, { color: C.ink, flex: 1 }]} numberOfLines={1}>{e.param}</Text>
                      <Text style={[s.small, { color: C.ink, fontVariant: ['tabular-nums'] }]}>
                        {weighted ? `${Math.round(e.twpe).toLocaleString()} TWPE` : fmtLbs(e.lbs)}
                      </Text>
                    </View>
                    <Bar fraction={(weighted ? e.twpe : e.lbs) / maxPoll} color={e.over > 0 ? COMPLIANCE.effluent.color : C.accent} />
                  </View>
                ))}
                <Text style={s.small}>Orange bars include pounds discharged above permit limits. Loads are EPA estimates from reported DMRs.</Text>

                <Text style={[s.sectionTitle, { marginTop: 14, marginBottom: 4 }]}>Largest dischargers</Text>
                {dischargers.map(([id, lbs], i) => (
                  <Pressable key={id} onPress={() => p.onSelectFacility(id)} style={[s.row, i > 0 && s.rowDivider]}>
                    <Text style={[s.rowTitle, { flex: 1, fontWeight: '500' }]} numberOfLines={1}>{nameById.get(id) ?? id}</Text>
                    <Text style={[s.small, { color: C.ink }]}>{fmtLbs(lbs)}</Text>
                  </Pressable>
                ))}
              </>
            )}
          </Section>
        </>
      )}
    </View>
  );
}
