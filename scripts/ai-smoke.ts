/**
 * Smoke test for the AI explainer's pure parts and one real model call.
 *   npx -y tsx scripts/ai-smoke.ts
 * Reads .env itself (Node 20.9 has no --env-file). Prints token LENGTH only, never the token.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAccessToken } from '../src/lib/ai/auth';
import { readAiConfig } from '../src/lib/ai/config';
import { loadGoogleCredentials } from '../src/lib/ai/credentials';
import { buildFacilityDigest, buildTraceDigest } from '../src/lib/ai/digest';
import { handleExplain, handleExplainRequest } from '../src/lib/ai/handler';
import { buildPrompt } from '../src/lib/ai/prompt';
import type { ExplainRequest } from '../src/lib/ai/types';
import { parseMarkdownLite } from '../src/components/explain/parseMarkdownLite';
import type { UpstreamFacility, UpstreamTrace } from '../src/types';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
  console.log(`  ok  ${message}`);
}

function loadDotEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

function facility(overrides: Partial<UpstreamFacility>): UpstreamFacility {
  return {
    id: 'XX0000000', registryId: '110000000000', name: 'Fixture', city: 'Springfield', state: 'MA',
    lat: 42.1, lng: -72.6, permitType: 'NPDES Individual Permit', group: 'individual', major: false, potw: false,
    designFlowMgd: null, huc12: '010802050101', huc12Name: 'Mill River', receivingWater: 'Mill River',
    compliance: 'ok', sncStatus: null, qtrHistory: '_____________', effluentExceedances1yr: 0,
    exceedancePollutants1yr: null, pollWithViolation: null, penalties: null, formalActions: 0, hasDmrs: true,
    lastDmrDate: '2026-06-30', cso: false, comid: 1, reachcode: null, measure: null, riverKm: 10, travelHours: 5,
    onMainstem: true, risk: { score: 10, level: 'low', reasons: ['No recent violations'] },
    ...overrides,
  };
}

const trace: UpstreamTrace = {
  pin: { lat: 42.1015, lng: -72.5898, comid: 6078267, reachcode: '01080205000123', waterName: 'Connecticut River',
    huc12: '010802050101', huc12Name: 'Mill River-Connecticut River', huc8: '01080205', huc8Name: 'Lower Connecticut', state: 'MA' },
  distanceKm: 50,
  flowlines: [],
  basin: null,
  facilities: [
    facility({ id: 'MA0101630', name: 'Chicopee Water Pollution Control', major: true, potw: true, group: 'major',
      compliance: 'snc', sncStatus: 'Effluent - Monthly Average Limit', qtrHistory: '____VVSSV_SSS',
      effluentExceedances1yr: 7, exceedancePollutants1yr: 'Total suspended solids, E. coli', formalActions: 2,
      penalties: '$12,500', riverKm: 6.4, travelHours: 3.1,
      risk: { score: 91, level: 'high', reasons: ['Significant noncompliance', '7 effluent exceedances in 12 months'] } }),
    facility({ id: 'MA0100455', name: 'Holyoke WPCF', major: true, potw: true, group: 'major', compliance: 'effluent',
      qtrHistory: '________V__V_', effluentExceedances1yr: 2, exceedancePollutants1yr: 'Ammonia', riverKm: 14.2,
      travelHours: 7.4, risk: { score: 64, level: 'elevated', reasons: ['2 effluent exceedances in 12 months'] } }),
    facility({ id: 'MAR05A123', name: 'Acme Metal Finishing', group: 'general', permitType: 'General Permit Covered Facility',
      compliance: 'nodata', hasDmrs: false, qtrHistory: '', riverKm: 3.0, travelHours: 1.4,
      risk: { score: 5, level: 'unknown', reasons: ['No monitoring data'] } }),
    facility({ id: 'MA0004321', name: 'Old Mill Dye Works', permitActive: false, permitStatus: 'Expired',
      permitStatusCode: 'EXP', compliance: 'effluent', effluentExceedances1yr: 3, exceedancePollutants1yr: 'Copper',
      riverKm: 9.0, travelHours: 4.4, risk: { score: 70, level: 'elevated', reasons: ['3 exceedances in 12 months'] } }),
    facility({ id: 'MA0009999', name: 'Closed Paper Co', permitActive: false, permitStatus: 'Terminated',
      permitStatusCode: 'TRM', compliance: 'nodata', riverKm: 2.0, travelHours: 1.0,
      risk: { score: 2, level: 'unknown', reasons: ['Permit terminated'] } }),
  ],
  gauges: [{ id: 'USGS-01172010', name: 'Connecticut River at Holyoke, MA', comid: 1, lat: 42.2, lng: -72.6,
    uri: 'https://waterdata.usgs.gov', riverKm: 12, flowCfs: 11800, flowTime: '2026-09-26T12:00:00Z' }],
  summary: { total: 5, withViolations: 2, snc: 1, effluentExceedances: 2, majors: 2, nearestViolatorKm: 6.4, highRisk: 1,
    activeTotal: 3, inactive: 2 },
  velocityMps: 0.5,
  generatedAt: '2026-09-26T15:00:00.000Z',
  sources: ['EPA ECHO CWA facility search', 'USGS NLDI upstream navigation', 'USGS Water Services IV'],
};

async function main() {
  console.log('1. Digest + prompt (pure)');
  const digest = buildTraceDigest(trace);
  assert(digest.facilities[0].id === 'MA0101630', 'facilities sorted by risk (highest first)');
  assert(digest.facilities[0].riverMiles === 4, 'km converted to miles (6.4 km -> 4 mi)');
  assert(digest.facilities[0].quartersInSnc === 5, 'SNC quarters counted from qtrHistory');
  assert(digest.velocity.milesPerHour === 1.1, 'velocity 0.5 m/s -> 1.1 mph');
  assert(digest.summary.activePermitsUpstream === 3 && digest.summary.inactivePermits === 2, 'headline counts are active-only, inactive passed separately');
  assert(digest.facilities.every((f) => f.permitActive) && digest.facilities.length === 3, 'top list holds active permits only');
  assert(digest.inactivePermitsOfNote.length === 1 && digest.inactivePermitsOfNote[0].permitStatus === 'Expired',
    'only inactive permits with recent exceedances/SNC are flagged (with permitStatus)');
  const small = buildTraceDigest(trace, { maxFacilities: 1 });
  assert(small.omitted.count === 2, 'omitted count reported when list is capped');
  const fd = buildFacilityDigest(trace.facilities[0]);
  assert(fd.registryId === '110000000000' && fd.quarterHistory.length === 13, 'facility digest has full fields');
  const request: ExplainRequest = { kind: 'trace', digest };
  const prompt = buildPrompt(request);
  assert(prompt.systemInstruction.includes("## Who's breaking the rules"), 'trace prompt has required sections');
  assert(buildPrompt({ kind: 'facility', digest, facility: fd }).systemInstruction.includes('## Watch for'), 'facility prompt has required sections');
  console.log(`  digest bytes: ${JSON.stringify(digest).length}, prompt chars: ${prompt.systemInstruction.length + prompt.userText.length}`);
  const blocks = parseMarkdownLite('## Title\n- **Bold** item\nPlain');
  assert(blocks.length === 3 && blocks[1].type === 'bullet' && blocks[1].spans[0].bold, 'markdown-lite parser');

  console.log('2. Validation + not-configured path (handler called directly)');
  const noCreds = { CLOUDSDK_CONFIG: '/nonexistent-gcloud-dir' };
  const res503 = await handleExplainRequest(
    new Request('http://localhost/api/explain', { method: 'POST', body: JSON.stringify(request) }), noCreds);
  const body503 = (await res503.json()) as { error: string; hint: string };
  console.log('  ', res503.status, JSON.stringify(body503));
  assert(res503.status === 503 && body503.error === 'AI not configured' && !!body503.hint, '503 shape when nothing configured');
  const bad = await handleExplain({ kind: 'nope', digest }, noCreds);
  assert(bad.status === 400, 'wrong kind -> 400');
  const huge = await handleExplainRequest(
    new Request('http://localhost/api/explain', { method: 'POST', body: 'x'.repeat(130 * 1024) }), noCreds);
  assert(huge.status === 400, 'body > 120 KB -> 400');

  console.log('3. Real call using .env');
  const env = { ...process.env, ...loadDotEnv(join(__dirname, '..', '.env')) };
  const config = readAiConfig(env);
  console.log(`   model=${config.model} project=${config.project ?? '(none)'} location=${config.location} apiKey=${config.vertexApiKey ? 'set' : 'unset'}`);
  if (!config.vertexApiKey) {
    const loaded = loadGoogleCredentials(config, env);
    console.log(`   credentials: ${loaded ? `${loaded.credentials.type} from ${loaded.source}` : 'none'}`);
    if (loaded) {
      try {
        const token = await getAccessToken(loaded, AbortSignal.timeout(20_000));
        console.log(`   access token minted, length=${token.length}`);
      } catch (e) {
        console.log(`   token error: ${(e as Error).message}`);
      }
    }
  }
  const started = Date.now();
  const real = await handleExplain(request, env);
  console.log(`   HTTP ${real.status} in ${Date.now() - started} ms`);
  console.log(JSON.stringify(real.body, null, 2));
  if ('text' in real.body) {
    const text = real.body.text;
    console.log(`   mentions an invented agency name: ${/Department of|DEP\b|DEQ\b/.test(text) ? 'YES' : 'no'}`);
    console.log(`   mentions a combined total (5 permits): ${/\b5 (active )?(permits|facilities)/.test(text) ? 'YES' : 'no'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
