import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import type { LeafletMapProps, MapHandle } from './types';

const noop = () => {};

/** Native fallback: the map tool is web-only, so this renders an empty view and ignores commands. */
export const LeafletMap = forwardRef<MapHandle, LeafletMapProps>(function LeafletMap(_props, ref) {
  useImperativeHandle(ref, () => ({
    setPin: noop,
    setTrace: noop,
    selectFacility: noop,
    filterFacilities: noop,
    clear: noop,
    fitTo: noop,
  }));
  return <View style={{ flex: 1 }} />;
});
