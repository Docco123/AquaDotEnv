import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChatDock } from '@/components/chat/ChatDock';
import { MapPanel } from '@/components/map/MapPanel';
import { MapStatusPill } from '@/components/map/MapStatusPill';
import { TopBar } from '@/components/map/TopBar';
import { useMapTool } from '@/hooks/useMapTool';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { LAYOUT } from '@/map/config';
import { LeafletMap } from '@/map/LeafletMap';
import type { MapHandle } from '@/map/types';
import { C } from '@/theme';

/** The map tool: drop a pin, trace upstream, see who discharges into your water. */
export default function MapScreen() {
  const mapRef = useRef<MapHandle>(null);
  const tool = useMapTool(mapRef);
  const { wide, narrowMapHeight } = useResponsiveLayout();

  return (
    <View style={styles.screen}>
      <TopBar
        distanceKm={tool.distanceKm}
        onDistanceChange={tool.changeDistance}
        onPick={(lat, lng) => tool.dropPin(lat, lng)}
        compact={!wide}
      />
      <View style={[styles.body, wide ? styles.row : styles.column]}>
        <View style={wide ? styles.mapWide : [styles.mapNarrow, { height: narrowMapHeight }]}>
          <LeafletMap
            ref={mapRef}
            onMapClick={(lat, lng) => tool.dropPin(lat, lng)}
            onFacilityClick={(id) => tool.selectFacility(id, false)}
          />
          <MapStatusPill state={tool.state} />
          {tool.trace && <ChatDock trace={tool.trace} facility={tool.selected} fullScreen={!wide} />}
        </View>
        <View style={wide ? styles.panelWide : styles.panelNarrow}>
          <MapPanel tool={tool} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  body: { flex: 1, minHeight: 0 },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  mapWide: { flex: 1, zIndex: 0 },
  mapNarrow: { zIndex: 0 },
  panelWide: { width: LAYOUT.panelWidth, borderLeftWidth: 1, borderLeftColor: C.line },
  panelNarrow: { flex: 1, minHeight: 0, borderTopWidth: 1, borderTopColor: C.line },
});
