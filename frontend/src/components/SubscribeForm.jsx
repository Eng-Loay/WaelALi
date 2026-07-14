import { useState, useEffect, useMemo } from 'react';
import { subscribe, fetchGrades } from '../api';
import { useApp } from '../context/AppContext';
import { sortGradesBigToSmall } from '../admin/gradeHelpers';
import RegistrationFormFields from './RegistrationFormFields';
import SocialLinks from './SocialLinks';
import { emptyRegistrationForm, buildFullName, validateRegistrationForm } from '../utils/registrationForm';
import ScrollReveal from './ScrollReveal';
import './SubscribeForm.css';
import './RegistrationFormFields.css';
import './SocialLinks.css';

export default function SubscribeForm() {
  const { t, lang } = useApp();
  const [grades, setGrades] = useState([]);
  const [gradesLoaded, setGradesLoaded] = useState(false);
  const [form, setForm] = useState(emptyRegistrationForm);
  const [status, setStatus] = useState({ type: '', message: '' });
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
    const validationError = validateRegistrationForm(form, { requirePassword: false });
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await subscribe({
        name: buildFullName(form),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        parent_phone: form.parent_phone.trim(),
        governorate: form.governorate,
        address: form.address.trim(),
        grade_id: form.grade_id ? parseInt(form.grade_id, 10) : null,
      });
      setStatus({ type: 'success', message: t.subscribe.success });
      setForm(emptyRegistrationForm);
    } catch {
      setStatus({ type: 'error', message: t.subscribe.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section subscribe">
      <div className="container">
        <ScrollReveal animation="scale">
          <div className="subscribe__inner">
            <div className="subscribe__info">
              <h2 className="subscribe__title">
                {t.subscribe.title} <span>{t.subscribe.titleHighlight}</span>{t.subscribe.titleEnd}
              </h2>
              <p className="subscribe__desc">{t.subscribe.desc}</p>
              <div className="subscribe__features">
                {t.subscribe.features.map((text, i) => (
                  <div key={i} className="subscribe__feature" style={{ '--i': i }}>
                    <span>✓</span> {text}
                  </div>
                ))}
              </div>
              <SocialLinks variant="subscribe" />
            </div>

            <form className="subscribe__form" onSubmit={handleSubmit}>
              <h3 className="subscribe__form-title">{t.subscribe.formTitle}</h3>

              {status.message && (
                <div className={`subscribe__alert subscribe__alert--${status.type}`}>
                  {status.message}
                </div>
              )}

              <RegistrationFormFields
                form={form}
                onChange={handleChange}
                grades={sortedGrades}
                gradesLoaded={gradesLoaded}
                t={t}
                lang={lang}
                showPassword
                passwordRequired={false}
              />

              <button
                type="submit"
                className="btn btn-primary subscribe__submit btn--shine btn--magnetic"
                disabled={loading}
              >
                {loading ? t.subscribe.submitting : t.subscribe.submit}
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
