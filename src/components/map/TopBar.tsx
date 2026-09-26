import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Segmented, T } from '@/components/ui';
import { DISTANCE_OPTIONS_KM, LAYOUT } from '@/map/config';
import { C, FONT, SPACE } from '@/theme';
import { SearchBox } from './SearchBox';

const DISTANCE_SEGMENTS = DISTANCE_OPTIONS_KM.map((km) => ({ value: km as number, label: `${km} km` }));

interface Props {
  distanceKm: number;
  onDistanceChange(km: number): void;
  onPick(lat: number, lng: number): void;
  compact: boolean;
}

export function TopBar({ distanceKm, onDistanceChange, onPick, compact }: Props) {
  return (
    <View style={styles.bar}>
      <Link href="/" style={styles.wordmark} accessibilityLabel="UpstreamWatch home">
        UpstreamWatch
      </Link>
      <SearchBox onPick={onPick} />
      <View style={styles.distance}>
        {!compact && <Text style={T.label}>Upstream</Text>}
        <Segmented
          options={DISTANCE_SEGMENTS}
          value={distanceKm}
          onChange={onDistanceChange}
          accessibilityLabel="Upstream distance"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: LAYOUT.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    zIndex: 10,
  },
  wordmark: { fontFamily: FONT.display, fontSize: 18, fontWeight: '600', color: C.text },
  distance: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginLeft: 'auto' },
});
