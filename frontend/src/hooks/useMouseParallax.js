import { useCallback, useRef } from 'react';

export default function useMouseParallax(intensity = 15) {
  const ref = useRef(null);

  const handleMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

      el.style.setProperty('--mouse-x', `${x * intensity}px`);
      el.style.setProperty('--mouse-y', `${y * intensity}px`);
      el.style.setProperty('--mouse-nx', x.toFixed(4));
      el.style.setProperty('--mouse-ny', y.toFixed(4));
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mouse-x', '0px');
    el.style.setProperty('--mouse-y', '0px');
    el.style.setProperty('--mouse-nx', '0');
    el.style.setProperty('--mouse-ny', '0');
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}
