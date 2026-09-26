import { handleChatRequest } from '@/lib/ai/chatHandler';

/** POST /api/chat — streamed follow-up answers about an upstream trace (text/event-stream, Gemini via Vertex AI). */
export async function POST(request: Request): Promise<Response> {
  return handleChatRequest(request, process.env);
}
