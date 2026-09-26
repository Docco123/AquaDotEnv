/**
 * generateContent URL forms (verified against docs.cloud.google.com and ai.google.dev, Sept 2026).
 *  - Vertex express mode (API key, no project/location):
 *      https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key={API_KEY}
 *  - Vertex with OAuth, regional:      https://{location}-aiplatform.googleapis.com/v1/projects/{p}/locations/{location}/publishers/google/models/{model}:generateContent
 *  - Vertex with OAuth, global:        https://aiplatform.googleapis.com/v1/projects/{p}/locations/global/publishers/google/models/{model}:generateContent
 *  - Vertex with OAuth, multi-region:  https://aiplatform.{us|eu}.rep.googleapis.com/v1/projects/{p}/locations/{us|eu}/publishers/google/models/{model}:generateContent
 *  - Gemini Developer API:             https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */

const MULTI_REGIONS = new Set(['us', 'eu']);

function modelPath(model: string): string {
  return `publishers/google/models/${encodeURIComponent(model)}:generateContent`;
}

export function vertexHost(location: string): string {
  if (location === 'global') return 'aiplatform.googleapis.com';
  if (MULTI_REGIONS.has(location)) return `aiplatform.${location}.rep.googleapis.com`;
  return `${location}-aiplatform.googleapis.com`;
}

/** Express mode. The key goes in the query string exactly as the express-mode docs show. */
export function vertexExpressUrl(model: string, apiKey: string): string {
  return `https://aiplatform.googleapis.com/v1/${modelPath(model)}?key=${encodeURIComponent(apiKey)}`;
}

export function vertexProjectUrl(project: string, location: string, model: string): string {
  const p = encodeURIComponent(project);
  const l = encodeURIComponent(location);
  return `https://${vertexHost(location)}/v1/projects/${p}/locations/${l}/${modelPath(model)}`;
}

/** Gemini Developer API. The key is sent in the x-goog-api-key header, not the URL. */
export function geminiApiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}
