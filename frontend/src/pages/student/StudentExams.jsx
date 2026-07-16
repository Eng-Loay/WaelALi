import { useEffect, useState } from 'react';
import {
  fetchStudentExam,
  fetchStudentExams,
  submitStudentExam,
} from '../../api/studentApi';
import QuestionViewer from '../../student/QuestionViewer';

export default function StudentExams() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudentExams()
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openItem = async (id) => {
    setError('');
    setStatus('');
    try {
      const res = await fetchStudentExam(id);
      setSelected(res.data);
      setAnswers(res.data.submission?.answers || {});
    } catch (err) {
      setError(err.message);
    }
  };

  const closeItem = () => {
    setSelected(null);
    setAnswers({});
    setStatus('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const res = await submitStudentExam(selected.id, { answers });
      setStatus(
        `تم التسليم — درجتك ${res.data?.score ?? 0}% (${res.data?.correct_count ?? 0}/${res.data?.total_questions ?? 0})`,
      );
      const refreshed = await fetchStudentExam(selected.id);
      setSelected(refreshed.data);
      setAnswers(refreshed.data.submission?.answers || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="student-loading">جاري التحميل...</div>;
  if (error && !selected) return <div className="student-alert">{error}</div>;

  return (
    <div className="student-page">
      <section className="dash-panel student-panel">
        <div className="student-panel__head">
          <div>
            <h2>اختباراتي</h2>
            <p>الاختبارات المتاحة لصفّك</p>
          </div>
          <span className="student-panel__badge">{rows.length} اختبار</span>
        </div>
        {rows.length === 0 ? (
          <p className="student-empty">مفيش اختبارات لصفّك حالياً</p>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>الصف</th>
                <th>الكورس</th>
                <th>الأسئلة</th>
                <th>المدة</th>
                <th>عرض</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.title_ar}</td>
                  <td>{row.grade_name || '—'}</td>
                  <td>{row.course_title || '—'}</td>
                  <td>{row.questions_count}</td>
                  <td>{row.duration_minutes} دقيقة</td>
                  <td>
                    <button type="button" className="student-btn" onClick={() => openItem(row.id)}>فتح</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selected && (
          <div className="student-detail-card">
            <div className="student-detail-card__head">
              <h3>{selected.title_ar}</h3>
              <button type="button" className="student-btn student-btn--ghost" onClick={closeItem}>إغلاق</button>
            </div>
            {selected.description_ar && <p>{selected.description_ar}</p>}
            {selected.submission && (
              <p className="student-assignment-type">
                آخر نتيجة: {Number(selected.submission.score || 0)}%
                {' · '}
                {selected.submission.correct_count}/{selected.submission.total_questions} صح
              </p>
            )}

            {error && <div className="student-alert">{error}</div>}
            {status && <div className="student-alert student-alert--ok">{status}</div>}

            <form className="student-assignment-form" onSubmit={onSubmit}>
              <div className="student-questions">
                <h4>الأسئلة</h4>
                {(selected.questions || []).map((q, i) => (
                  <QuestionViewer
                    key={q.id || i}
                    question={q}
                    index={i}
                    value={answers[String(q.id)] || ''}
                    onChange={(val) => setAnswers((prev) => ({ ...prev, [String(q.id)]: val }))}
                  />
                ))}
              </div>
              <button type="submit" className="student-btn student-btn--primary" disabled={saving}>
                {saving ? 'جاري التسليم...' : selected.submission ? 'تحديث الإجابات' : 'تسليم الاختبار'}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
