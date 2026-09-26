/**
 * traceUpstream: everything that drains to a point on a river.
 * snap (NLDI position) -> network (NLDI UT/UM flowlines + basin) -> facilities (NLDI-linked NPDES permits placed on the
 * network) -> echo (ECHO compliance per permit) -> gauges -> score (risk + summary).
 */
import type { Facility, Gauge, PinPoint, TraceOptions, TraceStage, UpstreamFacility, UpstreamTrace } from '../types';
import { type LngLat, haversineKm } from '../lib/geo';
import { type UpstreamNetwork, buildUpstreamNetwork, placeOnNetwork } from '../lib/network';
import { compareByRisk, scoreRisk, summarize } from '../lib/risk';
import { type VelocityChoice, chooseVelocity, travelHours } from '../lib/travel';
import { throwIfAborted } from '../lib/async';
import { DEFAULT_TRACE_KM, TRACE_CACHE_MAX, TRACE_CACHE_TTL_MS } from './config';
import { type EchoLookup, fetchFacilitiesByIds, toPermitId } from './echo';
import { loadGauges } from './gauges';
import { type ReachAttributes, fetchReachAttributes } from './nhdplus';
import { type LinkedSite, fetchBasin, fetchFlowlines, fetchLinkedSites, snapToReach } from './nldi';
import { fetchHucInfoAtPoint } from './wbd';

const NO_STREAM = 'No mapped stream within reach of that point. Try clicking directly on a river or lake.';
/** Cache key precision: 1e-4 degrees is about 11 m. */
const CACHE_DECIMALS = 4;

interface Ctx {
  distanceKm: number;
  signal?: AbortSignal;
  warnings: string[];
  timings: Partial<Record<TraceStage, number>>;
  onStage?: TraceOptions['onStage'];
}

const traceCache = new Map<string, { at: number; trace: UpstreamTrace }>();

async function stage<T>(ctx: Ctx, name: TraceStage, detail: string, work: () => Promise<T>): Promise<T> {
  throwIfAborted(ctx.signal);
  ctx.onStage?.(name, detail);
  const t0 = Date.now();
  const result = await work();
  ctx.timings[name] = Date.now() - t0;
  return result;
}

/** Run a non-essential request; on failure record a warning and return the fallback. */
async function optional<T>(ctx: Ctx, what: string, p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (ctx.signal?.aborted) throw err;
    ctx.warnings.push(`${what} unavailable: ${(err as Error).message}`);
    return fallback;
  }
}

// ---------------------------------------------------------------- snap

async function snapPin(lat: number, lng: number, ctx: Ctx): Promise<{ pin: PinPoint; reachCoords: LngLat[] }> {
  const [reach, huc12, huc8] = await Promise.all([
    snapToReach(lat, lng, ctx.signal),
    optional(ctx, 'Subwatershed name', fetchHucInfoAtPoint(12, lat, lng, ctx.signal), null),
    optional(ctx, 'Watershed name', fetchHucInfoAtPoint(8, lat, lng, ctx.signal), null),
  ]);
  if (!reach) throw new Error(NO_STREAM);
  const click: LngLat = [lng, lat];
  const snapped = nearestPointOn(click, reach.coords);
  const pin: PinPoint = {
    lat: snapped[1],
    lng: snapped[0],
    comid: reach.comid,
    reachcode: null,
    waterName: null,
    huc12: huc12?.code ?? null,
    huc12Name: huc12?.name ?? null,
    huc8: huc8?.code ?? null,
    huc8Name: huc8?.name ?? null,
    state: (huc12?.states ?? huc8?.states ?? '').split(',')[0] || null,
    inputLat: lat,
    inputLng: lng,
    snapDistanceKm: haversineKm(click, snapped),
  };
  return { pin, reachCoords: reach.coords };
}

function nearestPointOn(p: LngLat, coords: LngLat[]): LngLat {
  if (!coords.length) return p;
  const net = buildUpstreamNetwork([{ comid: 0, coords }], 0, p, new Set());
  const trimmed = net.flowlines[0].coords;
  return trimmed[trimmed.length - 1];
}

// ---------------------------------------------------------------- network

async function loadNetwork(pin: PinPoint, ctx: Ctx) {
  const [ut, um, basin] = await Promise.all([
    fetchFlowlines(pin.comid, 'UT', ctx.distanceKm, ctx.signal),
    optional(ctx, 'Main-stem trace', fetchFlowlines(pin.comid, 'UM', ctx.distanceKm, ctx.signal), []),
    optional(ctx, 'Drainage basin outline', fetchBasin(pin.comid, ctx.signal), null),
  ]);
  const mainstem = new Set(um.map((l) => l.comid));
  const network = buildUpstreamNetwork(ut, pin.comid, [pin.lng, pin.lat], mainstem);
  if (network.disconnected > 0) ctx.warnings.push(`${network.disconnected} upstream flowlines could not be connected to the pin and were left out.`);
  return { network, basin };
}

// ---------------------------------------------------------------- facilities

interface PlacedSite {
  site: LinkedSite;
  riverKm: number | null;
}

/** Place every NLDI-linked permit on the network, drop those downstream of the pin, and group outfall ids by permit. */
function placePermits(sites: LinkedSite[], network: UpstreamNetwork): Map<string, PlacedSite[]> {
  const byPermit = new Map<string, PlacedSite[]>();
  for (const site of sites) {
    const riverKm = placeOnNetwork(site.point, site.comid, network);
    if (riverKm !== null && riverKm < 0) continue; // on the pin's reach but downstream of the pin
    const id = toPermitId(site.identifier);
    byPermit.set(id, [...(byPermit.get(id) ?? []), { site, riverKm }]);
  }
  return byPermit;
}

/** The outfall nearest the pin represents the permit. */
function nearestOutfall(placed: PlacedSite[]): PlacedSite {
  return placed.reduce((best, p) => ((p.riverKm ?? Infinity) < (best.riverKm ?? Infinity) ? p : best));
}

/** Stand-in for a permit id ECHO did not return. */
function minimalFacility(id: string, site: LinkedSite): Facility {
  return {
    id,
    registryId: '',
    name: id,
    city: '',
    state: id.slice(0, 2),
    lat: site.point[1],
    lng: site.point[0],
    permitType: 'Unknown (not in EPA ECHO)',
    group: 'general',
    major: false,
    potw: false,
    designFlowMgd: null,
    huc12: null,
    huc12Name: null,
    receivingWater: null,
    compliance: 'nodata',
    sncStatus: null,
    qtrHistory: '-'.repeat(13),
    effluentExceedances1yr: 0,
    exceedancePollutants1yr: null,
    pollWithViolation: null,
    penalties: null,
    formalActions: 0,
    hasDmrs: false,
    lastDmrDate: null,
    cso: false,
  };
}

function buildFacility(id: string, placed: PlacedSite[], echo: EchoLookup, network: UpstreamNetwork, ctx: Ctx, velocityMps: number): UpstreamFacility {
  const rep = nearestOutfall(placed);
  const found = echo.facilities.get(id);
  const base = found ?? minimalFacility(id, rep.site);
  const comid = rep.site.comid;
  const onMainstem = comid !== null && (network.byComid.get(comid)?.mainstem ?? false);
  const outfall = { nearestOutfallId: rep.site.identifier, outfallPoint: rep.site.point };
  const flags = found ? {} : echo.failed.includes(id) ? { echoLookupFailed: true } : { missingInEcho: true };
  const f = { ...base, ...flags };
  return {
    ...f,
    comid,
    reachcode: rep.site.reachcode,
    measure: rep.site.measure,
    riverKm: rep.riverKm,
    travelHours: travelHours(rep.riverKm, velocityMps),
    onMainstem,
    risk: scoreRisk(f, { riverKm: rep.riverKm, distanceKm: ctx.distanceKm, onMainstem }),
    nldiIds: placed.map((p) => p.site.identifier),
    ...outfall,
  };
}

// ---------------------------------------------------------------- orchestration

function sourcesFor(ctx: Ctx, echo: EchoLookup, velocity: VelocityChoice, gauges: Gauge[], now: Date): string[] {
  const flowTimes = gauges.map((g) => g.flowTime).filter((x): x is string => !!x).sort();
  return [
    `USGS NLDI upstream navigation (NHDPlus V2), ${ctx.distanceKm} km along the river network`,
    `EPA ECHO Clean Water Act facility data (ICIS-NPDES), retrieved ${now.toISOString().slice(0, 10)}; ${echo.facilities.size} permits matched`,
    'USGS Watershed Boundary Dataset for watershed names; EPA WATERS NHDPlus V2 for the river name',
    `Travel times use ${velocity.velocityMps.toFixed(2)} m/s: ${velocity.source}`,
    flowTimes.length ? `USGS NWIS instantaneous discharge, latest reading ${flowTimes[flowTimes.length - 1]}` : 'USGS NWIS: no current discharge readings nearby',
  ];
}

function applyReach(pin: PinPoint, reach: ReachAttributes | null): void {
  pin.waterName = reach?.gnisName ?? null;
  pin.reachcode = reach?.reachcode ?? null;
}

async function runTrace(lat: number, lng: number, ctx: Ctx): Promise<UpstreamTrace> {
  const { pin } = await stage(ctx, 'snap', 'Finding the nearest mapped river', () => snapPin(lat, lng, ctx));
  // These only need the comid: start them now so they overlap with the network download.
  const npdesP = fetchLinkedSites(pin.comid, 'npdes', ctx.distanceKm, ctx.signal);
  const gaugeSitesP = fetchLinkedSites(pin.comid, 'nwissite', ctx.distanceKm, ctx.signal);
  const reachP = optional(ctx, 'River name and velocity (EPA NHDPlus)', fetchReachAttributes(pin.comid, ctx.signal), null);
  [npdesP, gaugeSitesP].forEach((p) => p.catch(() => undefined));
  const { network, basin } = await stage(ctx, 'network', 'Tracing the river network upstream', () => loadNetwork(pin, ctx));
  const byPermit = await stage(ctx, 'facilities', 'Finding permitted dischargers', async () => placePermits(await npdesP, network));
  const echo = await stage(ctx, 'echo', `Checking ${byPermit.size} permits in EPA ECHO`, () => fetchFacilitiesByIds([...byPermit.keys()], ctx.signal));
  if (echo.failed.length) ctx.warnings.push(`EPA ECHO lookup failed for ${echo.failed.length} permits: ${echo.errors[0]}`);
  const gauges = await stage(ctx, 'gauges', 'Checking stream gauges', () =>
    optional(ctx, 'Stream gauges', gaugeSitesP.then((sites) => loadGauges(sites, network, ctx.signal)), [] as Gauge[]),
  );
  const reach = await reachP;
  applyReach(pin, reach);
  const velocity = chooseVelocity(reach?.meanAnnualVelocityMps ?? null);
  const facilities = await stage(ctx, 'score', 'Scoring risk', async () =>
    [...byPermit.entries()].map(([id, placed]) => buildFacility(id, placed, echo, network, ctx, velocity.velocityMps)).sort(compareByRisk),
  );
  const now = new Date();
  return {
    pin,
    distanceKm: ctx.distanceKm,
    flowlines: network.flowlines,
    basin,
    facilities,
    gauges,
    summary: summarize(facilities),
    velocityMps: velocity.velocityMps,
    velocitySource: velocity.source,
    generatedAt: now.toISOString(),
    sources: sourcesFor(ctx, echo, velocity, gauges, now),
    warnings: ctx.warnings,
    timingsMs: ctx.timings,
  };
}

const cacheKey = (lat: number, lng: number, km: number) => `${lat.toFixed(CACHE_DECIMALS)},${lng.toFixed(CACHE_DECIMALS)},${km}`;

function cached(key: string): UpstreamTrace | null {
  const hit = traceCache.get(key);
  if (!hit || Date.now() - hit.at > TRACE_CACHE_TTL_MS) return null;
  return hit.trace;
}

function remember(key: string, trace: UpstreamTrace): void {
  if (traceCache.size >= TRACE_CACHE_MAX) traceCache.delete(traceCache.keys().next().value as string);
  traceCache.set(key, { at: Date.now(), trace });
}

export async function traceUpstream(lat: number, lng: number, opts: TraceOptions = {}): Promise<UpstreamTrace> {
  const distanceKm = opts.distanceKm ?? DEFAULT_TRACE_KM;
  const key = cacheKey(lat, lng, distanceKm);
  const hit = cached(key);
  if (hit) {
    opts.onStage?.('done', 'cached');
    return hit;
  }
  const ctx: Ctx = { distanceKm, signal: opts.signal, warnings: [], timings: {}, onStage: opts.onStage };
  const trace = await runTrace(lat, lng, ctx);
  remember(key, trace);
  opts.onStage?.('done', `${trace.facilities.length} facilities upstream`);
  return trace;
}
