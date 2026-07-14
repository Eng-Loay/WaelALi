import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SocialLinks from '../components/SocialLinks';
import { useApp } from '../context/AppContext';
import { getActiveSession, unifiedLogin } from '../api/unifiedAuth';
import teacherPortrait from '../assets/WhatsApp_Image_2026-07-07_at_1.12.45_PM-removebg-preview.png';
import './UnifiedLogin.css';
import '../components/SocialLinks.css';

function EmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const { t } = useApp();
  const existing = getActiveSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (existing) {
    return <Navigate to={existing.path} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await unifiedLogin(email, password);
      navigate(result.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.message || t.loginPage.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-page" dir="rtl">
        <div className="login-page__shell">
          <section className="login-page__form-panel">
            <header className="login-page__header">
              <h1 className="login-page__title">
                <GridIcon />
                <span>{t.loginPage.title}</span>
              </h1>
              <p className="login-page__hint">{t.loginPage.hint}</p>
            </header>

            <form className="login-page__form" onSubmit={handleSubmit}>
              {error && <div className="login-page__alert">{error}</div>}

              <label className="login-field">
                <span className="login-field__icon" aria-hidden="true">
                  <EmailIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.loginPage.email}
                  required
                  autoComplete="username"
                />
              </label>

              <label className="login-field">
                <span className="login-field__icon" aria-hidden="true">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.loginPage.password}
                  required
                  autoComplete="current-password"
                />
              </label>

              <button type="submit" className="login-page__submit" disabled={loading}>
                {loading ? t.loginPage.submitting : t.loginPage.submit}
              </button>
            </form>

            <p className="login-page__footer-link">
              {t.loginPage.noAccount}{' '}
              <Link to="/student/register">{t.loginPage.createAccount}</Link>
            </p>

            <SocialLinks variant="auth" className="login-page__social" />
          </section>

          <aside className="login-page__visual login-page__visual--auth" aria-hidden="true">
            <div className="login-page__visual-bg">
              <span className="login-page__deco login-page__deco--blob1" />
              <span className="login-page__deco login-page__deco--blob2" />
              <span className="login-page__deco login-page__deco--blob3" />
              <span className="login-page__deco login-page__deco--ring" />
              <span className="login-page__deco login-page__deco--pi">π</span>
              <span className="login-page__deco login-page__deco--dots" />
            </div>
            <div className="login-page__visual-content">
              <h2 className="login-page__visual-title">{t.loginPage.visualTitle}</h2>
              <img
                src={teacherPortrait}
                alt=""
                className="login-page__teacher"
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
