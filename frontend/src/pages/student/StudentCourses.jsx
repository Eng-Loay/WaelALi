import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  enrollCourse,
  fetchAvailableCourses,
  fetchStudentCourses,
} from '../../api/studentApi';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [available, setAvailable] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [mine, open] = await Promise.all([fetchStudentCourses(), fetchAvailableCourses()]);
      setCourses(mine.data || []);
      setAvailable(open.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await enrollCourse(courseId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) return <div className="student-loading">جاري التحميل...</div>;
  if (error) return <div className="student-alert">{error}</div>;

  return (
    <div className="student-page">
      <section className="dash-panel student-panel">
        <div className="student-panel__head">
          <div>
            <h2>كورساتي</h2>
            <p>الكورسات اللي مشترك فيها حالياً</p>
          </div>
          <span className="student-panel__badge">{courses.length} كورس</span>
        </div>

        {courses.length === 0 ? (
          <p className="student-empty">لسه مفيش كورسات مشتركة</p>
        ) : (
          <div className="student-course-grid">
            {courses.map((course) => (
              <article key={course.id} className="student-course-card">
                <div className="student-course-card__top">
                  <span className="student-course-card__icon">π</span>
                  <span className={`student-course-card__status${course.status === 'completed' ? ' is-done' : ''}`}>
                    {course.status === 'completed' ? 'مكتمل' : 'جاري'}
                  </span>
                </div>
                <h3>{course.title_ar}</h3>
                <p className="student-course-card__meta">
                  {course.grade_name} • {course.lessons_count || 0} درس
                </p>
                <div className="student-progress" aria-hidden="true">
                  <span style={{ width: `${course.progress || 0}%` }} />
                </div>
                <div className="student-course-meta">
                  <strong>{course.progress || 0}%</strong>
                  <span>من التقدم</span>
                </div>
                <div className="student-actions">
                  <Link to={`/student/courses/${course.id}`} className="student-btn student-btn--primary">
                    فتح الكورس
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dash-panel student-panel">
        <div className="student-panel__head">
          <div>
            <h2>كورسات متاحة للاشتراك</h2>
            <p>كورسات جديدة تقدر تشترك فيها</p>
          </div>
          <span className="student-panel__badge student-panel__badge--muted">{available.length} متاح</span>
        </div>

        {available.length === 0 ? (
          <p className="student-empty">مفيش كورسات جديدة حالياً</p>
        ) : (
          <div className="student-course-grid">
            {available.map((course) => (
              <article key={course.id} className="student-course-card student-course-card--available">
                <div className="student-course-card__top">
                  <span className="student-course-card__icon student-course-card__icon--alt">+</span>
                  <span className="student-course-card__price">{Number(course.price || 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
                <h3>{course.title_ar}</h3>
                <p className="student-course-card__meta">{course.grade_name}</p>
                <div className="student-actions">
                  <button
                    type="button"
                    className="student-btn student-btn--primary"
                    onClick={() => onEnroll(course.id)}
                    disabled={enrollingId === course.id}
                  >
                    {enrollingId === course.id ? 'جاري الاشتراك...' : 'اشترك في الكورس'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
