/**
 * generateContent request body + response parsing, shared by Vertex AI and the Gemini Developer API
 * (both accept the same GenerateContentRequest shape).
 */
import { AI_DEFAULTS } from './config';
import { AiError } from './errors';
import type { ExplainUsage } from './types';

export interface ThinkingConfig {
  thinkingLevel?: 'MINIMAL' | 'LOW';
  thinkingBudget?: number;
}

export interface GenerateInput {
  model: string;
  systemInstruction: string;
  userText: string;
}

export interface GenerateResult {
  text: string;
  modelVersion: string | null;
  usage?: ExplainUsage;
  truncated: boolean;
}

/**
 * Keep thinking short: this is a summarisation task and thoughts count against maxOutputTokens.
 * Gemini 3+: thinkingLevel (Flash-Lite supports MINIMAL; 3.7/3.8 Flash and Pro do not, so they get LOW).
 * Gemini 2.5 Flash / Flash-Lite: thinkingBudget 0 turns thinking off. 2.5 Pro cannot turn it off (min 128).
 */
export function thinkingConfigFor(model: string): ThinkingConfig | undefined {
  const match = /^gemini-(\d+)(?:\.(\d+))?-(flash-lite|flash|pro)/.exec(model);
  if (!match) return undefined;
  const major = Number(match[1]);
  const tier = match[3];
  if (major >= 3) return { thinkingLevel: tier === 'flash-lite' ? 'MINIMAL' : 'LOW' };
  if (major === 2 && tier !== 'pro') return { thinkingBudget: 0 };
  if (major === 2) return { thinkingBudget: 128 };
  return undefined;
}

function maxOutputTokensFor(thinking: ThinkingConfig | undefined): number {
  const thinks = thinking?.thinkingLevel === 'LOW' || (thinking?.thinkingBudget ?? 0) > 0;
  return AI_DEFAULTS.maxOutputTokens + (thinks ? AI_DEFAULTS.thinkingHeadroomTokens : 0);
}

export function buildGenerateBody(input: GenerateInput): Record<string, unknown> {
  const thinkingConfig = thinkingConfigFor(input.model);
  return {
    systemInstruction: { parts: [{ text: input.systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: input.userText }] }],
    generationConfig: {
      temperature: AI_DEFAULTS.temperature,
      maxOutputTokens: maxOutputTokensFor(thinkingConfig),
      ...(thinkingConfig ? { thinkingConfig } : {}),
    },
  };
}

// ---------------------------------------------------------------- response parsing

interface Part {
  text?: string;
  thought?: boolean;
}

interface Candidate {
  content?: { parts?: Part[] };
  finishReason?: string;
  finishMessage?: string;
}

interface GenerateResponseJson {
  candidates?: Candidate[];
  promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
}

const BLOCK_REASONS = new Set(['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'LANGUAGE']);

function blockedError(reason: string): AiError {
  return new AiError('blocked', `The model declined to answer (${reason}).`, {
    status: 502,
    hint: 'Try Regenerate. If it keeps happening, open the ECHO report directly.',
  });
}

function toUsage(meta: GenerateResponseJson['usageMetadata']): ExplainUsage | undefined {
  if (!meta) return undefined;
  return {
    promptTokens: meta.promptTokenCount,
    outputTokens: meta.candidatesTokenCount,
    thoughtsTokens: meta.thoughtsTokenCount,
    totalTokens: meta.totalTokenCount,
  };
}

export function parseGenerateResponse(json: unknown): GenerateResult {
  const res = (json ?? {}) as GenerateResponseJson;
  const blockReason = res.promptFeedback?.blockReason;
  if (blockReason) throw blockedError(blockReason);

  const candidate = res.candidates?.[0];
  if (!candidate) {
    throw new AiError('empty', 'The model returned no answer.', { status: 502, hint: 'Try Regenerate.' });
  }
  const text = (candidate.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
  const finish = candidate.finishReason ?? 'STOP';

  // A safety stop mid-answer can leave a misleading fragment, so treat it as blocked either way.
  if (BLOCK_REASONS.has(finish)) throw blockedError(finish);
  if (!text) {
    const message = finish === 'MAX_TOKENS' ? 'The model ran out of room before answering.' : `The model returned an empty answer (${finish}).`;
    throw new AiError('empty', message, { status: 502, hint: 'Try Regenerate.' });
  }
  return { text, modelVersion: res.modelVersion ?? null, usage: toUsage(res.usageMetadata), truncated: finish === 'MAX_TOKENS' };
}
