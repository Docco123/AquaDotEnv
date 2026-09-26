import { forwardRef, useEffect, useEffectEvent, useImperativeHandle, useRef } from 'react';
import { loadLeaflet } from './leaflet/load';
import { createScene, type MapScene } from './leaflet/scene';
import type { LeafletMapProps, MapHandle } from './types';

type SceneOp = (scene: MapScene) => void;

const FILL = { position: 'absolute', inset: 0 } as const;

/**
 * Web map: Leaflet rendered straight into a DOM node (no iframe). Leaflet is
 * loaded after mount; commands sent before it is ready are queued and replayed.
 */
export const LeafletMap = forwardRef<MapHandle, LeafletMapProps>(function LeafletMap(
  { onMapClick, onFacilityClick },
  ref,
) {
  const container = useRef<HTMLDivElement>(null);
  const scene = useRef<MapScene | null>(null);
  const queue = useRef<SceneOp[]>([]);

  const emitMapClick = useEffectEvent((lat: number, lng: number) => onMapClick?.(lat, lng));
  const emitFacilityClick = useEffectEvent((id: string) => onFacilityClick?.(id));

  useImperativeHandle(ref, () => {
    const run = (op: SceneOp) => {
      if (scene.current) op(scene.current);
      else queue.current.push(op);
    };
    return {
      setPin: (lat, lng) => run((s) => s.setPin(lat, lng)),
      setTrace: (trace) => run((s) => s.setTrace(trace)),
      selectFacility: (id, pan) => run((s) => s.selectFacility(id, pan)),
      filterFacilities: (ids) => run((s) => s.filterFacilities(ids)),
      clear: () => run((s) => s.clear()),
      fitTo: (bounds) => run((s) => s.fitTo(bounds)),
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let created: MapScene | null = null;
    loadLeaflet()
      .then((L) => {
        if (disposed || !container.current) return;
        created = createScene(L, container.current, {
          onMapClick: (lat, lng) => emitMapClick(lat, lng),
          onFacilityClick: (id) => emitFacilityClick(id),
        });
        scene.current = created;
        const pending = queue.current.splice(0);
        pending.forEach((op) => op(created as MapScene));
      })
      .catch((e: unknown) => console.error('Map failed to load', e));
    return () => {
      disposed = true;
      scene.current = null;
      created?.destroy();
    };
  }, []);

  return <div ref={container} style={FILL} role="application" aria-label="River map. Click a stream to trace upstream." />;
});
