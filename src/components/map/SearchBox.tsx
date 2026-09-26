import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { T } from '@/components/ui';
import { ELEVATION } from '@/components/ui/color';
import { useGeocode } from '@/hooks/useGeocode';
import type { GeoResult } from '@/map/geo/geocoder';
import { parseLatLng } from '@/map/geo/latlng';
import { C, FONT, RADIUS, SPACE } from '@/theme';

/** "Address, place, or lat,lng" search. Coordinates drop a pin directly; text is geocoded. */
export function SearchBox({ onPick }: { onPick(lat: number, lng: number): void }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const { state, search, clear } = useGeocode();

  const submit = () => {
    const coords = parseLatLng(text);
    if (coords) {
      clear();
      onPick(coords.lat, coords.lng);
    } else search(text);
  };

  const choose = (r: GeoResult) => {
    setText(r.label);
    clear();
    onPick(r.lat, r.lng);
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Address, place, or lat,lng"
        placeholderTextColor={C.faint}
        returnKeyType="search"
        accessibilityLabel="Search for a place or coordinates"
        style={[styles.input, focused && styles.inputFocused]}
      />
      {state.status !== 'idle' && (
        <View style={styles.dropdown}>
          {state.status === 'searching' && <Text style={[T.small, styles.note]}>Searching…</Text>}
          {state.status === 'error' && <Text style={[T.small, styles.note]}>{state.message}</Text>}
          {state.status === 'done' && state.results.length === 0 && (
            <Text style={[T.small, styles.note]}>No US places found. Try a city, address or “lat, lng”.</Text>
          )}
          {state.status === 'done' &&
            state.results.map((r) => (
              <Pressable key={r.id} onPress={() => choose(r)} accessibilityRole="button" style={styles.result}>
                <Text style={[T.body, styles.resultLabel]} numberOfLines={1}>
                  {r.label}
                </Text>
                {!!r.detail && (
                  <Text style={T.tiny} numberOfLines={1}>
                    {r.detail}
                  </Text>
                )}
              </Pressable>
            ))}
          <Pressable onPress={clear} accessibilityRole="button" style={styles.close}>
            <Text style={T.tiny}>Close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, maxWidth: 420, minWidth: 140, zIndex: 20 },
  input: {
    height: 34,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.md,
    backgroundColor: C.background,
    color: C.text,
    fontFamily: FONT.sans,
    fontSize: 13,
    outlineWidth: 0,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: C.surface },
  dropdown: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: SPACE.xs,
    ...ELEVATION.float,
  },
  note: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm },
  result: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm },
  resultLabel: { fontWeight: '600' },
  close: { alignSelf: 'flex-end', paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs },
});
