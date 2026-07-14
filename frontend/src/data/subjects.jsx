export const SUBJECTS = [
  {
    id: 'geometry',
    symbol: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3L3 21h18L12 3z" />
      </svg>
    ),
    accent: '#E63946',
    glow: 'rgba(230, 57, 70, 0.22)',
  },
  {
    id: 'calculus',
    symbol: <span className="subjects-section__glyph">∫</span>,
    accent: '#1D3557',
    glow: 'rgba(29, 53, 87, 0.24)',
  },
  {
    id: 'math',
    symbol: <span className="subjects-section__glyph">π</span>,
    accent: '#E63946',
    glow: 'rgba(230, 57, 70, 0.22)',
  },
];

export const CYCLE_MS = 3400;
export const PAUSE_MS = 9000;
