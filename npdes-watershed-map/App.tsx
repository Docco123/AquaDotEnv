import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { fetchChildHucs, fetchFacilities, fetchHuc, fetchHucAtPoint, fetchLoads, fetchRegions } from './src/api';
import FacilityPanel from './src/components/FacilityPanel';
import WatershedPanel from './src/components/WatershedPanel';
import { ErrorNote, Loading, Section, s as ui } from './src/components/ui';
import MapView from './src/map/MapView';
import type { MapEvent, MapHandle } from './src/map/protocol';
import { C, COMPLIANCE, markerRadius } from './src/theme';
import type { Facility, FeatureCollection, Huc, LoadRow, PermitGroup } from './src/types';

const fc = (hucs: Huc[]): FeatureCollection => ({ type: 'FeatureCollection', features: hucs.map((h) => h.feature) });

// Loading Tool data is annual: last full calendar year by default, current year-to-date optional.
const THIS_YEAR = new Date().getFullYear();
const LOAD_YEARS = [THIS_YEAR - 1, THIS_YEAR];

const EXAMPLES = [
  { code: '01090001', label: 'Charles River, MA' },
  { code: '07120003', label: 'Chicago, IL' },
  { code: '18070105', label: 'Los Angeles, CA' },
  { code: '12040104', label: 'Houston Ship Channel, TX' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 860;
  const map = useRef<MapHandle>(null);

  const [huc4, setHuc4] = useState<Huc | null>(null);
  const [huc8, setHuc8] = useState<Huc | null>(null);
  const [huc12, setHuc12] = useState<Huc | null>(null);
  const [children, setChildren] = useState<Huc[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [facError, setFacError] = useState<string | null>(null);
  const [loads, setLoads] = useState<LoadRow[] | null>(null);
  const [loadsError, setLoadsError] = useState<string | null>(null);
  const [loadYear, setLoadYear] = useState(LOAD_YEARS[0]);

  const [groups, setGroups] = useState<Set<PermitGroup>>(new Set(['major', 'individual', 'general']));
  const [violationsOnly, setViolationsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const scroller = useRef<ScrollView>(null);

  // One request token per selection, so late responses from an old watershed are ignored.
  const token = useRef(0);
  // Code of the HUC-8 whose permits/loads we want; stale responses are dropped.
  const huc8Ref = useRef<string | null>(null);
  huc8Ref.current = huc8?.code ?? null;

  useEffect(() => {
    fetchRegions()
      .then((geojson) => map.current?.send({ type: 'setRegions', geojson }))
      .catch(() => {}); // Regions are decorative context only.
  }, []);

  const run = useCallback(async (label: string, fn: (t: number) => Promise<void>) => {
    const t = ++token.current;
    setBusy(label);
    setError(null);
    try {
      await fn(t);
    } catch (e: any) {
      if (t === token.current) setError(String(e?.message ?? e));
    } finally {
      if (t === token.current) setBusy(null);
    }
  }, []);

  const selectHuc4 = useCallback(
    (h: Huc) =>
      run('Loading subbasins…', async (t) => {
        setHuc4(h);
        setHuc8(null);
        setHuc12(null);
        setFacilities(null);
        setLoads(null);
        setSelectedId(null);
        setChildren(null);
        map.current?.send({ type: 'setFacilities', items: [] });
        map.current?.send({ type: 'setWatersheds', context: fc([h]), children: null, selected: null, fit: true });
        const kids = await fetchChildHucs(h.code, 8);
        if (t !== token.current) return;
        setChildren(kids);
        map.current?.send({ type: 'setWatersheds', context: fc([h]), children: fc(kids), selected: null, fit: false });
      }),
    [run],
  );

  const loadWatershedData = useCallback((code: string, year: number) => {
    setFacilities(null);
    setFacError(null);
    setLoads(null);
    setLoadsError(null);
    fetchFacilities(code)
      .then((f) => huc8Ref.current === code && setFacilities(f))
      .catch((e) => setFacError(String(e.message ?? e)));
    fetchLoads(code, year)
      .then((l) => huc8Ref.current === code && setLoads(l))
      .catch((e) => setLoadsError(String(e.message ?? e)));
  }, []);

  const selectHuc8 = useCallback(
    (h: Huc, thenHuc12?: string) =>
      run('Loading subwatersheds…', async (t) => {
        huc8Ref.current = h.code;
        setHuc8(h);
        setHuc12(null);
        setSelectedId(null);
        setChildren(null);
        if (huc4?.code !== h.code.slice(0, 4)) fetchHuc(h.code.slice(0, 4)).then((p) => p && setHuc4(p));
        map.current?.send({ type: 'setFacilities', items: [] });
        map.current?.send({ type: 'setWatersheds', context: fc([h]), children: null, selected: null, fit: true });
        loadWatershedData(h.code, loadYear);
        const kids = await fetchChildHucs(h.code, 12);
        if (t !== token.current) return;
        setChildren(kids);
        const pre = thenHuc12 ? kids.find((k) => k.code === thenHuc12) ?? null : null;
        setHuc12(pre);
        map.current?.send({ type: 'setWatersheds', context: fc([h]), children: fc(kids), selected: pre?.code ?? null, fit: false });
        if (pre) map.current?.send({ type: 'highlightHuc', code: pre.code, fit: true });
      }),
    [run, huc4, loadYear, loadWatershedData],
  );

  const selectHuc12 = useCallback(
    (code: string | null) => {
      const h = code ? children?.find((k) => k.code === code) ?? null : null;
      setHuc12(h);
      setSelectedId(null);
      map.current?.send({ type: 'highlightHuc', code: h?.code ?? null, fit: !!h });
      if (!h && huc8) map.current?.send({ type: 'setWatersheds', context: fc([huc8]), children: fc(children ?? []), selected: null, fit: true });
    },
    [children, huc8],
  );

  const goNation = () => {
    token.current++;
    setHuc4(null);
    setHuc8(null);
    setHuc12(null);
    setChildren(null);
    setFacilities(null);
    setLoads(null);
    setSelectedId(null);
    setBusy(null);
    map.current?.send({ type: 'setFacilities', items: [] });
    map.current?.send({ type: 'setWatersheds', context: null, children: null, selected: null, fit: false });
    map.current?.send({ type: 'fitUS' });
  };

  const jumpTo = (raw: string) => {
    const code = raw.replace(/\D/g, '');
    if (![4, 8, 12].includes(code.length)) {
      setError('Enter a 4-, 8- or 12-digit HUC code.');
      return;
    }
    run('Finding watershed…', async () => {
      const h = await fetchHuc(code.length === 12 ? code.slice(0, 8) : code);
      if (!h) throw new Error(`No watershed found for HUC ${code}.`);
      if (h.level === 4) selectHuc4(h);
      else selectHuc8(h, code.length === 12 ? code : undefined);
    });
  };

  const onMapEvent = (e: MapEvent) => {
    if (e.type === 'facClick') {
      setSelectedId(e.id);
      map.current?.send({ type: 'selectFacility', id: e.id, pan: false });
    } else if (e.type === 'hucClick') {
      if (e.level === 8) {
        const h = children?.find((k) => k.code === e.code);
        if (h) selectHuc8(h);
      } else if (e.level === 12) {
        selectHuc12(huc12?.code === e.code ? null : e.code);
      }
    } else if (e.type === 'mapClick') {
      // Clicking outside the current selection picks the watershed under the pointer.
      const level = huc8 ? 8 : 4;
      run('Finding watershed…', async () => {
        const h = await fetchHucAtPoint(level, e.lat, e.lng);
        if (!h) throw new Error('No US watershed at that spot.');
        if (h.level === 4) selectHuc4(h);
        else if (h.code !== huc8?.code) selectHuc8(h);
      });
    }
  };

  const visible = useMemo(
    () =>
      (facilities ?? []).filter(
        (f) =>
          groups.has(f.group) &&
          (!huc12 || f.huc12 === huc12.code) &&
          (!violationsOnly || ['snc', 'effluent', 'violation'].includes(f.compliance)),
      ),
    [facilities, groups, huc12, violationsOnly],
  );

  useEffect(() => {
    const items = [...visible]
      .sort((a, b) => COMPLIANCE[b.compliance].rank - COMPLIANCE[a.compliance].rank || markerRadius(b) - markerRadius(a))
      .map((f) => ({
        id: f.id,
        name: f.name,
        lat: f.lat,
        lng: f.lng,
        r: markerRadius(f),
        color: COMPLIANCE[f.compliance].color,
        status: COMPLIANCE[f.compliance].short,
      }));
    map.current?.send({ type: 'setFacilities', items });
    if (selectedId) map.current?.send({ type: 'selectFacility', id: selectedId, pan: false });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [selectedId, huc8?.code, huc4?.code]);

  const changeYear = (y: number) => {
    if (!huc8 || y === loadYear) return;
    setLoadYear(y);
    setLoads(null);
    setLoadsError(null);
    const code = huc8.code;
    fetchLoads(code, y)
      .then((l) => huc8Ref.current === code && setLoads(l))
      .catch((e) => setLoadsError(String(e.message ?? e)));
  };

  const selected = selectedId ? facilities?.find((f) => f.id === selectedId) ?? null : null;

  const panel = (
    <ScrollView ref={scroller} style={{ flex: 1, backgroundColor: C.card }} contentContainerStyle={{ paddingBottom: 32 }}>
      {error && <ErrorNote message={error} />}
      {selected ? (
        <FacilityPanel
          key={selected.id}
          facility={selected}
          loads={loads}
          loadYear={loadYear}
          onBack={() => {
            setSelectedId(null);
            map.current?.send({ type: 'selectFacility', id: null, pan: false });
          }}
        />
      ) : huc8 ? (
        <WatershedPanel
          huc8={huc8}
          huc12={huc12}
          onClearHuc12={() => selectHuc12(null)}
          facilities={facilities}
          facError={facError}
          onRetryFacilities={() => loadWatershedData(huc8.code, loadYear)}
          visible={visible}
          groups={groups}
          onToggleGroup={(g) => {
            const next = new Set(groups);
            next.has(g) ? next.delete(g) : next.add(g);
            setGroups(next);
          }}
          violationsOnly={violationsOnly}
          onToggleViolations={() => setViolationsOnly(!violationsOnly)}
          loads={loads}
          loadsError={loadsError}
          loadYear={loadYear}
          loadYears={LOAD_YEARS}
          onLoadYear={changeYear}
          onSelectFacility={(id) => {
            setSelectedId(id);
            map.current?.send({ type: 'selectFacility', id, pan: true });
          }}
        />
      ) : huc4 ? (
        <Section title={`Subregion ${huc4.code}`}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{huc4.name}</Text>
          <Text style={[ui.muted, { marginBottom: 8 }]}>Pick a subbasin (HUC-8) on the map or below to load its permits.</Text>
          {!children ? (
            <Loading label="Loading subbasins…" />
          ) : (
            children.map((k, i) => (
              <Pressable key={k.code} onPress={() => selectHuc8(k)} style={[ui.row, i > 0 && ui.rowDivider]}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.rowTitle}>{k.name}</Text>
                  <Text style={ui.small}>
                    {k.code}
                    {k.states ? ` · ${k.states}` : ''}
                    {k.areaSqKm ? ` · ${Math.round(k.areaSqKm / 2.59).toLocaleString()} sq mi` : ''}
                  </Text>
                </View>
                <Text style={ui.link}>›</Text>
              </Pressable>
            ))
          )}
        </Section>
      ) : (
        <Intro onPick={jumpTo} />
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.crumbs}>
          <Crumb label="USA" onPress={goNation} active={!huc4} />
          {huc4 && <Crumb label={`${huc4.code} ${huc4.name}`} onPress={() => selectHuc4(huc4)} active={!huc8} />}
          {huc8 && <Crumb label={`${huc8.code} ${huc8.name}`} onPress={() => (setSelectedId(null), selectHuc12(null))} active={!huc12 && !selected} />}
          {huc12 && <Crumb label={huc12.name} onPress={() => setSelectedId(null)} active={!selected} />}
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => jumpTo(search)}
          placeholder="HUC code…"
          placeholderTextColor={C.muted}
          keyboardType="number-pad"
          returnKeyType="go"
          style={styles.search}
        />
      </View>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
        <View style={wide ? { flex: 1 } : { height: Math.round(height * 0.5) }}>
          <MapView ref={map} onEvent={onMapEvent} />
          {busy && (
            <View style={styles.busy} pointerEvents="none">
              <Text style={styles.busyText}>{busy}</Text>
            </View>
          )}
        </View>
        <View style={wide ? { width: 400, borderLeftWidth: 1, borderLeftColor: C.line } : { flex: 1, borderTopWidth: 1, borderTopColor: C.line }}>
          {panel}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Crumb({ label, onPress, active }: { label: string; onPress(): void; active: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>
      <Text numberOfLines={1} style={[styles.crumb, active && { color: C.ink, fontWeight: '700' }]}>
        {label}
      </Text>
      {!active && <Text style={styles.crumbSep}> › </Text>}
    </Pressable>
  );
}

function Intro({ onPick }: { onPick(code: string): void }) {
  return (
    <View>
      <Section title="NPDES watershed map">
        <Text style={ui.body}>
          Tap anywhere on the map to pick a watershed, then drill down from subregion (HUC-4) to subbasin (HUC-8) to
          subwatershed (HUC-12). Each subbasin shows every active Clean Water Act discharge permit, what it discharges,
          and any violations in the last year.
        </Text>
        <Text style={[ui.sectionTitle, { marginTop: 14, marginBottom: 6 }]}>Try</Text>
        {EXAMPLES.map((e, i) => (
          <Pressable key={e.code} onPress={() => onPick(e.code)} style={[ui.row, i > 0 && ui.rowDivider]}>
            <Text style={[ui.rowTitle, { flex: 1 }]}>{e.label}</Text>
            <Text style={ui.small}>{e.code}</Text>
          </Pressable>
        ))}
      </Section>
      <Section title="Data">
        <Text style={ui.small}>
          Permits, compliance and DMRs: EPA ECHO / ICIS-NPDES web services (last 4 quarters; DMRs last 12 months).{'\n'}
          Annual loads: EPA Water Pollutant Loading Tool.{'\n'}
          Watersheds: USGS Watershed Boundary Dataset. Rivers: USGS National Hydrography Dataset.{'\n'}
          Coastal charts: NOAA Office of Coast Survey ENC (layer menu, top right of the map).{'\n'}
          All sources are public and keyless. Data is queried live.
        </Text>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    backgroundColor: C.card,
  },
  crumbs: { flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  crumb: { fontSize: 13, color: C.accent, fontWeight: '500' },
  crumbSep: { color: C.muted, fontSize: 13 },
  search: {
    width: 120,
    height: 34,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: C.ink,
    backgroundColor: C.bg,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  busy: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(22,34,43,.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  busyText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
