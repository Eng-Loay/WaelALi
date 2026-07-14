import useCountUp from '../hooks/useCountUp';
import useScrollReveal from '../hooks/useScrollReveal';

export default function AnimatedCounter({ end, suffix = '', prefix = '' }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.5 });
  const count = useCountUp(end, 2000, isVisible);

  return (
    <strong ref={ref}>
      {prefix}{count}{suffix}
    </strong>
  );
}
