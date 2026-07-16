import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCourseAttendance, updateCourseAttendance } from '../../api/adminApi';
import { IconAttendance } from '../../admin/DashboardIcons';

function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function studentInitial(name) {
  return (name || 'ط').trim().charAt(0).toUpperCase();
}

export default function AdminAttendanceCourse() {
  const { courseId } = useParams();
  const [date, setDate] = useState(todayISO);
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percent: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchCourseAttendance(courseId, date)
      .then((res) => {
        setCourse(res.data.course);
        setStudents(res.data.students || []);
        setStats(res.data.stats || { total: 0, present: 0, absent: 0, percent: 0 });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAttendance = async (student) => {
    const nextStatus = student.status === 'present' ? 'absent' : 'present';
    setSavingId(student.id);
    setError('');
    try {
      await updateCourseAttendance(courseId, {
        student_id: student.id,
        date,
        status: nextStatus,
      });
      setStudents((prev) => prev.map((row) => (
        row.id === student.id
          ? {
            ...row,
            status: nextStatus,
            status_label: nextStatus === 'present' ? 'حاضر' : 'غائب',
            is_manual: true,
          }
          : row
      )));
      setStats((prev) => {
        const wasPresent = student.status === 'present';
        const present = prev.present + (nextStatus === 'present' && !wasPresent ? 1 : 0)
          - (nextStatus === 'absent' && wasPresent ? 1 : 0);
        const total = prev.total;
        return {
          total,
          present,
          absent: total - present,
          percent: total ? Math.round((present / total) * 100) : 0,
        };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading && !course) return <div className="admin-loading">جاري التحميل...</div>;

  return (
    <div className="attendance-course-page">
      <Link to="/admin/attendance" className="attendance-course-page__back">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        العودة للكورسات
      </Link>

      <div className="attendance-course-page__head dash-panel">
        <div className="attendance-course-page__title">
          <span className="attendance-course-page__title-icon">
            <IconAttendance />
          </span>
          <div>
            <h1>{course?.title_ar}</h1>
            <p>{course?.grade_name || '—'}</p>
          </div>
        </div>

        <label className="attendance-date-field">
          <span>تاريخ الحضور</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      <div className="attendance-stats">
        <div className="attendance-stat attendance-stat--present">
          <strong>{stats.present}</strong>
          <span>حاضر</span>
        </div>
        <div className="attendance-stat attendance-stat--absent">
          <strong>{stats.absent}</strong>
          <span>غائب</span>
        </div>
        <div className="attendance-stat attendance-stat--rate">
          <strong>{stats.percent}%</strong>
          <span>نسبة الحضور</span>
        </div>
      </div>

      <div className="dash-panel attendance-table-panel">
        <div className="attendance-table-panel__head">
          <span>الطالب</span>
          <span>الحضور</span>
        </div>
        <p className="attendance-auto-hint">
          الحضور يُسجَّل تلقائياً أول ما الطالب يفتح الكورس أو يشغّل فيديو/درس. التبديل اليدوي للتعديل فقط.
        </p>

        {loading ? (
          <p className="attendance-table-panel__loading">جاري التحميل...</p>
        ) : students.length === 0 ? (
          <p className="attendance-table-panel__empty">مفيش طلاب مسجّلين في هذا الكورس</p>
        ) : (
          <ul className="attendance-student-list">
            {students.map((student, index) => {
              const isPresent = student.status === 'present';
              return (
                <li key={student.id} className="attendance-student-row">
                  <div className="attendance-student-row__info">
                    <span className="attendance-student-row__index">{index + 1}</span>
                    <span className="attendance-student-row__avatar">
                      {studentInitial(student.name)}
                    </span>
                    <div>
                      <strong>{student.name}</strong>
                      <small>{student.email}</small>
                    </div>
                  </div>

                  <div className="attendance-student-row__toggle-wrap">
                    <span className={`attendance-student-row__label${isPresent ? ' is-present' : ''}`}>
                      {student.status_label}
                      {student.is_auto ? (
                        <em className="attendance-student-row__auto">تلقائي</em>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      className={`attendance-toggle${isPresent ? ' is-on' : ''}`}
                      role="switch"
                      aria-checked={isPresent}
                      aria-label={`تسجيل ${student.name} ${isPresent ? 'غائب' : 'حاضر'}`}
                      disabled={savingId === student.id}
                      onClick={() => toggleAttendance(student)}
                    >
                      <span />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
