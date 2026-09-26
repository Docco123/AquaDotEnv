/**
 * Upstream flow network from NLDI flowlines (pure, unit-testable).
 *
 * NHDPlus flowlines are digitized in the downstream direction, so a flowline's LAST vertex equals the FIRST vertex
 * of the flowline it drains into. Matching those end nodes (rounded to ~1 m) gives the upstream graph; a shortest-path
 * walk from the pin accumulates river distance. The pin's own flowline is trimmed at the pin so only water that
 * actually passes the pin is included.
 */
import type { Flowline } from '../types';
import { type LngLat, polylineLengthKm, projectOntoPolyline } from './geo';

/** Node-matching precision: 5 decimal degrees is about 1 m. */
const NODE_DECIMALS = 5;
/** A point more than this far from its indexed flowline is placed by nearest vertex instead. */
const MAX_OFF_LINE_KM = 0.5;
/** Nearest-vertex fallback radius when a feature's comid is not in the network. */
const MAX_FALLBACK_KM = 1;
/** Features within this distance downstream of the pin are treated as at the pin (snapping noise). */
const PIN_TOLERANCE_KM = 0.05;

export interface RawFlowline {
  comid: number;
  coords: LngLat[];
}

export interface UpstreamNetwork {
  flowlines: Flowline[];
  byComid: Map<number, Flowline>;
  pinComid: number;
  /** Full (untrimmed) pin flowline and the pin's position along it, for placing features on that flowline. */
  pinLineCoords: LngLat[];
  pinAlongKm: number;
  /** Flowlines NLDI returned that could not be connected to the pin. */
  disconnected: number;
}

const nodeKey = (c: LngLat) => `${c[0].toFixed(NODE_DECIMALS)},${c[1].toFixed(NODE_DECIMALS)}`;

function trimAtPin(coords: LngLat[], pin: LngLat): { coords: LngLat[]; alongKm: number } {
  const proj = projectOntoPolyline(pin, coords);
  return { coords: [...coords.slice(0, proj.segment), proj.point], alongKm: proj.alongKm };
}

function indexByEndNode(lines: RawFlowline[]): Map<string, RawFlowline[]> {
  const byEnd = new Map<string, RawFlowline[]>();
  for (const l of lines) {
    const k = nodeKey(l.coords[l.coords.length - 1]);
    const list = byEnd.get(k);
    if (list) list.push(l);
    else byEnd.set(k, [l]);
  }
  return byEnd;
}

/** Shortest river distance from each flowline's downstream end to the pin (Bellman-Ford style relaxation on a near-tree). */
function walkUpstream(pinLine: RawFlowline, pinLengthKm: number, lines: RawFlowline[]): Map<number, { dist: number; len: number }> {
  const byEnd = indexByEndNode(lines);
  const result = new Map<number, { dist: number; len: number }>([[pinLine.comid, { dist: 0, len: pinLengthKm }]]);
  const queue: RawFlowline[] = [pinLine];
  while (queue.length) {
    const line = queue.shift()!;
    const here = result.get(line.comid)!;
    for (const up of byEnd.get(nodeKey(line.coords[0])) ?? []) {
      if (up.comid === pinLine.comid) continue;
      const dist = here.dist + here.len;
      const known = result.get(up.comid);
      if (known && known.dist <= dist) continue;
      result.set(up.comid, { dist, len: known?.len ?? polylineLengthKm(up.coords) });
      queue.push(up);
    }
  }
  return result;
}

export function buildUpstreamNetwork(lines: RawFlowline[], pinComid: number, pin: LngLat, mainstem: Set<number>): UpstreamNetwork {
  const pinLine = lines.find((l) => l.comid === pinComid);
  if (!pinLine) throw new Error('The snapped river reach is missing from the upstream network.');
  const trimmed = trimAtPin(pinLine.coords, pin);
  const reached = walkUpstream(pinLine, trimmed.alongKm, lines);
  const flowlines: Flowline[] = [];
  for (const l of lines) {
    const r = reached.get(l.comid);
    if (!r) continue;
    flowlines.push({
      comid: l.comid,
      coords: l.comid === pinComid ? trimmed.coords : l.coords,
      lengthKm: r.len,
      distToPinKm: r.dist,
      mainstem: mainstem.has(l.comid),
    });
  }
  return {
    flowlines,
    byComid: new Map(flowlines.map((f) => [f.comid, f])),
    pinComid,
    pinLineCoords: pinLine.coords,
    pinAlongKm: trimmed.alongKm,
    disconnected: lines.length - flowlines.length,
  };
}

/** River km upstream of the pin for a point on flowline `comid`; negative = downstream of the pin. */
function riverKmOnLine(p: LngLat, line: Flowline, net: UpstreamNetwork): number | null {
  if (line.comid === net.pinComid) {
    const proj = projectOntoPolyline(p, net.pinLineCoords);
    return proj.offLineKm > MAX_OFF_LINE_KM ? null : net.pinAlongKm - proj.alongKm;
  }
  const proj = projectOntoPolyline(p, line.coords);
  if (proj.offLineKm > MAX_OFF_LINE_KM) return null;
  return line.distToPinKm + (line.lengthKm - proj.alongKm);
}

function riverKmByNearestVertex(p: LngLat, net: UpstreamNetwork): number | null {
  let best: { d: number; km: number } | null = null;
  for (const line of net.flowlines) {
    const proj = projectOntoPolyline(p, line.coords);
    if (proj.offLineKm > MAX_FALLBACK_KM || (best && best.d <= proj.offLineKm)) continue;
    best = { d: proj.offLineKm, km: line.distToPinKm + (line.lengthKm - proj.alongKm) };
  }
  return best?.km ?? null;
}

/**
 * Network distance (km) from a point to the pin. NLDI indexes NPDES/NWIS points exactly onto their flowline
 * (verified < 1 m), so projecting onto that flowline is exact; the reach `measure` is NOT used because a reachcode
 * can span several flowlines (measure/100 * lengthKm was off by up to 75% of a flowline for 10% of Charles River
 * facilities). Returns null when the point cannot be placed, and a negative number when it lies downstream of the pin.
 */
export function placeOnNetwork(p: LngLat, comid: number | null, net: UpstreamNetwork): number | null {
  const line = comid !== null ? net.byComid.get(comid) : undefined;
  const km = line ? riverKmOnLine(p, line, net) : null;
  const placed = km ?? riverKmByNearestVertex(p, net);
  if (placed === null) return null;
  return placed < 0 && placed > -PIN_TOLERANCE_KM ? 0 : placed;
}
