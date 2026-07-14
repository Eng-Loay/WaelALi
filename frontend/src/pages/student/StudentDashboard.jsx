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

  if (error) return <div className="admin-alert error">{error}</div>;
  if (!overview) return <div className="admin-loading">جاري تحميل لوحة الطالب...</div>;

  return (
    <div>
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

      <div className="dash-panel student-panel">
        <div className="admin-page-head">
          <h2>كورساتك الحالية</h2>
          <Link to="/student/courses">عرض الكل</Link>
        </div>
        {courses.length === 0 ? (
          <p className="admin-empty">لسه مش مشترك في كورسات</p>
        ) : (
          <div className="student-course-grid">
            {courses.map((course) => (
              <article key={course.id} className="student-course-card">
                <h3>{course.title_ar}</h3>
                <p>{course.grade_name}</p>
                <div className="student-progress"><span style={{ width: `${course.progress}%` }} /></div>
                <div className="student-course-meta">
                  <span>{course.progress}%</span>
                  <span>{course.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="dash-panel student-panel">
        <h2>أحدث الواجبات</h2>
        {assignments.length === 0 ? (
          <p className="admin-empty">مفيش واجبات حالياً</p>
        ) : (
          <table className="admin-table">
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
      </div>

      <div className="dash-panel student-panel">
        <h2>اختباراتك</h2>
        {exams.length === 0 ? (
          <p className="admin-empty">مفيش اختبارات حالياً</p>
        ) : (
          <table className="admin-table">
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
      </div>
    </div>
  );
}
