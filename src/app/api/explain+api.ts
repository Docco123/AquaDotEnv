import { handleExplainRequest } from '@/lib/ai/handler';

/** POST /api/explain — plain-English summary of an upstream trace or one facility (Gemini via Vertex AI). */
export async function POST(request: Request): Promise<Response> {
  return handleExplainRequest(request, process.env);
}
