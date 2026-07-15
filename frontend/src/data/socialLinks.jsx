export const SOCIAL_PLATFORMS = [
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@MrWaelAliMath',
    brand: '#ff0000',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: '',
    brand: '#010101',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/mr.waelalimath?igsh=NW03dWVtMzQ2cWVr',
    brand: '#e1306c',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/share/161vD9vt8f5/',
    brand: '#1877f2',
  },
  {
    id: 'facebook2',
    label: 'Facebook Page',
    href: 'https://www.facebook.com/Mr.Wael.Ali.111',
    brand: '#1877f2',
  },
];

export function SocialIcon({ id, size = 24 }) {
  const gradId = `ig-grad-${id}`;

  switch (id) {
    case 'youtube':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#FF0000" />
          <path fill="#fff" d="M10 8.5v7l6-3.5-6-3.5z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#010101" />
          <path
            fill="#FFFFFF"
            d="M16.65 8.48V7.04a4.2 4.2 0 0 1-2.01-1.08A4.2 4.2 0 0 1 13.28 3.5h-.01v9.78c0 1.71-1.39 3.1-3.1 3.1s-3.1-1.39-3.1-3.1 1.39-3.1 3.1-3.1c.32 0 .63.05.92.14V8.9a5.58 5.58 0 0 0-.92-.08 5.63 5.63 0 0 0 0 11.26 5.63 5.63 0 0 0 5.56-6.62V9.7c1.19.84 2.64 1.3 4.15 1.27V8.48c-.99 0-1.94-.3-2.77-.83l.02.16z"
          />
        </svg>
      );
    case 'instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#feda75" />
              <stop offset="25%" stopColor="#fa7e1e" />
              <stop offset="50%" stopColor="#d62976" />
              <stop offset="75%" stopColor="#962fbf" />
              <stop offset="100%" stopColor="#4f5bd5" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#${gradId})`} />
          <rect x="6.5" y="6.5" width="11" height="11" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="2.6" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="16.2" cy="7.8" r="1.1" fill="#fff" />
        </svg>
      );
    case 'facebook':
    case 'facebook2':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#1877F2" />
          <path
            fill="#fff"
            d="M13.7 13.2h2.2l.3-2.4h-2.5V9.6c0-.7.2-1.2 1.2-1.2h1.3V6.2c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2h-2.1v2.4h2.1V19h2.8v-3.5z"
          />
        </svg>
      );
    default:
      return null;
  }
}
