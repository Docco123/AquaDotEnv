/**
 * Pure validation for POST /api/chat bodies. Every failure is a 400 AiError with code 'bad-request'.
 */
import { CHAT_DEFAULTS } from './chatConfig';
import type { ChatMessage, ChatRequest } from './chatTypes';
import { AiError } from './errors';

function badRequest(message: string): AiError {
  return new AiError('bad-request', message, { status: 400 });
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function validateMessage(value: unknown, index: number): ChatMessage {
  if (!isObject(value)) throw badRequest(`messages[${index}] must be an object.`);
  if (value.role !== 'user' && value.role !== 'assistant') throw badRequest(`messages[${index}].role must be "user" or "assistant".`);
  if (typeof value.content !== 'string' || !value.content.trim()) throw badRequest(`messages[${index}].content must be a non-empty string.`);
  return { role: value.role, content: value.content };
}

function validateMessages(value: unknown): ChatMessage[] {
  const max = CHAT_DEFAULTS.maxMessages;
  if (!Array.isArray(value) || value.length < 1 || value.length > max) throw badRequest(`messages must be an array of 1 to ${max} messages.`);
  const messages = value.map(validateMessage);
  if (messages[messages.length - 1].role !== 'user') throw badRequest('The last message must be from the user.');
  return messages;
}

function validateContext(value: unknown): ChatRequest['context'] {
  if (!isObject(value)) throw badRequest('context is required.');
  if (!isObject(value.digest) || !isObject(value.digest.summary)) throw badRequest('context.digest must be a trace digest.');
  if (value.facility != null && !isObject(value.facility)) throw badRequest('context.facility must be a facility digest or null.');
  return value as unknown as ChatRequest['context'];
}

export function validateChatRequest(body: unknown): ChatRequest {
  if (!isObject(body)) throw badRequest('Body must be a JSON object.');
  if (byteLength(JSON.stringify(body)) > CHAT_DEFAULTS.maxBodyBytes) throw badRequest('Body is larger than 120 KB.');
  return { messages: validateMessages(body.messages), context: validateContext(body.context) };
}
