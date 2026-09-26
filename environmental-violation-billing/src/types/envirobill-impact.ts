/**
 * Impact types for the demo.
 *
 * NOTE: `schematic` is a DIAGRAM LAYOUT HINT ONLY. It says which stylised
 * waterway line a site is drawn on and how far along that line to draw it.
 * It carries no geographic meaning whatsoever — there are no coordinates,
 * no latitude/longitude, and no mapping data anywhere in this app.
 */

export type ImpactTier = 'Low' | 'Moderate' | 'Severe';

export type WarningStatus = 'draft' | 'issued';

export interface ViolationImpact {
  /** References Violation.id */
  violation_id: string;
  waterway_name: string;
  /** Demo estimate, kilometres. */
  downstream_km_affected: number;
  /** Nearest downstream drinking-water intake. */
  intake_name: string;
  /** Demo estimate, kilometres downstream of the site. */
  intake_distance_km: number;
  /** Demo estimate, whole households. */
  households_exposed: number;
  /** Demo estimate, acres. */
  farmland_acres_affected: number;
  /** Crop or land use, e.g. "Dairy pasture". */
  primary_land_use: string;
  /** Diagram layout only — NOT geographic coordinates. */
  schematic: { branch: 0 | 1 | 2; position: number };
}

export interface WaterWarning {
  id: string;
  violation_id: string;
  status: WarningStatus;
  /** ISO date, from DEMO_TODAY. */
  created_on: string;
  /** ISO date, set when marked issued. */
  issued_on: string | null;
  /** Plain-language advice shown on the printed warning. */
  precaution_text: string;
}
