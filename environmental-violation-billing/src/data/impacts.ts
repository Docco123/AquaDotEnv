import type { ViolationImpact } from '@/types/envirobill-impact';

/**
 * Illustrative demo estimates. These are NOT measured, modelled, surveyed or
 * sourced figures — they exist so the demo can tell a citizen-and-agriculture
 * impact story. In a real deployment these would come from the agency's own
 * GIS and census layers.
 */
export const impacts: ViolationImpact[] = [
  {
    violation_id: 'v-route9-creek-outfall',
    waterway_name: 'Route 9 Creek',
    downstream_km_affected: 6.4,
    intake_name: 'Riverbend Municipal Intake',
    intake_distance_km: 9.1,
    households_exposed: 1840,
    farmland_acres_affected: 210,
    primary_land_use: 'Row crops (corn, soy)',
    schematic: { branch: 0, position: 22 },
  },
  {
    violation_id: 'v-millbrook-north-lot',
    waterway_name: 'Millbrook Channel',
    downstream_km_affected: 2.1,
    intake_name: 'Riverbend Municipal Intake',
    intake_distance_km: 14.6,
    households_exposed: 320,
    farmland_acres_affected: 45,
    primary_land_use: 'Mixed industrial and scrub',
    schematic: { branch: 1, position: 18 },
  },
  {
    violation_id: 'v-harrow-quarry-access',
    waterway_name: 'Harrow Ditch',
    downstream_km_affected: 3.3,
    intake_name: 'Westfield Community Well Field',
    intake_distance_km: 11.2,
    households_exposed: 210,
    farmland_acres_affected: 120,
    primary_land_use: 'Hay and grazing',
    schematic: { branch: 1, position: 46 },
  },
  {
    violation_id: 'v-blue-heron-wetland',
    waterway_name: 'Blue Heron Marsh Outlet',
    downstream_km_affected: 4.8,
    intake_name: 'Riverbend Municipal Intake',
    intake_distance_km: 7.3,
    households_exposed: 970,
    farmland_acres_affected: 60,
    primary_land_use: 'Protected wetland and buffer',
    schematic: { branch: 0, position: 58 },
  },
  {
    violation_id: 'v-eastgate-transfer',
    waterway_name: 'Eastgate Storm Drain',
    downstream_km_affected: 0.9,
    intake_name: 'Riverbend Municipal Intake',
    intake_distance_km: 18.4,
    households_exposed: 85,
    farmland_acres_affected: 0,
    primary_land_use: 'Paved industrial yard',
    schematic: { branch: 2, position: 30 },
  },
  {
    violation_id: 'v-cedar-ridge-pumphouse',
    waterway_name: 'Cedar Ridge Run',
    downstream_km_affected: 5.7,
    intake_name: 'Westfield Community Well Field',
    intake_distance_km: 6.2,
    households_exposed: 1420,
    farmland_acres_affected: 340,
    primary_land_use: 'Orchard and vegetable fields',
    schematic: { branch: 2, position: 64 },
  },
  {
    violation_id: 'v-pinewood-dairy-field3',
    waterway_name: 'Pinewood Field Ditch',
    downstream_km_affected: 1.6,
    intake_name: 'Westfield Community Well Field',
    intake_distance_km: 15.9,
    households_exposed: 60,
    farmland_acres_affected: 95,
    primary_land_use: 'Dairy pasture',
    schematic: { branch: 1, position: 76 },
  },
];

/** The two downstream intakes referenced above. */
export const intakeNames = [
  'Riverbend Municipal Intake',
  'Westfield Community Well Field',
] as const;

export function getImpactForViolation(violationId: string): ViolationImpact | undefined {
  return impacts.find((i) => i.violation_id === violationId);
}
