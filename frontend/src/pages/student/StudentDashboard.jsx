import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchStudentAssignments,
  fetchStudentCourses,
  fetchStudentExams,
  fetchStudentOverview,
} from '../../api/studentApi';
import { IconAssignments, IconCourses, IconExams, IconTrend } from '../../admin/DashboardIcons';

export default function StudentDashboard() {
  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchStudentOverview(),
      fetchStudentCourses(),
      fetchStudentAssignments(),
      fetchStudentExams(),
    ])
      .then(([ov, crs, asg, ex]) => {
        setOverview(ov.data);
        setCourses((crs.data || []).slice(0, 3));
        setAssignments((asg.data || []).slice(0, 3));
        setExams((ex.data || []).slice(0, 3));
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="student-alert">{error}</div>;
  if (!overview) return <div className="student-loading">جاري تحميل لوحة الطالب...</div>;

  return (
    <div className="student-page">
      <div className="dash-card-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-card__head">
            <p>كورساتي</p>
            <span className="dash-stat-card__icon"><IconCourses /></span>
          </div>
          <h3>{overview.totalCourses}</h3>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-card__head">
            <p>متوسط التقدم</p>
            <span className="dash-stat-card__icon dash-stat-card__icon--navy"><IconTrend /></span>
          </div>
          <h3>{overview.avgProgress}%</h3>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-card__head">
            <p>واجبات</p>
            <span className="dash-stat-card__icon"><IconAssignments /></span>
          </div>
          <h3>{overview.assignments}</h3>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-card__head">
            <p>اختبارات</p>
            <span className="dash-stat-card__icon dash-stat-card__icon--navy"><IconExams /></span>
          </div>
          <h3>{overview.exams}</h3>
        </div>
      </div>

      <section className="dash-panel student-panel">
        <div className="student-panel__head">
          <div>
            <h2>كورساتك الحالية</h2>
            <p>آخر الكورسات اللي بتذاكر فيها</p>
          </div>
          <Link to="/student/courses" className="student-btn student-btn--ghost">عرض الكل</Link>
        </div>
        {courses.length === 0 ? (
          <p className="student-empty">لسه مش مشترك في كورسات</p>
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
                <p className="student-course-card__meta">{course.grade_name}</p>
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
            <h2>أحدث الواجبات</h2>
            <p>الواجبات المطلوبة منك</p>
          </div>
          <Link to="/student/assignments" className="student-btn student-btn--ghost">كل الواجبات</Link>
        </div>
        {assignments.length === 0 ? (
          <p className="student-empty">مفيش واجبات حالياً</p>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>الواجب</th>
                <th>الكورس</th>
                <th>التسليم</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td>{item.title_ar}</td>
                  <td>{item.course_title || '—'}</td>
                  <td>{item.due_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="dash-panel student-panel">
        <div className="student-panel__head">
          <div>
            <h2>اختباراتك</h2>
            <p>الاختبارات المتاحة لصفّك</p>
          </div>
          <Link to="/student/exams" className="student-btn student-btn--ghost">كل الاختبارات</Link>
        </div>
        {exams.length === 0 ? (
          <p className="student-empty">مفيش اختبارات حالياً</p>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>الاختبار</th>
                <th>الكورس</th>
                <th>المدة</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((item) => (
                <tr key={item.id}>
                  <td>{item.title_ar}</td>
                  <td>{item.course_title || '—'}</td>
                  <td>{item.duration_minutes} دقيقة</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
