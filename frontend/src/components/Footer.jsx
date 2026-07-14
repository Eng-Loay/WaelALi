import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import logo from '../assets/logo-dark.png';
import SocialLinks from './SocialLinks';
import './Footer.css';

export default function Footer() {
  const { t } = useApp();

  const quickLinks = [
    { to: '/', label: t.nav.home },
    { to: '/grades', label: t.nav.grades },
    { to: '/courses', label: t.nav.courses },
    { to: '/about', label: t.nav.about },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <img
              src={logo}
              alt="Wael Ali Math"
              className="footer__logo"
            />
            <p className="footer__tagline">
              {t.footer.tagline}
              <br />
              {t.footer.tagline2}
            </p>
            <SocialLinks variant="footer" />
          </div>

          <div className="footer__links">
            <h4>{t.footer.quickLinks}</h4>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.to}><Link to={link.to}>{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="footer__contact">
            <h4>{t.footer.contact}</h4>
            <ul>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                info@waelalimath.com
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                +20 1XX XXX XXXX
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>{t.footer.rights}</p>
          <p className="footer__pi">{t.footer.badge}</p>
        </div>
      </div>
    </footer>
  );
}
