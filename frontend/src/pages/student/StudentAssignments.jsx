import { useEffect, useState } from 'react';
import {
  fetchStudentAssignment,
  fetchStudentAssignments,
  submitStudentAssignment,
  uploadStudentFile,
} from '../../api/studentApi';
import { fileLinkLabel } from '../../api/uploadApi';
import QuestionViewer from '../../student/QuestionViewer';

export default function StudentAssignments() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudentAssignments()
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openItem = async (id) => {
    setError('');
    setStatus('');
    setPdfFile(null);
    try {
      const res = await fetchStudentAssignment(id);
      const data = res.data;
      setSelected(data);
      setAnswers(data.submission?.answers || {});
      setPdfUrl(data.submission?.pdf_url || '');
    } catch (err) {
      setError(err.message);
    }
  };

  const closeItem = () => {
    setSelected(null);
    setAnswers({});
    setPdfFile(null);
    setPdfUrl('');
    setStatus('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const mode = selected.delivery_mode === 'pdf' ? 'pdf' : 'manual';
      let submittedPdf = pdfUrl;

      if (mode === 'pdf') {
        if (pdfFile) {
          submittedPdf = await uploadStudentFile(pdfFile, 'pdf');
          setPdfUrl(submittedPdf);
        }
        if (!String(submittedPdf || '').trim()) {
          throw new Error('ارفع ملف PDF الإجابة');
        }
        await submitStudentAssignment(selected.id, { pdf_url: submittedPdf });
      } else {
        await submitStudentAssignment(selected.id, { answers });
      }

      setStatus('تم تسليم الواجب بنجاح');
      const refreshed = await fetchStudentAssignment(selected.id);
      setSelected(refreshed.data);
      setAnswers(refreshed.data.submission?.answers || {});
      setPdfUrl(refreshed.data.submission?.pdf_url || '');
      setPdfFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="student-loading">جاري التحميل...</div>;

  return (
    <div className="student-page">
      <section className="dash-panel student-panel">
        <div className="student-panel__head">
          <div>
            <h2>واجباتي</h2>
            <p>كل الواجبات المطلوبة منك</p>
          </div>
          <span className="student-panel__badge">{rows.length} واجب</span>
        </div>
      {error && !selected && <div className="student-alert">{error}</div>}
      {rows.length === 0 ? (
        <p className="student-empty">مفيش واجبات لصفّك حالياً</p>
      ) : (
        <table className="student-table">
          <thead>
            <tr>
              <th>#</th>
              <th>العنوان</th>
              <th>النوع</th>
              <th>الصف</th>
              <th>الكورس</th>
              <th>التسليم</th>
              <th>عرض</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.title_ar}</td>
                <td>{row.delivery_mode === 'pdf' ? 'PDF' : 'أسئلة يدوية'}</td>
                <td>{row.grade_name || '—'}</td>
                <td>{row.course_title || '—'}</td>
                <td>{row.due_date || '—'}</td>
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
          <p className="student-assignment-type">
            طريقة الإجابة: {selected.delivery_mode === 'pdf' ? 'رفع ملف PDF' : 'إجابة الأسئلة يدوياً'}
          </p>
          {selected.image_url && (
            <div className="student-detail-links">
              <a href={selected.image_url} target="_blank" rel="noreferrer">صورة الواجب</a>
            </div>
          )}

          {error && <div className="student-alert">{error}</div>}
          {status && <div className="student-alert student-alert--ok">{status}</div>}

          <form className="student-assignment-form" onSubmit={onSubmit}>
            {selected.delivery_mode === 'pdf' ? (
              <div className="student-pdf-submit">
                {selected.file_url && (
                  <a className="student-btn" href={selected.file_url} target="_blank" rel="noreferrer">
                    تحميل واجب PDF ({fileLinkLabel(selected.file_url)})
                  </a>
                )}
                <label className="student-file-field">
                  ارفع إجابتك PDF
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
                {(pdfFile || pdfUrl) && (
                  <p className="student-file-selected">
                    {pdfFile ? `تم اختيار: ${pdfFile.name}` : `تم التسليم سابقاً: ${fileLinkLabel(pdfUrl)}`}
                    {pdfUrl && !pdfFile && (
                      <>
                        {' · '}
                        <a href={pdfUrl} target="_blank" rel="noreferrer">عرض الملف</a>
                      </>
                    )}
                  </p>
                )}
              </div>
            ) : (
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
            )}

            <button type="submit" className="student-btn student-btn--primary" disabled={saving}>
              {saving ? 'جاري التسليم...' : selected.submission ? 'تحديث التسليم' : 'تسليم الواجب'}
            </button>
          </form>
        </div>
      )}
      </section>
    </div>
  );
}
