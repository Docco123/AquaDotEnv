/**
 * Map-tool configuration: layout breakpoints, trace distances, basemaps and
 * the geocoder endpoint. Screen and map code read from here instead of
 * hardcoding values.
 */

/** Upstream navigation distances offered in the top bar (km). */
export const DISTANCE_OPTIONS_KM = [10, 25, 50, 100] as const;
export const DEFAULT_DISTANCE_KM = 50;

export const LAYOUT = {
  topBarHeight: 48,
  panelWidth: 440,
  /** Below this window width the panel stacks under the map. */
  wideBreakpoint: 900,
  /** Share of the window height the map takes when stacked. */
  narrowMapRatio: 0.45,
} as const;

export const LIST = {
  /** Rows rendered before a "show more" button. */
  pageSize: 60,
  /** Only the first N rows get the stagger-in animation. */
  staggerMax: 16,
  staggerStepMs: 28,
} as const;

export const MAP_VIEW = {
  center: [39.5, -97] as [number, number],
  zoom: 4,
  /** Zoom used when a pin lands outside the view or while zoomed far out. */
  pinZoom: 11,
  minPinZoom: 9,
  selectZoom: 12,
  fitPadding: 36,
  fitMaxZoom: 13,
} as const;

const TNM = 'https://basemap.nationalmap.gov/arcgis/rest/services';

/** Keyless USGS The National Map basemaps. The first entry is the default. */
export const BASEMAPS = [
  { name: 'USGS Topo', url: `${TNM}/USGSTopo/MapServer/tile/{z}/{y}/{x}` },
  { name: 'USGS Imagery + topo', url: `${TNM}/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}` },
  { name: 'USGS Shaded relief', url: `${TNM}/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}` },
] as const;

export const HYDRO_OVERLAY = {
  name: 'Rivers & streams (USGS NHD)',
  url: `${TNM}/USGSHydroCached/MapServer/tile/{z}/{y}/{x}`,
  opacity: 0.9,
} as const;

export const TILE_OPTIONS = { maxZoom: 19, maxNativeZoom: 16, attribution: 'USGS The National Map' } as const;

/**
 * OpenStreetMap Nominatim: sends `Access-Control-Allow-Origin: *`, so it works
 * straight from the browser (the US Census geocoder does not send CORS headers).
 * Usage policy: at most one request per second, so we only search on submit.
 */
export const GEOCODER = {
  url: 'https://nominatim.openstreetmap.org/search',
  countryCodes: 'us',
  limit: 5,
} as const;
