/**
 * streamGenerateContent request body for the chat (same GenerateContentRequest shape on Vertex AI and the Gemini API).
 * Thinking config per docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking and ai.google.dev/api/generate-content#ThinkingConfig:
 *  - Gemini 2.5: thinkingBudget (thinkingLevel on a pre-3 model is an error).
 *  - Gemini 3+:  thinkingLevel (sending both thinkingLevel and thinkingBudget is an error).
 *  - includeThoughts: true returns thought summaries as parts with `thought: true`.
 */
import { CHAT_DEFAULTS } from './chatConfig';
import type { ChatPrompt } from './chatPrompt';

export interface ChatThinkingConfig {
  includeThoughts: true;
  thinkingBudget?: number;
  thinkingLevel?: typeof CHAT_DEFAULTS.thinkingLevel;
}

/** Returns null for models known not to think (Gemini 1.x / 2.0), so no thinkingConfig is sent. */
export function chatThinkingConfig(model: string): ChatThinkingConfig | null {
  const match = /^gemini-(\d+)(?:\.(\d+))?-/.exec(model);
  if (!match) return { includeThoughts: true };
  const major = Number(match[1]);
  const minor = Number(match[2] ?? 0);
  if (major >= 3) return { includeThoughts: true, thinkingLevel: CHAT_DEFAULTS.thinkingLevel };
  if (major === 2 && minor >= 5) return { includeThoughts: true, thinkingBudget: CHAT_DEFAULTS.thinkingBudget };
  return null;
}

export function buildChatBody(prompt: ChatPrompt, thinking: ChatThinkingConfig | null): Record<string, unknown> {
  const headroom = thinking ? CHAT_DEFAULTS.thinkingHeadroomTokens : 0;
  return {
    systemInstruction: { parts: [{ text: prompt.systemInstruction }] },
    contents: prompt.contents,
    generationConfig: {
      temperature: CHAT_DEFAULTS.temperature,
      maxOutputTokens: CHAT_DEFAULTS.maxOutputTokens + headroom,
      ...(thinking ? { thinkingConfig: thinking } : {}),
    },
  };
}
