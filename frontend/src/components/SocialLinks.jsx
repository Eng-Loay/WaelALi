import { useApp } from '../context/AppContext';
import { SOCIAL_PLATFORMS, SocialIcon } from '../data/socialLinks';
import './SocialLinks.css';

export default function SocialLinks({ variant = 'default', className = '' }) {
  const { t } = useApp();
  const label = t.footer?.social || 'تابعنا على السوشيال';

  return (
    <div className={`social-links social-links--${variant} ${className}`.trim()} aria-label={label}>
      {SOCIAL_PLATFORMS.map((item) => (
        <a
          key={item.id}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="social-links__item"
          aria-label={item.label}
          title={item.label}
          style={{ '--social-brand': item.brand }}
        >
          <SocialIcon id={item.id} size={variant === 'footer' ? 22 : 28} />
        </a>
      ))}
    </div>
  );
}
