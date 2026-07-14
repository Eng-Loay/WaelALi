import { useEffect, useState } from 'react';
import {
  enrollCourse,
  fetchAvailableCourses,
  fetchStudentCourses,
  updateCourseProgress,
} from '../../api/studentApi';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [available, setAvailable] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  const bumpProgress = async (courseId, current) => {
    const next = Math.min(100, Number(current) + 10);
    await updateCourseProgress(courseId, next);
    await load();
  };

  const onEnroll = async (courseId) => {
    await enrollCourse(courseId);
    await load();
  };

  if (loading) return <div className="student-loading">جاري التحميل...</div>;
  if (error) return <div className="student-alert">{error}</div>;

  return (
    <div>
      <div className="student-panel">
        <h2>كورساتي</h2>
        {courses.length === 0 ? (
          <p className="student-empty">لسه مفيش كورسات مشتركة</p>
        ) : (
          <div className="student-course-grid">
            {courses.map((course) => (
              <article key={course.id} className="student-course-card">
                <h3>{course.title_ar}</h3>
                <p>{course.grade_name} • {course.lessons_count} درس</p>
                <div className="student-progress"><span style={{ width: `${course.progress}%` }} /></div>
                <div className="student-course-meta">
                  <span>{course.progress}%</span>
                  <span>{course.status === 'completed' ? 'مكتمل' : 'جاري'}</span>
                </div>
                <div className="student-actions">
                  <button type="button" className="primary" onClick={() => bumpProgress(course.id, course.progress)}>
                    تقدّم +10%
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="student-panel">
        <h2>كورسات متاحة للاشتراك</h2>
        {available.length === 0 ? (
          <p className="student-empty">مفيش كورسات جديدة حالياً</p>
        ) : (
          <div className="student-course-grid">
            {available.map((course) => (
              <article key={course.id} className="student-course-card">
                <h3>{course.title_ar}</h3>
                <p>{course.grade_name}</p>
                <p>{course.price} ج.م</p>
                <div className="student-actions">
                  <button type="button" className="primary" onClick={() => onEnroll(course.id)}>
                    اشترك في الكورس
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
