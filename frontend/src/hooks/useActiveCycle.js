import { useEffect, useState } from 'react';

export default function useActiveCycle(count, interval = 2800, enabled = true) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!enabled || count <= 0) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, interval);
    return () => clearInterval(id);
  }, [count, interval, enabled]);

  return active;
}
