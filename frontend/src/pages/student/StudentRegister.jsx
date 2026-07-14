import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGrades } from '../../api';
import { studentRegister } from '../../api/studentApi';
import { useApp } from '../../context/AppContext';
import { sortGradesBigToSmall } from '../../admin/gradeHelpers';
import RegistrationFormFields, { GridIcon } from '../../components/RegistrationFormFields';
import Navbar from '../../components/Navbar';
import SocialLinks from '../../components/SocialLinks';
import {
  emptyRegistrationForm,
  buildFullName,
  validateRegistrationForm,
} from '../../utils/registrationForm';
import teacherPortrait from '../../assets/WhatsApp_Image_2026-07-07_at_1.12.45_PM-removebg-preview.png';
import '../../styles/AuthPage.css';
import '../../components/RegistrationFormFields.css';
import '../../components/SocialLinks.css';

export default function StudentRegister() {
  const navigate = useNavigate();
  const { t, lang } = useApp();
  const [grades, setGrades] = useState([]);
  const [gradesLoaded, setGradesLoaded] = useState(false);
  const [form, setForm] = useState(emptyRegistrationForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGrades()
      .then((data) => setGrades(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setGrades([]);
      })
      .finally(() => setGradesLoaded(true));
  }, []);

  const sortedGrades = useMemo(() => sortGradesBigToSmall(grades), [grades]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateRegistrationForm(form, {
      requirePassword: true,
      requireEmail: true,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await studentRegister({
        name: buildFullName(form),
        email: form.email.trim(),
        phone: form.phone.trim(),
        parent_phone: form.parent_phone.trim(),
        governorate: form.governorate,
        address: form.address.trim(),
        password: form.password,
        grade_id: Number(form.grade_id),
      });
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || t.registerPage.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page auth-page--register" dir="rtl">
        <div className="auth-page__shell">
          <section className="auth-page__form-panel">
            <header className="auth-page__header">
              <h1 className="auth-page__title">
                <GridIcon />
                <span>{t.registerPage.title}</span>
              </h1>
              <p className="auth-page__subtitle">{t.registerPage.subtitle}</p>
            </header>

            <form className="auth-page__form" onSubmit={handleSubmit}>
              {error && <div className="auth-page__alert">{error}</div>}

              <RegistrationFormFields
                form={form}
                onChange={handleChange}
                grades={sortedGrades}
                gradesLoaded={gradesLoaded}
                t={t}
                lang={lang}
                showPassword
                passwordRequired
                variant="underline"
              />

              <button type="submit" className="auth-page__submit" disabled={loading}>
                {loading ? t.registration.creatingAccount : t.registration.createAccount}
              </button>
            </form>

            <p className="auth-page__footer-link">
              {t.registerPage.hasAccount}{' '}
              <Link to="/login">{t.registerPage.loginLink}</Link>
            </p>

            <SocialLinks variant="auth" className="auth-page__social" />
          </section>

          <aside className="auth-page__visual auth-page__visual--register" aria-hidden="true">
            <div className="auth-page__visual-bg">
              <span className="auth-page__deco auth-page__deco--blob1" />
              <span className="auth-page__deco auth-page__deco--blob2" />
              <span className="auth-page__deco auth-page__deco--blob3" />
              <span className="auth-page__deco auth-page__deco--ring" />
              <span className="auth-page__deco auth-page__deco--pi">π</span>
              <span className="auth-page__deco auth-page__deco--pi2">π</span>
              <span className="auth-page__deco auth-page__deco--dots" />
            </div>
            <div className="auth-page__visual-content">
              <h2 className="auth-page__visual-title">{t.registerPage.visualTitle}</h2>
              <img
                src={teacherPortrait}
                alt=""
                className="auth-page__teacher"
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
