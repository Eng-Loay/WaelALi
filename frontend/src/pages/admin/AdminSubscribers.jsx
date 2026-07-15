import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminResource } from '../../api/adminApi';
import {
  createAdminStudent,
  enrollStudentByEmail,
  fetchAdminStudents,
  lookupStudentByEmail,
} from '../../api/adminApi';
import AdminDataTable, { DashBadge } from '../../admin/AdminDataTable';
import AdminModal from '../../admin/AdminModal';
import StageGradeSelect from '../../admin/StageGradeSelect';
import { IconPlus } from '../../admin/DashboardIcons';

const coursesApi = adminResource('courses');
const gradesApi = adminResource('grades');

const emptyStudentForm = {
  name: '',
  email: '',
  phone: '',
  parent_phone: '',
  password: '',
  grade_id: '',
  course_id: '',
};

export default function AdminSubscribers() {
  const [searchParams] = useSearchParams();
  const filterCourseId = searchParams.get('course_id');

  const [rows, setRows] = useState([]);
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [studentStage, setStudentStage] = useState('');
  const [savingStudent, setSavingStudent] = useState(false);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAdminStudents(filterCourseId)
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    Promise.all([coursesApi.list(), gradesApi.list()])
      .then(([coursesRes, gradesRes]) => {
        setCourses(coursesRes.data || []);
        setGrades(gradesRes.data || []);
      })
      .catch(console.error);
  }, [filterCourseId]);

  const resetAddModal = () => {
    setStudentForm(emptyStudentForm);
    setStudentStage('');
    setError('');
  };

  const resetEnrollModal = () => {
    setEnrollEmail('');
    setCourseId('');
    setFoundStudent(null);
    setError('');
  };

  const openAddModal = () => {
    resetAddModal();
    setSuccess('');
    setAddOpen(true);
  };

  const openEnrollModal = () => {
    resetEnrollModal();
    setSuccess('');
    setEnrollOpen(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setSavingStudent(true);
    setError('');
    setSuccess('');
    try {
      const res = await createAdminStudent({
        name: studentForm.name.trim(),
        email: studentForm.email.trim(),
        phone: studentForm.phone.trim(),
        parent_phone: studentForm.parent_phone.trim(),
        password: studentForm.password,
        grade_id: Number(studentForm.grade_id),
        course_id: studentForm.course_id ? Number(studentForm.course_id) : null,
      });
      setSuccess(res.message || 'تم إضافة الطالب بنجاح');
      setAddOpen(false);
      resetAddModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleSearchStudent = async () => {
    setSearching(true);
    setError('');
    setFoundStudent(null);
    try {
      const res = await lookupStudentByEmail(enrollEmail);
      setFoundStudent(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    setError('');
    setSuccess('');
    try {
      const res = await enrollStudentByEmail({
        email: enrollEmail.trim(),
        course_id: Number(courseId),
      });
      setSuccess(res.message || 'تم التسجيل في الدورة');
      setEnrollOpen(false);
      resetEnrollModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const filteredCourse = courses.find((c) => String(c.id) === filterCourseId);

  return (
    <div className="dash-page">
      <div className="dash-toolbar">
        <div className="dash-toolbar__actions">
          <button type="button" className="dash-btn dash-btn--primary" onClick={openAddModal}>
            <IconPlus />
            إضافة طالب
          </button>
          <button type="button" className="dash-btn dash-btn--outline" onClick={openEnrollModal}>
            إضافة طالب لدورة
          </button>
          {filterCourseId && (
            <Link to="/admin/subscribers" className="dash-btn dash-btn--outline">
              عرض كل الطلاب
            </Link>
          )}
        </div>
      </div>

      {filterCourseId && filteredCourse && (
        <div className="admin-alert success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            عرض الطلاب المسجلين في كورس: <strong>{filteredCourse.title_ar} {filteredCourse.title_en ? `(${filteredCourse.title_en})` : ''}</strong>
          </span>
          <Link to="/admin/subscribers" style={{ color: 'var(--dash-navy)', fontWeight: 'bold', textDecoration: 'none' }}>
            إلغاء الفلترة ✕
          </Link>
        </div>
      )}

      {error && !addOpen && !enrollOpen && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      <div className="dash-panel dash-panel--table">
        <div className="dash-panel__head">
          <h2>{filterCourseId && filteredCourse ? `الطلاب — ${filteredCourse.title_ar}` : 'الطلاب'}</h2>
          <span>{rows.length} طالب</span>
        </div>

        <AdminDataTable
          loading={loading}
          rows={rows}
          emptyText="لا يوجد طلاب بعد"
          columns={[
            { key: 'name', label: 'الاسم' },
            { key: 'email', label: 'البريد' },
            { key: 'grade_name', label: 'الصف', render: (r) => r.grade_name || '—' },
            { key: 'courses_count', label: 'الدورات' },
            { key: 'phone', label: 'الموبايل', render: (r) => r.phone || '—' },
            {
              key: 'status',
              label: 'الحالة',
              render: () => <DashBadge active />,
            },
          ]}
        />
      </div>

      <AdminModal
        open={addOpen}
        title="إضافة طالب جديد"
        onClose={() => {
          setAddOpen(false);
          resetAddModal();
        }}
      >
        <form className="admin-form admin-form--modal" onSubmit={handleCreateStudent}>
          {error && addOpen && <div className="admin-alert error">{error}</div>}

          <div className="admin-form-grid">
            <label>
              اسم الطالب *
              <input
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                required
              />
            </label>
            <label>
              البريد الإلكتروني *
              <input
                type="email"
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              رقم الموبايل
              <input
                value={studentForm.phone}
                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
              />
            </label>
            <label>
              رقم ولي الأمر *
              <input
                value={studentForm.parent_phone}
                onChange={(e) => setStudentForm({ ...studentForm, parent_phone: e.target.value })}
                placeholder="01xxxxxxxxx"
                required
              />
            </label>
            <label>
              كلمة المرور *
              <input
                type="password"
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                minLength={6}
                required
              />
            </label>
            <StageGradeSelect
              grades={grades}
              stage={studentStage}
              gradeId={studentForm.grade_id}
              onStageChange={setStudentStage}
              onGradeIdChange={(value) => setStudentForm({ ...studentForm, grade_id: value })}
              required
            />
            <label className="admin-form-full">
              دورة إضافية (اختياري)
              <select
                value={studentForm.course_id}
                onChange={(e) => setStudentForm({ ...studentForm, course_id: e.target.value })}
              >
                <option value="">بدون — تسجيل تلقائي في دورات الصف</option>
                {courses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.title_ar}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="dash-btn dash-btn--primary" disabled={savingStudent}>
              {savingStudent ? 'جاري الحفظ...' : 'حفظ الطالب'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={enrollOpen}
        title="إضافة طالب لدورة"
        onClose={() => {
          setEnrollOpen(false);
          resetEnrollModal();
        }}
      >
        <form className="admin-form admin-form--modal" onSubmit={handleEnroll}>
          {error && enrollOpen && <div className="admin-alert error">{error}</div>}

          <label>
            بريد الطالب
            <div className="dash-inline-search">
              <input
                type="email"
                value={enrollEmail}
                onChange={(e) => {
                  setEnrollEmail(e.target.value);
                  setFoundStudent(null);
                }}
                placeholder="student@example.com"
                required
              />
              <button
                type="button"
                className="dash-btn dash-btn--outline dash-btn--sm"
                onClick={handleSearchStudent}
                disabled={searching || !enrollEmail.trim()}
              >
                {searching ? 'جاري البحث...' : 'بحث'}
              </button>
            </div>
          </label>

          {foundStudent && (
            <div className="dash-found-student">
              <strong>{foundStudent.name}</strong>
              <span>{foundStudent.email}</span>
              {foundStudent.grade_name && <span>الصف: {foundStudent.grade_name}</span>}
            </div>
          )}

          <label>
            الدورة
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">اختر الدورة</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.title_ar}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="dash-btn dash-btn--primary" disabled={enrolling}>
              {enrolling ? 'جاري التسجيل...' : 'تسجيل في الدورة'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
