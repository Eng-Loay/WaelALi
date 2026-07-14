import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentLogin } from '../../api/studentApi';
import '../../student/student.css';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await studentLogin(email, password);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-auth-page" dir="rtl">
      <div className="student-auth-card">
        <h1>تسجيل دخول الطالب</h1>
        <p>ادخل لحسابك وشوّف كورساتك وتقدمك</p>
        <form className="student-auth-form" onSubmit={handleSubmit}>
          {error && <div className="student-alert">{error}</div>}
          <label>
            البريد الإلكتروني
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            كلمة المرور
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
        <p className="student-auth-switch">
          مش عندك حساب؟ <Link to="/student/register">إنشاء حساب</Link>
        </p>
        <p className="student-auth-switch">
          <Link to="/admin/login">دخول الأدمن</Link>
        </p>
      </div>
    </div>
  );
}
