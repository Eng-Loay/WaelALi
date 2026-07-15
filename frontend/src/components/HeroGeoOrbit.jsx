const shapes = [
  {
    id: 'tri',
    type: 'triangle',
    radius: 220,
    duration: 17,
    delay: 0,
    size: 52,
    color: '#E63946',
  },
  {
    id: 'ring',
    type: 'ring',
    radius: 245,
    duration: 23,
    delay: -5,
    size: 44,
    color: '#1D3557',
  },
  {
    id: 'sq',
    type: 'square',
    radius: 185,
    duration: 13,
    delay: -2,
    size: 42,
    color: '#E63946',
    reverse: true,
  },
  {
    id: 'pi',
    type: 'pi',
    radius: 210,
    duration: 19,
    delay: -7,
    size: 50,
    color: '#1D3557',
  },
  {
    id: 'hex',
    type: 'hexagon',
    radius: 235,
    duration: 21,
    delay: -11,
    size: 46,
    color: '#E63946',
    reverse: true,
  },
  {
    id: 'arc',
    type: 'arc',
    radius: 195,
    duration: 15,
    delay: -4,
    size: 50,
    color: '#1D3557',
  },
];

function ShapeGraphic({ type, color, size }) {
  const s = size;
  switch (type) {
    case 'triangle':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M20 4L4 36h32L20 4z" stroke={color} strokeWidth="2.2" />
        </svg>
      );
    case 'ring':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="2.2" strokeDasharray="4 5" />
        </svg>
      );
    case 'square':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="22" height="22" stroke={color} strokeWidth="2.2" transform="rotate(45 20 20)" />
        </svg>
      );
    case 'pi':
      return (
        <span className="hero-geo-orbit__pi" style={{ color, fontSize: `${s * 0.7}px` }}>π</span>
      );
    case 'hexagon':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M20 5L33 12.5v15L20 35 7 27.5v-15L20 5z" stroke={color} strokeWidth="2" />
        </svg>
      );
    case 'arc':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M8 28A16 16 0 0118 8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="18" cy="8" r="2.5" fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

export default function HeroGeoOrbit({ visible }) {
  return (
    <div className={`hero-geo-orbit ${visible ? 'hero-geo-orbit--show' : ''}`} aria-hidden="true">
      {shapes.map((shape, i) => (
        <div
          key={shape.id}
          className={`hero-geo-orbit__lane ${shape.reverse ? 'hero-geo-orbit__lane--reverse' : ''}`}
          style={{
            '--radius': `${shape.radius}px`,
            '--duration': `${shape.duration}s`,
            '--delay': `${shape.delay}s`,
            '--start-angle': `${i * 60}deg`,
          }}
        >
          <div
            className="hero-geo-orbit__flyer"
            style={{
              '--self-duration': `${shape.duration * 0.45}s`,
              '--bob-duration': `${2.8 + i * 0.4}s`,
            }}
          >
            <div className="hero-geo-orbit__shape">
              <ShapeGraphic type={shape.type} color={shape.color} size={shape.size} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
