import type { ChatLauncherProps } from './types';

// Native fallback: the chat launcher is web-only (see ChatLauncher.web.tsx).
export function ChatLauncher(_: ChatLauncherProps) {
  return null;
}
