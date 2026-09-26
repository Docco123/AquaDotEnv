// End-to-end smoke test against live services: npx -y tsx scripts/smoke-trace.ts
import { traceUpstream } from '../src/api/upstream';

const PINS: [string, number, number][] = [
  ['Charles River at Watertown MA', 42.365, -71.18],
  ['Elk River above Charleston WV intake', 38.372, -81.598],
  ['Des Plaines River near Chicago IL', 41.86, -87.83],
];

async function run(label: string, lat: number, lng: number) {
  const t0 = Date.now();
  const t = await traceUpstream(lat, lng);
  const s = t.summary;
  const matched = t.facilities.filter((f) => !f.missingInEcho && !f.echoLookupFailed).length;
  const active = t.facilities.filter((f) => f.permitActive).length;
  console.log(`\n=== ${label}  (${Date.now() - t0} ms)`);
  console.log(`water ${t.pin.waterName} (${t.pin.reachcode}); velocity ${t.velocityMps.toFixed(3)} m/s from ${t.velocitySource}`);
  console.log(`active ${s.activeTotal}, inactive ${s.inactive}; gauges: ${t.gauges.map((g) => `${g.name} ${g.riverKm?.toFixed(1)} km ${g.flowCfs ?? '-'} cfs @ ${g.flowTime ?? '-'}`).join(' | ')}`);
  console.log(`pin comid ${t.pin.comid} snapped ${t.pin.snapDistanceKm?.toFixed(3)} km; HUC12 ${t.pin.huc12Name}; HUC8 ${t.pin.huc8Name}; ${t.pin.state}`);
  console.log(`flowlines ${t.flowlines.length} (mainstem ${t.flowlines.filter((f) => f.mainstem).length}), max dist ${Math.max(...t.flowlines.map((f) => f.distToPinKm + f.lengthKm)).toFixed(1)} km, basin ${t.basin ? 'yes' : 'no'}`);
  console.log(`facilities ${s.total}, ECHO matched ${matched}, missing ${t.facilities.filter((f) => f.missingInEcho).length}, active permits ${active}, violators ${s.withViolations}, SNC ${s.snc}, exceedances ${s.effluentExceedances}, majors ${s.majors}, high risk ${s.highRisk}, nearest violator ${s.nearestViolatorKm?.toFixed(1)} km, gauges ${t.gauges.length}`);
  const levels: Record<string, number> = {};
  t.facilities.forEach((f) => (levels[f.risk.level] = (levels[f.risk.level] ?? 0) + 1));
  console.log('risk levels', JSON.stringify(levels), 'timings', JSON.stringify(t.timingsMs), 'warnings', JSON.stringify(t.warnings));
  for (const f of t.facilities.slice(0, 5)) {
    console.log(`  [${f.risk.level} ${f.risk.score}] ${f.name} (${f.id}) ${f.riverKm?.toFixed(1)} km, ${f.travelHours?.toFixed(1)} h, ${f.compliance}, ${f.permitStatus}, outfall ${f.nearestOutfallId}; ${f.risk.reasons.slice(0, 4).join('; ')}`);
  }
}

(async () => {
  for (const [label, lat, lng] of PINS) {
    try {
      await run(label, lat, lng);
    } catch (e) {
      console.log(`\n=== ${label} FAILED: ${(e as Error).message}`);
    }
  }
  const t0 = Date.now();
  await traceUpstream(42.365, -71.18);
  console.log(`\ncached re-run: ${Date.now() - t0} ms`);
})();
