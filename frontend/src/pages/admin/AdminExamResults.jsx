import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { adminResource, fetchExamResults } from '../../api/adminApi';
import AdminDataTable from '../../admin/AdminDataTable';
import AdminModal from '../../admin/AdminModal';
import DashSelect from '../../admin/DashSelect';

const examsApi = adminResource('exams');

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ar-EG');
  } catch {
    return String(value);
  }
}

export default function AdminExamResults() {
  const { examId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answersOpen, setAnswersOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);

  const selectedId = examId || searchParams.get('id') || '';

  useEffect(() => {
    examsApi
      .list()
      .then((res) => setExams(res.data || []))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    fetchExamResults(selectedId)
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const examOptions = useMemo(
    () =>
      (exams || []).map((e) => ({
        value: String(e.id),
        label: `اختبار — ${e.title_ar}`,
      })),
    [exams],
  );

  const onSelectExam = (value) => {
    if (!value) {
      navigate('/admin/exams/results');
      setSearchParams({});
      return;
    }
    navigate(`/admin/exams/${value}/results`);
  };

  const openAnswers = (row) => {
    setActiveResult(row);
    setAnswersOpen(true);
  };

  const exam = data?.exam;
  const results = data?.results || [];
  const questions = data?.questions || [];
  const stats = data?.stats || { total: 0, avgScore: 0 };

  return (
    <div className="dash-page submissions-page">
      <div className="submissions-page__intro">
        <div>
          <h1>نتائج الاختبارات</h1>
          <div className="submissions-page__legend">
            <span>
              <i className="submissions-page__legend-icon" aria-hidden="true">%</i>
              الدرجة تظهر كنسبة مئوية من الإجابات الصحيحة
            </span>
            <span>
              <i className="submissions-page__legend-icon" aria-hidden="true">✓</i>
              عرض إجابات الطالب ومقارنتها بالصحيحة
            </span>
          </div>
        </div>

        <div className="submissions-page__filter">
          <DashSelect
            label="الاختبار"
            value={selectedId ? String(selectedId) : ''}
            onChange={(e) => onSelectExam(e.target.value)}
            options={[{ value: '', label: 'اختر اختباراً...' }, ...examOptions]}
            placeholder="اختر اختباراً..."
          />
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      {!selectedId ? (
        <div className="dash-panel">
          <p className="admin-empty">اختر اختباراً من القائمة لعرض النتائج.</p>
        </div>
      ) : (
        <div className="dash-panel dash-panel--table">
          <div className="dash-panel__head">
            <div>
              <h2>{exam?.title_ar || 'نتائج الاختبار'}</h2>
              <p className="submissions-page__meta">
                {[exam?.course_title, exam?.grade_name].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className="submissions-page__head-actions">
              <span className="admin-results-stats admin-results-stats--inline">
                <span>{stats.total} محاولة</span>
                <span>متوسط: <strong>{stats.avgScore || 0}%</strong></span>
              </span>
              <Link to="/admin/exams" className="dash-btn dash-btn--outline dash-btn--sm">
                رجوع للاختبارات
              </Link>
            </div>
          </div>

          <AdminDataTable
            loading={loading}
            emptyText="لا توجد أي محاولات لهذا الاختبار حتى الآن."
            rows={results}
            columns={[
              {
                key: 'student_name',
                label: 'الطالب',
                render: (r) => (
                  <div className="submissions-page__student">
                    <strong>{r.student_name || '—'}</strong>
                    <small>{r.student_email || ''}</small>
                  </div>
                ),
              },
              {
                key: 'exam_title',
                label: 'الاختبار',
                render: () => exam?.title_ar || '—',
              },
              {
                key: 'grade_name',
                label: 'الصف',
                render: (r) => r.grade_name || exam?.grade_name || '—',
              },
              {
                key: 'course_title',
                label: 'الكورس',
                render: (r) => r.course_title || exam?.course_title || '—',
              },
              {
                key: 'submitted_at',
                label: 'وقت التسليم',
                render: (r) => formatWhen(r.submitted_at),
              },
              {
                key: 'status',
                label: 'الحالة',
                render: () => (
                  <span className="submissions-page__status">مُسلم</span>
                ),
              },
              {
                key: 'score',
                label: 'الدرجة',
                render: (r) => (
                  <div className="exam-results-score">
                    <strong>{Number(r.score || 0)}%</strong>
                    <small>
                      {r.correct_count ?? 0}/{r.total_questions ?? 0} صح
                    </small>
                  </div>
                ),
              },
            ]}
            actions={(row) => (
              <button
                type="button"
                className="dash-btn dash-btn--outline dash-btn--sm"
                onClick={() => openAnswers(row)}
              >
                عرض الإجابات
              </button>
            )}
          />
        </div>
      )}

      <AdminModal
        open={answersOpen}
        wide
        title={
          activeResult
            ? `إجابات: ${activeResult.student_name || 'طالب'}`
            : 'الإجابات'
        }
        onClose={() => {
          setAnswersOpen(false);
          setActiveResult(null);
        }}
      >
        {!activeResult ? null : (
          <div className="admin-submission-answers">
            <div className="admin-results-stats">
              <span>
                الدرجة: <strong>{Number(activeResult.score || 0)}%</strong>
              </span>
              <span>
                الصحيح:{' '}
                <strong>
                  {activeResult.correct_count ?? 0}/{activeResult.total_questions ?? 0}
                </strong>
              </span>
              <span>
                التسليم: <strong>{formatWhen(activeResult.submitted_at)}</strong>
              </span>
            </div>

            {questions.map((q, i) => (
              <div key={q.id || i} className="admin-submission-answer">
                <p>
                  <strong>س{i + 1}:</strong> {q.question_text}
                </p>
                <p className="admin-submission-answer__value">
                  إجابة الطالب: {String(activeResult.answers?.[String(q.id)] || '—')}
                </p>
                {q.correct_answer ? (
                  <p className="admin-submission-answer__correct">
                    الإجابة الصحيحة: {String(q.correct_answer)}
                  </p>
                ) : null}
              </div>
            ))}

            {!questions.length && (
              <pre>{JSON.stringify(activeResult.answers || {}, null, 2)}</pre>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
