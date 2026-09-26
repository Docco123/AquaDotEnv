# UpstreamWatch

Drop a pin on any US river, lake, or pond. UpstreamWatch traces the water upstream on the USGS NHDPlus
flow network, lists every EPA-permitted discharger feeding that point, scores each one from its EPA ECHO
violation record, estimates how long a spill would take to reach you, and summarizes it in plain English.

The data is public, but it's buried. This app digs it up and delivers it to the people downstream.

Web app (Expo + Expo Router + react-native-web). No mobile-specific features.

## Run

Requires Node 20.19+ (Node 22 recommended; Expo's `.env` loader needs `util.parseEnv`).

```bash
npm install
npx expo start --web     # http://localhost:8081
```

Routes: `/` landing page, `/map` the tool. The AI summary needs Google Cloud credentials (see below);
everything else is keyless.

## How a trace works (`src/api/upstream.ts`)

| Stage | Source | What happens |
|---|---|---|
| snap | USGS NLDI `linked-data/comid/position` | Pin is snapped to the nearest NHDPlus reach (comid). Watershed names/state from USGS WBD. |
| network | NLDI `navigation/UT/flowlines`, `UM/flowlines`, `basin` | All flowlines within N km upstream, main stem flagged, upstream drainage outline. Flowlines are chained by matching endpoints and walked from the pin to get network distance. |
| facilities | NLDI `navigation/UT/npdes` | NPDES permits placed on that network, with river distance from the pin. |
| echo | EPA ECHO `cwa_rest_services.get_facility_info` | Compliance, 13-quarter history, exceedances, enforcement, penalties, permit status, flow, impaired pollutants (columns verified against `cwa_rest_services.metadata`). |
| gauges | NLDI `navigation/UT/nwissite` + USGS NWIS IV | Nearest stream gauges and current discharge. |
| score | `src/lib/risk.ts` | Deterministic 0–100 risk score with reasons; travel time from distance and stream velocity. |

Facility detail pulls 12 months of Discharge Monitoring Reports (`eff_rest_services.get_effluent_chart`)
and annual pollutant loads (`dmr_rest_services.get_custom_data_annual`).

### Compliance classes (`src/lib/compliance.ts`)

First match wins; "past year" is the last 5 characters of ECHO's 13-quarter history string.

1. `snc`: current significant-noncompliance status, or an `S` quarter in the past year.
2. `effluent`: at least one effluent-limit exceedance in the last year.
3. `violation`: violation-last-year flag, a `V` quarter in the past year, or an open violation status.
4. `ok`: the permit files DMRs and has none of the above.
5. `nodata`: no monitoring data (typically general / stormwater permits, which do not file DMRs).

"No monitoring" means ECHO has no discharge data for the permit, not that the lookup failed. Permits NLDI
knows but ECHO does not are flagged `missingInEcho` and shown separately.

### Risk score (`src/lib/risk.ts`)

Points per factor, capped, total capped at 100: current SNC (+35), quarters in SNC (+4 each, max 16),
quarters with violations (+1.5 each, max 12), exceedances last year (6·log2(1+n), max 20), missing reports,
formal enforcement and penalties, permit expired but still discharging, facility size (major / POTW / CSO /
design flow), discharging a pollutant the receiving water is impaired by, proximity to the pin, main-stem bonus.
Levels: high ≥ 70, elevated ≥ 45, watch ≥ 20, low otherwise, `unknown` when there is no data to judge.

## Layout

- `src/app/`: Expo Router routes only (`index.tsx` landing, `map.tsx` tool, `api/explain+api.ts` server route, `+html.tsx` web shell).
- `src/api/`: fetchers per source (`nldi`, `echo`, `echoDmr`, `wbd`, `http`) and the `upstream` pipeline.
- `src/lib/`: pure logic (`network`, `risk`, `compliance`, `travel`, `geo`, `ai/`).
- `src/map/`: Leaflet rendering (inline DOM on web), examples, filters, geocoding.
- `src/hooks/`: `useTrace` state machine, filters, geocode, layout.
- `src/components/`: `landing/`, `map/`, `explain/`, `ui/`, `motion/`.
- `src/theme.ts`: design tokens (Realtime Colors roles: text / background / primary / secondary / accent).
- `scripts/`: `smoke-trace.ts` (live end-to-end trace on three pins), `ai-smoke.ts`.

Checks: `npx tsc --noEmit`, `npx expo lint`.

## AI summary (Vertex AI)

The "Summary" card (`src/components/explain/Explainer.tsx`) POSTs a compact JSON digest of the
upstream trace (built client-side by `src/lib/ai/digest.ts`) to the Expo API route `POST /api/explain`
(`src/app/api/explain+api.ts`), which calls Gemini on Vertex AI and returns `{ text, model, mode, usage }`.
The prompt only allows numbers present in the digest and cites permit ids. Keys and tokens stay on the server.

Setup (no secret in the repo):

```bash
gcloud auth application-default login          # once per machine
cp .env.example .env                           # set VERTEX_PROJECT (and VERTEX_LOCATION / VERTEX_MODEL)
```

Restart the dev server after changing `.env`. Credential modes, tried in order:

| Mode | Env | Endpoint |
|---|---|---|
| `vertex-express` | `VERTEX_API_KEY` | `https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key=…` (falls back to the Gemini API if the key is rejected) |
| `vertex-adc` / `vertex-sa` | gcloud ADC file, `GOOGLE_APPLICATION_CREDENTIALS`, or `GOOGLE_SERVICE_ACCOUNT_JSON`, plus `VERTEX_PROJECT` | `https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent` (`aiplatform.googleapis.com` when location is `global`) |
| `gemini` | `GEMINI_API_KEY` | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |

With nothing configured the route returns 503 and the card shows a quiet setup note. Code lives in
`src/lib/ai/` (config, credentials, auth, endpoints, generate, vertex, providers, prompt, digest, handler).
Smoke test: `npx -y tsx scripts/ai-smoke.ts`.

Note: `gemini-2.5-flash` is scheduled for retirement on Vertex AI on October 20, 2026. Switch
`VERTEX_MODEL` to a current model (for example `gemini-3.5-flash-lite` with `VERTEX_LOCATION=global`) before then.

## Roadmap

Hackathon: one basin, pin → trace → dischargers with ECHO status. Month 1: national coverage, risk scoring.
Month 2: subscriptions and alerts, NRC spill feed, travel time from live gauge flow. Month 3: cited plain-English
explainer. Month 4: pilot with a lake association or small utility. Not affiliated with EPA or USGS.
