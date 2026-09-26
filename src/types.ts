export type HucLevel = 4 | 8 | 12;

export interface Feature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

/** A watershed (hydrologic unit) with its boundary as GeoJSON. */
export interface Huc {
  code: string;
  name: string;
  level: HucLevel;
  areaSqKm?: number;
  states?: string;
  feature: Feature;
}

export type ComplianceClass = 'snc' | 'effluent' | 'violation' | 'ok' | 'nodata';

export type PermitGroup = 'major' | 'individual' | 'general' | 'pretreatment';

/** One NPDES permit / facility from ECHO's CWA facility search. */
export interface Facility {
  id: string; // NPDES permit id (SourceID)
  registryId: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  permitType: string;
  group: PermitGroup;
  major: boolean;
  potw: boolean;
  designFlowMgd: number | null;
  huc12: string | null;
  huc12Name: string | null;
  receivingWater: string | null;
  compliance: ComplianceClass;
  sncStatus: string | null;
  qtrHistory: string; // last 13 quarters, most recent last
  effluentExceedances1yr: number;
  exceedancePollutants1yr: string | null;
  pollWithViolation: string | null;
  penalties: string | null;
  formalActions: number;
  hasDmrs: boolean;
  lastDmrDate: string | null;
  cso: boolean;
}

/** One row of EPA's Water Pollutant Loading Tool (annual load, one facility x outfall x parameter). */
export interface LoadRow {
  permit: string;
  facility: string;
  huc12: string | null;
  outfall: string;
  paramCode: string;
  param: string;
  lbs: number;
  allowableLbs: number | null;
  overLimitLbs: number | null;
  twf: number | null;
}

export interface DmrValue {
  period: string; // monitoring period end date, ISO
  stat: string; // e.g. "MO AVG"
  value: number | null;
  unit: string | null;
  limit: number | null;
  limitUnit: string | null;
  nodi: string | null; // "No Discharge" etc
  exceedPct: number | null;
  violation: boolean;
}

export interface DmrParameter {
  outfall: string;
  outfallType: string;
  code: string;
  name: string;
  location: string;
  values: DmrValue[];
  exceedances: number;
  latest: DmrValue | null;
}

export interface EffluentSummary {
  permit: string;
  start: string;
  end: string;
  parameters: DmrParameter[];
}
