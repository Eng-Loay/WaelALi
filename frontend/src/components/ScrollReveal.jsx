import useScrollReveal from '../hooks/useScrollReveal';

export default function ScrollReveal({
  children,
  className = '',
  animation = 'up',
  delay = 0,
  as: Tag = 'div',
}) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal reveal--${animation} ${isVisible ? 'reveal--visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}s` }}
    >
      {children}
    </Tag>
  );
}
