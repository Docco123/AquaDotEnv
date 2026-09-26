/** Chat panel configuration: endpoint, history limit, copy and layout numbers. */

export const CHAT = {
  endpoint: '/api/chat',
  /** Most recent messages sent as history; older turns stay on screen but are not re-sent. */
  maxHistoryMessages: 20,
  title: 'Ask UpstreamWatch',
  placeholder: 'Ask about what’s upstream…',
  emptyHint: 'Ask about the permits, violations and travel times upstream of this point.',
  caption: 'Answers use EPA ECHO and USGS data for this trace; verify on ECHO before acting.',
  notConfigured: 'Add VERTEX_API_KEY to .env to enable chat about this trace',
  suggestions: [
    'What’s the biggest risk to me?',
    'Which permits are expired but still discharging?',
    'How fast would a spill reach my intake?',
  ],
} as const;

export const CHAT_LAYOUT = {
  launcherSize: 44,
  /** Launcher offset from the map's bottom-right corner (clears Leaflet's attribution). */
  launcherBottom: 28,
  launcherRight: 16,
  /** Space between the launcher and the floating panel above it. */
  panelGap: 12,
  panelWidth: 400,
  panelMaxHeight: 640,
  panelViewportShare: '80vh',
  /** Above Leaflet's panes and controls (z-index up to 1000). */
  zIndex: 1100,
  /** Composer grows from one to this many lines, then scrolls. */
  composerMaxLines: 4,
  composerLineHeight: 20,
  composerPaddingY: 8,
  /** Thought text window while the model is still thinking. */
  thinkingMaxHeight: 120,
} as const;
