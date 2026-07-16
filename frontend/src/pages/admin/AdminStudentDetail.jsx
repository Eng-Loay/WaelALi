import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAdminStudent } from '../../api/adminApi';
import { fileLinkLabel } from '../../api/uploadApi';
import AdminDataTable, { DashBadge } from '../../admin/AdminDataTable';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminStudentDetail() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAdminStudent(studentId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="dash-panel">جاري التحميل...</div>;
  if (error) return <div className="admin-alert error">{error}</div>;
  if (!data) return null;

  const { student, enrollments, submissions, activity, stats } = data;

  return (
    <div className="dash-page student-detail-page">
      <div className="dash-toolbar">
        <Link to="/admin/subscribers" className="dash-btn dash-btn--outline">
          ← رجوع للطلاب
        </Link>
      </div>

      <div className="dash-panel student-detail-hero">
        <div>
          <h1>{student.name}</h1>
          <p>{student.email}</p>
        </div>
        <div className="student-detail-hero__meta">
          <span>الصف: {student.grade_name || '—'}</span>
          <span>الموبايل: {student.phone || '—'}</span>
          <span>ولي الأمر: {student.parent_phone || '—'}</span>
          <span>تاريخ التسجيل: {formatDate(student.created_at)}</span>
        </div>
      </div>

      <div className="dash-stats-grid student-detail-stats">
        <div className="dash-stat-card">
          <p>الدورات</p>
          <h3>{stats.courses_count}</h3>
        </div>
        <div className="dash-stat-card">
          <p>حضور في دورات</p>
          <h3>{stats.present_courses}</h3>
        </div>
        <div className="dash-stat-card">
          <p>واجبات مسلّمة</p>
          <h3>{stats.assignments_submitted}</h3>
        </div>
        <div className="dash-stat-card">
          <p>أنشطة مسجّلة</p>
          <h3>{stats.activity_total}</h3>
        </div>
      </div>

      <div className="dash-panel dash-panel--table">
        <div className="dash-panel__head">
          <h2>الدورات والحضور</h2>
        </div>
        <AdminDataTable
          rows={enrollments}
          emptyText="لا يوجد اشتراكات"
          columns={[
            { key: 'course_title', label: 'الدورة' },
            { key: 'progress', label: 'التقدم', render: (r) => `${r.progress || 0}%` },
            {
              key: 'attendance_label',
              label: 'الحضور',
              render: (r) => (
                <DashBadge
                  active={r.attendance === 'present'}
                  activeLabel="حاضر"
                  inactiveLabel="غائب"
                />
              ),
            },
            {
              key: 'lessons_opened',
              label: 'دروس مفتوحة',
              render: (r) => `${r.lessons_opened || 0} / ${r.lessons_total || 0}`,
            },
            { key: 'last_activity_at', label: 'آخر نشاط', render: (r) => formatDate(r.last_activity_at) },
            { key: 'enrolled_at', label: 'تاريخ الاشتراك', render: (r) => formatDate(r.enrolled_at) },
          ]}
        />
      </div>

      <div className="dash-panel dash-panel--table">
        <div className="dash-panel__head">
          <h2>تسليمات الواجبات</h2>
        </div>
        <AdminDataTable
          rows={submissions}
          emptyText="لا توجد تسليمات"
          columns={[
            { key: 'assignment_title', label: 'الواجب' },
            { key: 'course_title', label: 'الدورة', render: (r) => r.course_title || '—' },
            {
              key: 'pdf_url',
              label: 'ملف PDF',
              render: (r) => (r.pdf_url ? fileLinkLabel(r.pdf_url) : '—'),
            },
            { key: 'updated_at', label: 'آخر تحديث', render: (r) => formatDate(r.updated_at) },
          ]}
        />
      </div>

      <div className="dash-panel dash-panel--table">
        <div className="dash-panel__head">
          <h2>سجل النشاط على الموقع</h2>
        </div>
        <AdminDataTable
          rows={activity}
          emptyText="لا يوجد نشاط مسجّل بعد"
          columns={[
            { key: 'activity_label', label: 'النشاط' },
            { key: 'title_ar', label: 'العنوان', render: (r) => r.title_ar || r.lesson_title || '—' },
            { key: 'course_title', label: 'الدورة', render: (r) => r.course_title || '—' },
            { key: 'created_at', label: 'الوقت', render: (r) => formatDate(r.created_at) },
          ]}
        />
      </div>
    </div>
  );
}
