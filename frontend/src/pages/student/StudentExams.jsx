import { useEffect, useState } from 'react';
import { fetchStudentExam, fetchStudentExams } from '../../api/studentApi';
import { fileLinkLabel } from '../../api/uploadApi';
import QuestionViewer from '../../student/QuestionViewer';

export default function StudentExams() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentExams()
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openItem = async (id) => {
    try {
      const res = await fetchStudentExam(id);
      setSelected(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="student-loading">جاري التحميل...</div>;
  if (error) return <div className="student-alert">{error}</div>;

  return (
    <div className="student-panel">
      <h2>اختباراتي</h2>
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
            <button type="button" className="student-btn student-btn--ghost" onClick={() => setSelected(null)}>إغلاق</button>
          </div>
          {selected.description_ar && <p>{selected.description_ar}</p>}
          <div className="student-detail-links">
            {selected.image_url && <a href={selected.image_url} target="_blank" rel="noreferrer">صورة الاختبار</a>}
            {selected.file_url && <a href={selected.file_url} target="_blank" rel="noreferrer">PDF الاختبار ({fileLinkLabel(selected.file_url)})</a>}
          </div>
          {(selected.questions || []).length > 0 && (
            <div className="student-questions">
              <h4>الأسئلة</h4>
              {selected.questions.map((q, i) => (
                <QuestionViewer key={q.id || i} question={q} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
