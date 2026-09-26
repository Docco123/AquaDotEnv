/** Endpoints, timeouts and batch sizes for every upstream data source. All services are keyless and send CORS headers. */
export const ENDPOINTS = {
  nldi: 'https://api.water.usgs.gov/nldi/linked-data',
  echo: 'https://echodata.epa.gov/echo',
  echoReport: 'https://echo.epa.gov/detailed-facility-report',
  wbd: 'https://hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer',
  /** EPA WATERS NHDPlus V2 "Network Flowline" layer (GNIS name, reachcode, EROM mean-annual flow/velocity). */
  nhdplusFlowline: 'https://watersgeo.epa.gov/arcgis/rest/services/NHDPlus/NHDPlus/MapServer/2',
  nwisIv: 'https://waterservices.usgs.gov/nwis/iv/',
} as const;

/** Per-request timeouts (ms). ECHO effluent charts for large permits can take ~25 s. */
export const TIMEOUT_MS = {
  nldi: 30_000,
  echo: 45_000,
  echoEffluent: 60_000,
  wbd: 30_000,
  /** Optional enrichment: kept short so it never holds up a trace. */
  nhdplus: 8_000,
  nwis: 15_000,
} as const;

/** One retry on network failure / timeout / 5xx, after this pause. */
export const RETRY_DELAY_MS = 800;
/** Max memoised GET responses kept in memory. */
export const HTTP_CACHE_MAX = 200;

/** ECHO id lookups: ids per request and parallel requests. */
export const ECHO_ID_CHUNK = 100;
export const ECHO_CONCURRENCY = 4;
/** ECHO page size for get_qid / annual loads (5000 verified to work). */
export const ECHO_PAGE_SIZE = 5000;

/** Default upstream navigation distance (km). */
export const DEFAULT_TRACE_KM = 50;
/** Completed traces are reused for this long (ms). */
export const TRACE_CACHE_TTL_MS = 15 * 60_000;
export const TRACE_CACHE_MAX = 20;

/** Stream gauges kept per trace, and the max sites sent in the single NWIS request. */
export const GAUGE_COUNT = 3;
export const NWIS_MAX_SITES = 100;
/** Discharge readings older than this are dropped as stale (some sites still report 2015 values). */
export const FLOW_MAX_AGE_MS = 7 * 24 * 3_600_000;
