import './FloatingSymbols.css';

const symbols = [
  { char: 'π', top: '12%', left: '8%', size: '2.5rem', delay: '0s', duration: '6s' },
  { char: '∫', top: '25%', right: '12%', size: '2rem', delay: '1s', duration: '7s' },
  { char: '∑', top: '60%', left: '5%', size: '1.8rem', delay: '2s', duration: '5s' },
  { char: '√', top: '70%', right: '8%', size: '2.2rem', delay: '0.5s', duration: '8s' },
  { char: '∞', top: '40%', left: '15%', size: '1.5rem', delay: '1.5s', duration: '6s' },
  { char: 'θ', top: '80%', left: '20%', size: '1.6rem', delay: '3s', duration: '7s' },
  { char: 'Δ', top: '18%', right: '25%', size: '1.4rem', delay: '2.5s', duration: '5s' },
  { char: 'α', top: '50%', right: '5%', size: '1.3rem', delay: '1s', duration: '9s' },
];

export default function FloatingSymbols() {
  return (
    <div className="floating-symbols" aria-hidden="true">
      {symbols.map((s, i) => (
        <span
          key={i}
          className="floating-symbols__item"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            fontSize: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
}
