/** Stream gauges upstream of the pin: NLDI-linked NWIS sites placed on the network, with latest discharge. */
import type { Gauge } from '../types';
import { type UpstreamNetwork, placeOnNetwork } from '../lib/network';
import { GAUGE_COUNT, NWIS_MAX_SITES } from './config';
import type { LinkedSite } from './nldi';
import { type FlowReading, fetchLatestDischarge } from './nwis';

const siteNumber = (identifier: string) => identifier.replace(/^USGS-/, '');

function toGauge(site: LinkedSite, riverKm: number, flow: FlowReading | undefined): Gauge {
  return {
    id: site.identifier,
    name: site.name,
    comid: site.comid,
    lat: site.point[1],
    lng: site.point[0],
    uri: site.uri,
    riverKm,
    flowCfs: flow?.cfs ?? null,
    flowTime: flow?.time ?? null,
  };
}

/**
 * The GAUGE_COUNT gauges nearest the pin (by river km). Many NWIS sites are water-quality only, so discharge is fetched
 * for the nearest NWIS_MAX_SITES in one request and gauges with a current reading are preferred; the rest are filled
 * with the nearest sites without one.
 */
export async function loadGauges(sites: LinkedSite[], network: UpstreamNetwork, signal?: AbortSignal): Promise<Gauge[]> {
  const placed = sites
    .map((site) => ({ site, riverKm: placeOnNetwork(site.point, site.comid, network) }))
    .filter((p): p is { site: LinkedSite; riverKm: number } => p.riverKm !== null && p.riverKm >= 0)
    .sort((a, b) => a.riverKm - b.riverKm)
    .slice(0, NWIS_MAX_SITES);
  const flows = await fetchLatestDischarge(placed.map((p) => siteNumber(p.site.identifier)), signal);
  const withFlow = placed.filter((p) => flows.has(siteNumber(p.site.identifier)));
  const without = placed.filter((p) => !flows.has(siteNumber(p.site.identifier)));
  return [...withFlow, ...without]
    .slice(0, GAUGE_COUNT)
    .sort((a, b) => a.riverKm - b.riverKm)
    .map((p) => toGauge(p.site, p.riverKm, flows.get(siteNumber(p.site.identifier))));
}
