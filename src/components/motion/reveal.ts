import type { ViewStyle } from 'react-native';
import { EASE_OUT, webStyle } from './webStyle';

export type RevealOptions = {
  /** ms before the transition starts (use for stagger). */
  delay?: number;
  /** ms the transition lasts. */
  duration?: number;
  /** px the element rises while fading in. */
  distance?: number;
  /** px of blur at the start (0 disables blur). */
  blur?: number;
};

/** CSS-transition style for a fade-up(-blur) reveal; runs on the compositor, no per-frame JS. */
export function revealStyle(shown: boolean, reduced: boolean, opts: RevealOptions = {}): ViewStyle {
  const { delay = 0, duration = 800, distance = 16, blur = 6 } = opts;
  const hidden = !shown && !reduced;
  return webStyle({
    opacity: hidden ? 0 : 1,
    transform: hidden ? `translate3d(0, ${distance}px, 0)` : 'translate3d(0, 0, 0)',
    filter: blur > 0 ? `blur(${hidden ? blur : 0}px)` : undefined,
    transitionProperty: blur > 0 ? 'opacity, transform, filter' : 'opacity, transform',
    transitionDuration: reduced ? '0ms' : `${duration}ms`,
    transitionDelay: reduced ? '0ms' : `${delay}ms`,
    transitionTimingFunction: EASE_OUT,
  });
}
