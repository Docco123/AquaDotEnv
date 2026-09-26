/**
 * Example pins for the empty state. Every point was checked against USGS NLDI
 * (`/linked-data/comid/position`) and snaps to the named river's NHDPlus reach.
 */
export interface ExamplePlace {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lng: number;
}

export const EXAMPLES: readonly ExamplePlace[] = [
  {
    id: 'charles',
    label: 'Charles River at Watertown, MA',
    detail: 'Suburban river flowing into Boston',
    lat: 42.365,
    lng: -71.18,
  },
  {
    id: 'elk',
    label: 'Elk River above Charleston, WV intake',
    detail: 'Where the 2014 chemical spill reached the water supply',
    lat: 38.3793,
    lng: -81.6009,
  },
  {
    id: 'des-plaines',
    label: 'Des Plaines River, IL',
    detail: 'Western Chicago suburbs',
    lat: 41.86,
    lng: -87.83,
  },
  {
    id: 'ohio',
    label: 'Ohio River at Cincinnati, OH',
    detail: 'A big river with many major dischargers',
    lat: 39.09,
    lng: -84.51,
  },
  {
    id: 'american',
    label: 'American River, Sacramento, CA',
    detail: 'Snowmelt river through the capital',
    lat: 38.567,
    lng: -121.385,
  },
];
