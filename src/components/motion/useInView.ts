import { useEffect, useRef, useState, type RefObject } from 'react';

type InViewOptions = {
  /** Stop observing after the first reveal (default true). */
  once?: boolean;
  /** Shrinks the viewport so reveals start slightly after the element peeks in. */
  rootMargin?: string;
};

/** Observes a react-native-web host node (a DOM element on web) with IntersectionObserver. SSR-safe. */
export function useInView<T>({ once = true, rootMargin = '0px 0px -8% 0px' }: InViewOptions = {}): [
  RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current as unknown as Element | null;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin]);

  return [ref, inView];
}
