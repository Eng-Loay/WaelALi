import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  adminResource,
  fetchAssignmentSubmissions,
} from '../../api/adminApi';
import { fileLinkLabel } from '../../api/uploadApi';
import AdminDataTable from '../../admin/AdminDataTable';
import AdminModal from '../../admin/AdminModal';
import DashSelect from '../../admin/DashSelect';

const assignmentsApi = adminResource('assignments');

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ar-EG');
  } catch {
    return String(value);
  }
}

function submissionType(sub, assignment) {
  if (sub.pdf_url) return 'PDF';
  if (assignment?.delivery_mode === 'manual' || sub.answers) return 'أسئلة يدوية';
  return '—';
}

export default function AdminAssignmentSubmissions() {
  const { assignmentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answersOpen, setAnswersOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);

  const selectedId = assignmentId || searchParams.get('id') || '';

  useEffect(() => {
    assignmentsApi
      .list()
      .then((res) => setAssignments(res.data || []))
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
    fetchAssignmentSubmissions(selectedId)
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const assignmentOptions = useMemo(
    () =>
      (assignments || []).map((a) => ({
        value: String(a.id),
        label: `واجب — ${a.title_ar}`,
      })),
    [assignments],
  );

  const onSelectAssignment = (value) => {
    if (!value) {
      navigate('/admin/assignments/submissions');
      setSearchParams({});
      return;
    }
    navigate(`/admin/assignments/${value}/submissions`);
  };

  const openAnswers = (sub) => {
    setActiveSubmission(sub);
    setAnswersOpen(true);
  };

  const assignment = data?.assignment;
  const submissions = data?.submissions || [];
  const questions = data?.questions || [];

  return (
    <div className="dash-page submissions-page">
      <div className="submissions-page__intro">
        <div>
          <h1>التسليمات</h1>
          <div className="submissions-page__legend">
            <span>
              <i className="submissions-page__legend-icon submissions-page__legend-icon--manual" aria-hidden="true">⏱</i>
              أسئلة يدوية — عرض الإجابات
            </span>
            <span>
              <i className="submissions-page__legend-icon submissions-page__legend-icon--pdf" aria-hidden="true">PDF</i>
              مرفق PDF — عرض ملف الطالب
            </span>
          </div>
        </div>

        <div className="submissions-page__filter">
          <DashSelect
            label="الواجب"
            value={selectedId ? String(selectedId) : ''}
            onChange={(e) => onSelectAssignment(e.target.value)}
            options={[{ value: '', label: 'اختر واجباً...' }, ...assignmentOptions]}
            placeholder="اختر واجباً..."
          />
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      {!selectedId ? (
        <div className="dash-panel">
          <p className="admin-empty">اختر واجباً من القائمة لعرض التسليمات.</p>
        </div>
      ) : (
        <div className="dash-panel dash-panel--table">
          <div className="dash-panel__head">
            <div>
              <h2>{assignment?.title_ar || 'تسليمات الواجب'}</h2>
              <p className="submissions-page__meta">
                {[assignment?.course_title, assignment?.grade_name]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>
            </div>
            <div className="submissions-page__head-actions">
              <span>{submissions.length} تسليم</span>
              <Link to="/admin/assignments" className="dash-btn dash-btn--outline dash-btn--sm">
                رجوع للواجبات
              </Link>
            </div>
          </div>

          <AdminDataTable
            loading={loading}
            emptyText="لا توجد أي تسليمات لهذا الواجب حتى الآن."
            rows={submissions}
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
                key: 'assignment_title',
                label: 'الواجب',
                render: () => assignment?.title_ar || '—',
              },
              {
                key: 'grade_name',
                label: 'الصف',
                render: (r) => r.grade_name || assignment?.grade_name || '—',
              },
              {
                key: 'course_title',
                label: 'الكورس',
                render: (r) => r.course_title || assignment?.course_title || '—',
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
                render: () => '—',
              },
              {
                key: 'type',
                label: 'النوع',
                render: (r) => submissionType(r, assignment),
              },
            ]}
            actions={(row) => (
              <>
                {row.pdf_url ? (
                  <a
                    href={row.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="dash-btn dash-btn--outline dash-btn--sm"
                  >
                    عرض PDF
                  </a>
                ) : (
                  <button
                    type="button"
                    className="dash-btn dash-btn--outline dash-btn--sm"
                    onClick={() => openAnswers(row)}
                  >
                    عرض الإجابات
                  </button>
                )}
              </>
            )}
          />
        </div>
      )}

      <AdminModal
        open={answersOpen}
        wide
        title={
          activeSubmission
            ? `إجابات: ${activeSubmission.student_name || 'طالب'}`
            : 'الإجابات'
        }
        onClose={() => {
          setAnswersOpen(false);
          setActiveSubmission(null);
        }}
      >
        {!activeSubmission ? null : (
          <div className="admin-submission-answers">
            {activeSubmission.pdf_url ? (
              <a
                href={activeSubmission.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="dash-btn dash-btn--outline"
              >
                فتح ملف PDF ({fileLinkLabel(activeSubmission.pdf_url)})
              </a>
            ) : (
              <>
                {questions.map((q, i) => (
                  <div key={q.id || i} className="admin-submission-answer">
                    <p>
                      <strong>س{i + 1}:</strong> {q.question_text}
                    </p>
                    <p className="admin-submission-answer__value">
                      الإجابة: {String(activeSubmission.answers?.[String(q.id)] || '—')}
                    </p>
                  </div>
                ))}
                {!questions.length && (
                  <pre>{JSON.stringify(activeSubmission.answers || {}, null, 2)}</pre>
                )}
              </>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
