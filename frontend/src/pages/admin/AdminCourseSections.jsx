import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminResource } from '../../api/adminApi';
import { uploadAdminFile } from '../../api/uploadApi';
import AdminModal from '../../admin/AdminModal';
import FileUploadField from '../../admin/FileUploadField';
import AdminDataTable from '../../admin/AdminDataTable';

const coursesApi = adminResource('courses');

const emptySection = {
  title_ar: '',
  description_ar: '',
  image_url: '',
  pdf_url: '',
  link_url: '',
  video_url: '',
  sort_order: 0,
};

export default function AdminCourseSections() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptySection);
  const [files, setFiles] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const courseRes = await coursesApi.list().then((r) =>
        (r.data || []).find((c) => String(c.id) === String(courseId)),
      );
      const sectionsRes = await fetch(`/api/admin/courses/${courseId}/sections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (!sectionsRes.ok) {
        const errData = await sectionsRes.json().catch(() => ({}));
        throw new Error(errData.message || 'فشل تحميل أجزاء الكورس');
      }
      const sectionsData = await sectionsRes.json();
      setCourse(courseRes || null);
      setRows(sectionsData.data || []);
    } catch (err) {
      setError(err.message || 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]);

  const openCreate = () => {
    setForm(emptySection);
    setFiles({});
    setEditingId(null);
    setModalOpen(true);
  };

  const onEdit = (row) => {
    setForm({ ...emptySection, ...row });
    setFiles({});
    setEditingId(row.id);
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, sort_order: Number(form.sort_order || 0) };
      for (const key of ['image_url', 'pdf_url', 'video_url']) {
        if (files[key]) payload[key] = await uploadAdminFile(files[key], key === 'image_url' ? 'image' : key === 'video_url' ? 'video' : 'pdf');
      }
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/admin/courses/${courseId}/sections/${editingId}`
        : `/api/admin/courses/${courseId}/sections`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الحفظ');
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('حذف هذا الجزء من الكورس؟')) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الحذف');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-toolbar">
        <Link to="/admin/courses" className="dash-btn dash-btn--outline">← رجوع للكورسات</Link>
        <button type="button" className="dash-btn dash-btn--primary" onClick={openCreate}>إضافة جزء</button>
      </div>

      <div className="dash-panel">
        <div className="dash-panel__head">
          <h2>أجزاء الكورس: {course?.title_ar || `#${courseId}`}</h2>
          <span>{rows.length} جزء</span>
        </div>
        {error && <div className="admin-alert error">{error}</div>}
        <AdminDataTable
          columns={[
            { key: 'id', label: '#' },
            { key: 'title_ar', label: 'العنوان' },
            { key: 'sort_order', label: 'الترتيب' },
            {
              key: 'link_url',
              label: 'لينك',
              render: (r) => (r.link_url ? <a href={r.link_url} target="_blank" rel="noreferrer">فتح</a> : '—'),
            },
          ]}
          rows={rows}
          loading={loading}
          actions={(row) => (
            <>
              <button type="button" className="dash-btn dash-btn--outline dash-btn--sm" onClick={() => onEdit(row)}>تعديل</button>
              <button type="button" className="dash-btn dash-btn--outline dash-btn--sm dash-btn--danger" onClick={() => onDelete(row.id)}>حذف</button>
            </>
          )}
        />
      </div>

      <AdminModal open={modalOpen} title={editingId ? 'تعديل جزء' : 'إضافة جزء'} onClose={() => setModalOpen(false)}>
        <form className="admin-form admin-form--modal" onSubmit={onSubmit}>
          <div className="admin-form-grid">
            <label className="admin-form-full">
              عنوان الجزء
              <input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} required />
            </label>
            <label className="admin-form-full">
              الوصف
              <textarea rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
            </label>
            <label>
              الترتيب
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </label>
            <label className="admin-form-full">
              لينك خارجي
              <input type="url" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </label>
            <FileUploadField label="صورة الجزء" accept="image/*" uploadKind="image" value={form.image_url} file={files.image_url} onFileChange={(f) => setFiles((p) => ({ ...p, image_url: f }))} />
            <FileUploadField label="ملف PDF" accept="application/pdf,.pdf" uploadKind="pdf" value={form.pdf_url} file={files.pdf_url} onFileChange={(f) => setFiles((p) => ({ ...p, pdf_url: f }))} />
            <FileUploadField label="فيديو الجزء" accept="video/*" uploadKind="video" value={form.video_url} file={files.video_url} onFileChange={(f) => setFiles((p) => ({ ...p, video_url: f }))} />
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="dash-btn dash-btn--primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
