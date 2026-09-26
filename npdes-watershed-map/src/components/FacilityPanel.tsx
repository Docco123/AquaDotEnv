import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { echoReportUrl, fetchEffluent } from '../api';
import { C, COMPLIANCE, GROUPS, fmtLbs, fmtNum } from '../theme';
import type { DmrParameter, EffluentSummary, Facility, LoadRow } from '../types';
import { Bar, Chip, Dot, ErrorNote, Loading, Section, s } from './ui';

interface Props {
  facility: Facility;
  loads: LoadRow[] | null;
  loadYear: number;
  onBack(): void;
}

const QTR_COLOR: Record<string, string> = { S: COMPLIANCE.snc.color, V: COMPLIANCE.violation.color, E: COMPLIANCE.effluent.color };

export default function FacilityPanel({ facility: f, loads, loadYear, onBack }: Props) {
  const [eff, setEff] = useState<EffluentSummary | null>(null);
  const [effError, setEffError] = useState<string | null>(null);
  const [exceedOnly, setExceedOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(25);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // The parent keys this panel by permit id, so state starts fresh per facility.
    let live = true;
    fetchEffluent(f.id)
      .then((r) => live && setEff(r))
      .catch((e) => live && setEffError(String(e.message ?? e)));
    return () => {
      live = false;
    };
  }, [f.id, attempt]);

  const myLoads = useMemo(() => {
    const by = new Map<string, number>();
    (loads ?? []).filter((r) => r.permit === f.id).forEach((r) => by.set(r.param, (by.get(r.param) ?? 0) + r.lbs));
    return [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [loads, f.id]);

  const params = useMemo(() => {
    const all = eff?.parameters ?? [];
    return exceedOnly ? all.filter((p) => p.exceedances > 0) : all;
  }, [eff, exceedOnly]);
  const exceedCount = eff?.parameters.reduce((a, p) => a + p.exceedances, 0) ?? 0;

  const quarters = f.qtrHistory.padStart(13, '_').split('');

  return (
    <View>
      <Section title="Permit">
        <Pressable onPress={onBack} style={{ marginBottom: 8 }}>
          <Text style={s.link}>← Back to watershed</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{f.name}</Text>
        <Text style={s.muted}>
          {f.id} · {f.city}, {f.state}
        </Text>
        <View style={[s.row, { paddingVertical: 4 }]}>
          <Dot cls={f.compliance} size={12} />
          <Text style={[s.body, { fontWeight: '600', color: COMPLIANCE[f.compliance].color }]}>{COMPLIANCE[f.compliance].label}</Text>
        </View>
        <Info k="Permit" v={`${f.permitType} · ${GROUPS[f.group]}${f.potw ? ' · Sewage treatment plant (POTW)' : ''}`} />
        {f.designFlowMgd !== null && <Info k="Design flow" v={`${fmtNum(f.designFlowMgd)} million gal/day`} />}
        {f.receivingWater && <Info k="Receiving water" v={f.receivingWater} />}
        {f.huc12Name && <Info k="Subwatershed" v={`${f.huc12Name} (${f.huc12})`} />}
        {f.cso && <Info k="Combined sewer overflows" v="Yes, has CSO outfalls" />}
        <Pressable onPress={() => Linking.openURL(echoReportUrl(f.registryId))} style={{ marginTop: 6 }}>
          <Text style={s.link}>Full ECHO facility report ↗</Text>
        </Pressable>
      </Section>

      <Section title="Compliance">
        <Text style={s.small}>Last 13 quarters (most recent right; last 4 quarters outlined)</Text>
        <View style={{ flexDirection: 'row', gap: 3, marginVertical: 6 }}>
          {quarters.map((q, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 16,
                borderRadius: 3,
                backgroundColor: QTR_COLOR[q] ?? '#e6ebef',
                borderWidth: i >= 9 ? 1.5 : 0,
                borderColor: C.ink,
              }}
            />
          ))}
        </View>
        <Text style={s.small}>
          <Text style={{ color: COMPLIANCE.snc.color }}>■</Text> significant noncompliance · <Text style={{ color: COMPLIANCE.violation.color }}>■</Text> violation · <Text style={{ color: '#c5cdd3' }}>■</Text> none
        </Text>
        {f.sncStatus && <Info k="Current SNC" v={f.sncStatus} />}
        <Info k="Effluent exceedances (1 yr)" v={String(f.effluentExceedances1yr)} />
        {f.exceedancePollutants1yr && <Info k="Pollutants exceeded" v={f.exceedancePollutants1yr} />}
        {f.formalActions > 0 && <Info k="Formal enforcement (5 yr)" v={String(f.formalActions)} />}
        {f.penalties && <Info k="Penalties (5 yr)" v={f.penalties} />}
      </Section>

      <Section title={`Annual loads · ${loadYear}`}>
        {!loads ? (
          <Loading label="Loading…" />
        ) : myLoads.length === 0 ? (
          <Text style={s.muted}>No DMR-based loads calculated for this permit in {loadYear}.</Text>
        ) : (
          myLoads.map(([param, lbs]) => (
            <View key={param} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={[s.small, { color: C.ink, flex: 1 }]} numberOfLines={1}>{param}</Text>
                <Text style={[s.small, { color: C.ink }]}>{fmtLbs(lbs)}</Text>
              </View>
              <Bar fraction={lbs / myLoads[0][1]} />
            </View>
          ))
        )}
      </Section>

      <Section
        title="Discharge monitoring · 12 mo"
        right={eff && eff.parameters.length > 0 ? <Chip label={`Exceedances · ${exceedCount}`} active={exceedOnly} onPress={() => setExceedOnly(!exceedOnly)} color={COMPLIANCE.effluent.color} /> : undefined}
      >
        {effError ? (
          <ErrorNote message={`Couldn't load DMRs: ${effError}`} onRetry={() => (setEffError(null), setAttempt(attempt + 1))} />
        ) : !eff ? (
          <Loading label="Loading DMRs from EPA ECHO…" />
        ) : eff.parameters.length === 0 ? (
          <Text style={s.muted}>
            No discharge monitoring reports in the last 12 months. General and stormwater permits usually report outside ICIS-NPDES.
          </Text>
        ) : (
          <>
            <Text style={[s.small, { marginBottom: 6 }]}>
              {eff.start} – {eff.end} · {eff.parameters.length} monitored parameters. Tap one to see each reported value.
            </Text>
            {params.slice(0, limit).map((p, i) => (
              <ParamRow key={`${p.outfall}-${p.code}-${p.location}`} p={p} first={i === 0} open={open === `${p.outfall}-${p.code}-${p.location}`} onToggle={() => setOpen(open === `${p.outfall}-${p.code}-${p.location}` ? null : `${p.outfall}-${p.code}-${p.location}`)} />
            ))}
            {params.length > limit && (
              <Pressable onPress={() => setLimit(limit + 50)}>
                <Text style={[s.link, { marginTop: 6 }]}>Show more ({params.length - limit} remaining)</Text>
              </Pressable>
            )}
          </>
        )}
      </Section>
    </View>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
      <Text style={[s.small, { width: 130 }]}>{k}</Text>
      <Text style={[s.small, { color: C.ink, flex: 1 }]}>{v}</Text>
    </View>
  );
}

function ParamRow({ p, first, open, onToggle }: { p: DmrParameter; first: boolean; open: boolean; onToggle(): void }) {
  const l = p.latest;
  return (
    <View style={!first && s.rowDivider}>
      <Pressable onPress={onToggle} style={[s.row, { alignItems: 'flex-start' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowTitle, { fontSize: 13 }]}>{p.name}</Text>
          <Text style={s.small}>
            Outfall {p.outfall} · {p.location}
          </Text>
          {l && (
            <Text style={[s.small, { color: C.ink }]}>
              Latest {l.period.slice(0, 7)}: {l.value !== null ? `${fmtNum(l.value)} ${l.unit ?? ''}` : l.nodi ?? '—'} ({l.stat})
              {l.limit !== null ? ` · limit ${fmtNum(l.limit)} ${l.limitUnit ?? ''}` : ''}
            </Text>
          )}
        </View>
        {p.exceedances > 0 && (
          <View style={{ backgroundColor: COMPLIANCE.effluent.color, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{p.exceedances} over</Text>
          </View>
        )}
      </Pressable>
      {open && (
        <View style={{ paddingBottom: 8 }}>
          {p.values.map((v, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
              <Text style={[s.small, { width: 64 }]}>{v.period.slice(0, 7)}</Text>
              <Text style={[s.small, { width: 86 }]} numberOfLines={1}>{v.stat}</Text>
              <Text style={[s.small, { flex: 1, color: v.violation ? COMPLIANCE.effluent.color : C.ink, fontWeight: v.violation ? '700' : '400' }]}>
                {v.value !== null ? `${fmtNum(v.value)} ${v.unit ?? ''}` : v.nodi ?? '—'}
                {v.limit !== null ? `  / limit ${fmtNum(v.limit)}` : ''}
                {v.exceedPct ? `  (+${v.exceedPct}%)` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
