/**
 * Tunables for POST /api/chat. Model, project, location and credentials come from the same env as the explainer
 * (see config.ts); only generation and request limits differ.
 */
export const CHAT_DEFAULTS = {
  temperature: 0.4,
  /** Budget for the visible answer (~150 words, or a longer answer when the user asks for detail). */
  maxOutputTokens: 1200,
  /** Gemini 2.5: soft cap on thinking tokens (docs: 2.5 Flash 1..24,576, Flash-Lite 512..24,576, Pro 128..32,768). */
  thinkingBudget: 1024,
  /** Gemini 3+: discrete level instead of a budget; LOW is supported by every 3.x text model. */
  thinkingLevel: 'LOW',
  /** Thoughts count toward maxOutputTokens, so thinking requests get this much extra room. */
  thinkingHeadroomTokens: 1024,
  /** Whole request: connect, think and stream the answer. */
  timeoutMs: 60_000,
  maxBodyBytes: 120 * 1024,
  maxMessages: 30,
  /** Default answer length the system instruction asks for. */
  wordLimit: 150,
} as const;
