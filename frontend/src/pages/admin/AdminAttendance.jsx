import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAttendanceCourses } from '../../api/adminApi';
import { IconCourses } from '../../admin/DashboardIcons';

const CARD_ACCENTS = ['green', 'blue', 'purple', 'orange', 'teal', 'rose'];

export default function AdminAttendance() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceCourses()
      .then((res) => setCourses(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">جاري التحميل...</div>;
  if (error) return <div className="admin-alert error">{error}</div>;

  return (
    <div className="attendance-page">
      <header className="attendance-page__hero">
        <h1>حضور وغياب الطلاب</h1>
        <p>اختر كورساً لعرض الطلاب المسجّلين وتسجيل الحضور</p>
      </header>

      {courses.length === 0 ? (
        <div className="dash-panel attendance-page__empty">
          <p>مفيش كورسات حالياً</p>
        </div>
      ) : (
        <div className="attendance-course-grid">
          {courses.map((course, index) => {
            const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
            return (
              <Link
                key={course.id}
                to={`/admin/attendance/${course.id}`}
                className={`attendance-course-card attendance-course-card--${accent}`}
              >
                <div className="attendance-course-card__top">
                  <span className="attendance-course-card__count">
                    {course.students_count || 0} طالب
                  </span>
                  <span className="attendance-course-card__icon" aria-hidden="true">
                    <IconCourses />
                  </span>
                </div>
                <h2>{course.title_ar}</h2>
                <p>{course.grade_name || '—'}</p>
                <span className="attendance-course-card__cta">
                  تسجيل الحضور
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
