import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AUTH_EVENT, getActiveSession, unifiedLogout } from '../api/unifiedAuth';
import logo from '../assets/logo.png';
import logoDark from '../assets/logo-dark.png';
import './Navbar.css';

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloseMenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function Navbar() {
  const { t, theme, toggleLang, toggleTheme, lang } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const menuRef = useRef(null);
  const burgerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [session, setSession] = useState(() => getActiveSession());

  const refreshSession = useCallback(() => {
    setSession(getActiveSession());
  }, []);

  useEffect(() => {
    refreshSession();
  }, [location.pathname, refreshSession]);

  useEffect(() => {
    window.addEventListener(AUTH_EVENT, refreshSession);
    window.addEventListener('storage', refreshSession);
    return () => {
      window.removeEventListener(AUTH_EVENT, refreshSession);
      window.removeEventListener('storage', refreshSession);
    };
  }, [refreshSession]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onPointerDown = (e) => {
      const target = e.target;
      if (menuRef.current?.contains(target) || burgerRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onEscape);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    setProfileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  const handleLogout = () => {
    unifiedLogout();
    setProfileOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const dashboardLabel = session?.role === 'admin' ? t.nav.dashboardAdmin : t.nav.dashboardStudent;

  const navLinks = [
    { to: '/', label: t.nav.home, end: true },
    { to: '/grades', label: t.nav.grades },
    { to: '/courses', label: t.nav.courses },
    { to: '/about', label: t.nav.about },
    { to: '/contact', label: t.nav.contact },
  ];

  return (
    <nav className={`navbar navbar--enter ${scrolled ? 'navbar--scrolled' : ''}${menuOpen ? ' navbar--menu-open' : ''}`} data-lang={lang}>
      <div className="container navbar__inner">
        <div className="navbar__brand-nav">
          <ul ref={menuRef} className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
            <li className="navbar__menu-close-wrap">
              <button
                type="button"
                className="navbar__menu-close"
                onClick={() => setMenuOpen(false)}
                aria-label={t.nav.close}
              >
                <CloseMenuIcon />
              </button>
            </li>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `navbar__link${link.pill ? ' navbar__link--pill' : ''}${isActive ? ' active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            <li className="navbar__mobile-actions">
              <button type="button" className="navbar__icon-btn" onClick={toggleLang} aria-label={t.nav.langSwitch}>
                <GlobeIcon />
                <span>{t.nav.langSwitch}</span>
              </button>
              <button
                type="button"
                className="navbar__icon-btn"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? t.nav.themeDark : t.nav.themeLight}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
              {session ? (
                <>
                  <Link to={session.path} className="btn btn-outline navbar__mobile-cta" onClick={() => setMenuOpen(false)}>
                    {dashboardLabel}
                  </Link>
                  <button type="button" className="btn btn-outline navbar__mobile-cta" onClick={handleLogout}>
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline navbar__mobile-cta" onClick={() => setMenuOpen(false)}>
                    {t.nav.login}
                  </Link>
                  <Link to="/contact" className="btn btn-primary navbar__mobile-cta" onClick={() => setMenuOpen(false)}>
                    {t.nav.subscribe}
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>

        {/* شمال: الأدوات + البروفايل */}
        <div className="navbar__utilities">
          <button
            type="button"
            className="navbar__icon-btn navbar__icon-btn--round"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? t.nav.themeDark : t.nav.themeLight}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <button
            type="button"
            className="navbar__icon-btn navbar__icon-btn--round"
            onClick={toggleLang}
            aria-label={t.nav.langSwitch}
          >
            <GlobeIcon />
          </button>

          {session ? (
            <div className="navbar__profile" ref={profileRef}>
              <button
                type="button"
                className="navbar__profile-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen((v) => !v);
                }}
              >
                <span className="navbar__profile-name">{session.name}</span>
                <ChevronIcon />
              </button>
              {profileOpen && (
                <div className="navbar__profile-menu" onClick={(e) => e.stopPropagation()}>
                  <Link to={session.path} onClick={() => setProfileOpen(false)}>
                    {dashboardLabel}
                  </Link>
                  <button type="button" onClick={handleLogout}>
                    {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar__profile-btn navbar__profile-btn--guest">
              <span className="navbar__profile-name">{t.nav.login}</span>
            </Link>
          )}

          <button
            ref={burgerRef}
            type="button"
            className={`navbar__burger ${menuOpen ? 'navbar__burger--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.nav.menu}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <img src={theme === 'dark' ? logoDark : logo} alt="Wael Ali Math" />
        </Link>
      </div>
    </nav>
  );
}
