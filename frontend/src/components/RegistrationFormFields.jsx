import { GOVERNORATES, pickGovernorateLabel } from '../data/governorates';
import { pickGradeName } from '../utils/localized';
import './RegistrationFormFields.css';

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

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

function UnderlineField({ icon: Icon, children }) {
  return (
    <label className="auth-field">
      <span className="auth-field__icon" aria-hidden="true">
        <Icon />
      </span>
      {children}
    </label>
  );
}

export default function RegistrationFormFields({
  form,
  onChange,
  grades = [],
  gradesLoaded = true,
  t,
  lang,
  showPassword = true,
  passwordRequired = true,
  variant = 'boxed',
}) {
  const handleChange = (e) => {
    onChange(e.target.name, e.target.value);
  };

  if (variant === 'underline') {
    return (
      <div className="reg-form reg-form--underline">
        <p className="reg-form__hint reg-form__hint--auth">{t.registration.hint}</p>
        <div className="reg-form__grid reg-form__grid--underline">
          <UnderlineField icon={UserIcon}>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder={t.registration.firstName}
              required
            />
          </UnderlineField>

          <UnderlineField icon={UserIcon}>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder={t.registration.lastName}
              required
            />
          </UnderlineField>

          <UnderlineField icon={PhoneIcon}>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder={t.registration.phone}
              required
            />
          </UnderlineField>

          <UnderlineField icon={PhoneIcon}>
            <input
              type="tel"
              id="parent_phone"
              name="parent_phone"
              value={form.parent_phone}
              onChange={handleChange}
              placeholder={t.registration.parentPhone}
              required
            />
          </UnderlineField>

          <UnderlineField icon={MapIcon}>
            <select
              id="governorate"
              name="governorate"
              value={form.governorate}
              onChange={handleChange}
              required
            >
              <option value="">{t.registration.governoratePlaceholder}</option>
              {GOVERNORATES.map((gov) => (
                <option key={gov.value} value={gov.value}>
                  {pickGovernorateLabel(gov, lang)}
                </option>
              ))}
            </select>
          </UnderlineField>

          <UnderlineField icon={BookIcon}>
            <select
              id="grade_id"
              name="grade_id"
              value={form.grade_id}
              onChange={handleChange}
              required
            >
              <option value="">{t.registration.gradePlaceholder}</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {pickGradeName(grade, lang)}
                </option>
              ))}
            </select>
          </UnderlineField>

          <UnderlineField icon={HomeIcon}>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder={t.registration.address}
              required
            />
          </UnderlineField>

          <UnderlineField icon={EmailIcon}>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t.registration.email}
            />
          </UnderlineField>

          {showPassword && (
            <>
              <UnderlineField icon={LockIcon}>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t.registration.password}
                  minLength={6}
                  required={passwordRequired}
                />
              </UnderlineField>

              <UnderlineField icon={LockIcon}>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder={t.registration.confirmPassword}
                  minLength={6}
                  required={passwordRequired}
                />
              </UnderlineField>
            </>
          )}
        </div>
        {gradesLoaded && grades.length === 0 && (
          <span className="reg-form__field-note reg-form__field-note--center">
            تعذر تحميل الصفوف — تأكد أن السيرفر شغّال
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="reg-form">
      <p className="reg-form__hint">{t.registration.hint}</p>
      <div className="reg-form__grid">
        <div className="reg-form__field">
          <label htmlFor="first_name">{t.registration.firstName}</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder={t.registration.firstName}
            required
          />
        </div>

        <div className="reg-form__field">
          <label htmlFor="last_name">{t.registration.lastName}</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder={t.registration.lastName}
            required
          />
        </div>

        <div className="reg-form__field">
          <label htmlFor="phone">{t.registration.phone}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            required
          />
        </div>

        <div className="reg-form__field">
          <label htmlFor="parent_phone">{t.registration.parentPhone}</label>
          <input
            type="tel"
            id="parent_phone"
            name="parent_phone"
            value={form.parent_phone}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            required
          />
        </div>

        <div className="reg-form__field reg-form__field--full">
          <label htmlFor="governorate">{t.registration.governorate}</label>
          <select
            id="governorate"
            name="governorate"
            value={form.governorate}
            onChange={handleChange}
            required
          >
            <option value="">{t.registration.governoratePlaceholder}</option>
            {GOVERNORATES.map((gov) => (
              <option key={gov.value} value={gov.value}>
                {pickGovernorateLabel(gov, lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="reg-form__field reg-form__field--full">
          <label htmlFor="grade_id">{t.registration.grade}</label>
          <select
            id="grade_id"
            name="grade_id"
            value={form.grade_id}
            onChange={handleChange}
            required
          >
            <option value="">{t.registration.gradePlaceholder}</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {pickGradeName(grade, lang)}
              </option>
            ))}
          </select>
          {gradesLoaded && grades.length === 0 && (
            <span className="reg-form__field-note">تعذر تحميل الصفوف — تأكد أن السيرفر شغّال</span>
          )}
        </div>

        <div className="reg-form__field">
          <label htmlFor="address">{t.registration.address}</label>
          <input
            type="text"
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder={t.registration.address}
            required
          />
        </div>

        <div className="reg-form__field">
          <label htmlFor="email">{t.registration.email}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
          />
        </div>

        {showPassword && (
          <>
            <div className="reg-form__field">
              <label htmlFor="password">{t.registration.password}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={6}
                required={passwordRequired}
              />
            </div>

            <div className="reg-form__field">
              <label htmlFor="confirm_password">{t.registration.confirmPassword}</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={6}
                required={passwordRequired}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { GridIcon };
