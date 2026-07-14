import { useCallback, useRef, useState } from 'react';

export default function useScrollReveal(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  const ref = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.unobserve(node);
          }
        },
        {
          threshold: options.threshold ?? 0.1,
          rootMargin: options.rootMargin ?? '0px 0px -20px 0px',
        }
      );

      observerRef.current.observe(node);
    },
    [options.threshold, options.rootMargin]
  );

  return { ref, isVisible };
}
