/** DOM ids of in-page sections the nav can jump to. */
export const SECTION_IDS = {
  problem: 'problem',
  how: 'how-it-works',
  data: 'data',
} as const;

/** Smoothly scrolls the landing ScrollView to a section (web). */
export function scrollToSection(id: string): void {
  if (typeof document === 'undefined') return;
  const target = document.getElementById(id);
  if (!target) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
