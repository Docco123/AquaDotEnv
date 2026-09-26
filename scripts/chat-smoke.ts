/**
 * Smoke test for POST /api/chat: validation paths, the 503 path, and one real streamed answer.
 *   npx -y tsx scripts/chat-smoke.ts
 * Reads .env itself (Node 20.9 has no --env-file). Never prints tokens or keys.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleChat, handleChatRequest } from '../src/lib/ai/chatHandler';
import type { ChatRequest, ChatStreamEvent } from '../src/lib/ai/chatTypes';
import { readAiConfig } from '../src/lib/ai/config';
import { buildFacilityDigest, buildTraceDigest } from '../src/lib/ai/digest';
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

const post = (body: unknown) =>
  new Request('http://localhost/api/chat', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

async function expectStatus(res: Response, status: number, label: string): Promise<void> {
  const text = await res.text();
  console.log(`   ${res.status} ${text.slice(0, 140)}`);
  assert(res.status === status, label);
}

/** Reads the SSE body, printing each event as it arrives. */
async function readEvents(res: Response): Promise<{ events: ChatStreamEvent[]; sawDone: boolean }> {
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  const events: ChatStreamEvent[] = [];
  const acc = { thought: '', text: '' };
  const started = Date.now();
  let buffer = '';
  let sawDone = false;
  let last = '';
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const data = block.replace(/^data: /, '');
      const ms = Date.now() - started;
      if (data === '[DONE]') {
        sawDone = true;
        console.log(`   [${ms} ms] [DONE]`);
        continue;
      }
      const event = JSON.parse(data) as ChatStreamEvent;
      events.push(event);
      if (event.type === 'thought' || event.type === 'text') {
        acc[event.type] += event.text;
        if (last !== event.type) console.log(`   [${ms} ms] -- ${event.type} stream starts`);
        console.log(`   [${ms} ms] ${event.type} +${event.text.length}: ${JSON.stringify(acc[event.type].slice(0, 120))}`);
      } else {
        console.log(`   [${ms} ms] ${JSON.stringify(event)}`);
      }
      last = event.type;
    }
    if (done) break;
  }
  console.log('\n   FULL ANSWER:\n' + acc.text + '\n');
  return { events, sawDone };
}

async function main() {
  const digest = buildTraceDigest(trace);
  const facility = buildFacilityDigest(trace.facilities[0]);
  const question = 'Which upstream facility should I worry about most and why?';
  const good: ChatRequest = { messages: [{ role: 'user', content: question }], context: { digest, facility: null } };
  const noCreds = { CLOUDSDK_CONFIG: '/nonexistent-gcloud-dir' };
  const signal = new AbortController().signal;

  console.log('1. Validation (400)');
  await expectStatus(await handleChatRequest(post('not json'), noCreds), 400, 'invalid JSON -> 400');
  await expectStatus(await handleChatRequest(post([1, 2]), noCreds), 400, 'array body -> 400');
  await expectStatus(handleChat({ messages: 'hi', context: { digest } }, noCreds, signal), 400, 'messages not an array -> 400');
  await expectStatus(handleChat({ messages: [{ role: 'user', content: 'q' }, { role: 'assistant', content: 'a' }], context: { digest } }, noCreds, signal), 400, 'last message not user -> 400');
  const many = Array.from({ length: 31 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
  await expectStatus(handleChat({ messages: many, context: { digest } }, noCreds, signal), 400, '31 messages -> 400');
  await expectStatus(handleChat({ messages: [{ role: 'system', content: 'x' }], context: { digest } }, noCreds, signal), 400, 'role system -> 400');
  await expectStatus(handleChat({ messages: [{ role: 'user', content: '  ' }], context: { digest } }, noCreds, signal), 400, 'blank content -> 400');
  await expectStatus(handleChat({ messages: good.messages, context: {} }, noCreds, signal), 400, 'missing digest -> 400');
  await expectStatus(await handleChatRequest(post('x'.repeat(130 * 1024)), noCreds), 400, 'body > 120 KB -> 400');
  await expectStatus(await handleChatRequest(new Request('http://localhost/api/chat'), noCreds), 405, 'GET -> 405');

  console.log('2. Not configured (503)');
  const res503 = handleChat(good, noCreds, signal);
  const body503 = (await res503.json()) as { error: string; hint?: string };
  console.log(`   ${res503.status} ${JSON.stringify(body503)}`);
  assert(res503.status === 503 && body503.error === 'AI not configured' && !!body503.hint, '503 {error, hint} with no credentials');

  console.log('3. Real streamed call using .env');
  const env = { ...process.env, ...loadDotEnv(join(__dirname, '..', '.env')) };
  const config = readAiConfig(env);
  console.log(`   model=${config.model} location=${config.location} project=${config.project ? 'set' : '(none)'} apiKey=${config.vertexApiKey ? 'set' : 'unset'}`);
  const res = handleChat(good, env, signal);
  console.log(`   HTTP ${res.status} content-type=${res.headers.get('content-type')} cache-control=${res.headers.get('cache-control')} x-accel-buffering=${res.headers.get('x-accel-buffering')}`);
  assert(res.status === 200 && res.headers.get('content-type')?.startsWith('text/event-stream'), 'SSE response');
  const { events, sawDone } = await readEvents(res);
  const counts = events.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.type]: (acc[e.type] ?? 0) + 1 }), {});
  console.log(`   event counts: ${JSON.stringify(counts)}`);
  console.log(`   thought events arrived: ${counts.thought ? 'YES' : 'NO'}`);
  assert(sawDone, 'stream ends with [DONE]');
  assert(events[events.length - 1]?.type === 'done', 'last event is done');

  console.log('4. Follow-up with history + selected facility');
  const answer = events.filter((e) => e.type === 'text').map((e) => (e as { text: string }).text).join('');
  const follow: ChatRequest = {
    messages: [...good.messages, { role: 'assistant', content: answer }, { role: 'user', content: 'How long would a spill from it take to reach me?' }],
    context: { digest, facility },
  };
  const second = await readEvents(handleChat(follow, env, signal));
  assert(second.sawDone && second.events.some((e) => e.type === 'done'), 'multi-turn follow-up streams to done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
