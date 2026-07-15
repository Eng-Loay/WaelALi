import { useEffect, useState } from 'react';
import { adminResource } from '../../api/adminApi';
import { fileLinkLabel, uploadAdminFile } from '../../api/uploadApi';
import AdminDataTable from '../../admin/AdminDataTable';
import AdminModal from '../../admin/AdminModal';
import FileUploadField from '../../admin/FileUploadField';
import QuestionsEditor, { emptyQuestion } from '../../admin/QuestionsEditor';
import StageGradeSelect from '../../admin/StageGradeSelect';
import { getStageFromGradeId } from '../../admin/gradeHelpers';
import { IconPlus } from '../../admin/DashboardIcons';

const assignmentsApi = adminResource('assignments');
const coursesApi = adminResource('courses');
const gradesApi = adminResource('grades');

function normalizeLoadedQuestion(q) {
  const type = q.question_type || 'text';
  return {
    question_text: q.question_text || '',
    question_type: type,
    image_url: q.image_url || '',
    pdf_url: q.pdf_url || '',
    options: type === 'multiple_choice'
      ? (Array.isArray(q.options) && q.options.length ? q.options : ['', '', ''])
      : [],
    correct_answer: q.correct_answer || '',
  };
}

const emptyForm = {
  grade_id: '',
  course_id: '',
  title_ar: '',
  description_ar: '',
  image_url: '',
  file_url: '',
  due_date: '',
  status: 'published',
  delivery_mode: 'pdf',
};

export default function AdminAssignments() {
  const [rows, setRows] = useState([]);
  const [grades, setGrades] = useState([]);
  const [stage, setStage] = useState('');
  const [courseOptions, setCourseOptions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState([]);
  const [files, setFiles] = useState({});
  const [questionFiles, setQuestionFiles] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await assignmentsApi.list();
      setRows(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([coursesApi.list(), gradesApi.list()])
      .then(([coursesRes, gradesRes]) => {
        setCourseOptions((coursesRes.data || []).map((c) => ({ value: String(c.id), label: c.title_ar })));
        setGrades(gradesRes.data || []);
      })
      .catch(console.error);
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setQuestions([]);
    setFiles({});
    setQuestionFiles({});
    setEditingId(null);
    setStage('');
  };

  const openCreate = () => {
    resetForm();
    setStage('');
    setForm({ ...emptyForm, delivery_mode: 'pdf' });
    setModalOpen(true);
  };

  const onEdit = async (row) => {
    setError('');
    try {
      const res = await assignmentsApi.get(row.id);
      const data = res.data;
      const mode = data.delivery_mode === 'pdf' || data.delivery_mode === 'manual'
        ? data.delivery_mode
        : (data.file_url ? 'pdf' : 'manual');
      setForm({
        grade_id: data.grade_id ? String(data.grade_id) : '',
        course_id: data.course_id ? String(data.course_id) : '',
        title_ar: data.title_ar || '',
        description_ar: data.description_ar || '',
        image_url: data.image_url || '',
        file_url: data.file_url || '',
        due_date: data.due_date ? String(data.due_date).slice(0, 10) : '',
        status: data.status || 'published',
        delivery_mode: mode,
      });
      setStage(getStageFromGradeId(grades, data.grade_id));
      setQuestions(
        mode === 'manual' && (data.questions || []).length
          ? data.questions.map(normalizeLoadedQuestion)
          : mode === 'manual'
            ? [emptyQuestion()]
            : [],
      );
      setFiles({});
      setQuestionFiles({});
      setEditingId(row.id);
      setModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const setDeliveryMode = (mode) => {
    setForm((prev) => ({
      ...prev,
      delivery_mode: mode,
      file_url: mode === 'pdf' ? prev.file_url : '',
    }));
    if (mode === 'manual') {
      setQuestions((prev) => (prev.length ? prev : [emptyQuestion()]));
      setFiles((prev) => ({ ...prev, file_url: null }));
    } else {
      setQuestions([]);
      setQuestionFiles({});
    }
  };

  const onQuestionFile = (scope, index, kind, file) => {
    setQuestionFiles((prev) => ({ ...prev, [`q${index}_${kind}`]: file }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const mode = form.delivery_mode === 'pdf' ? 'pdf' : 'manual';
      const payload = {
        ...form,
        delivery_mode: mode,
        grade_id: form.grade_id ? Number(form.grade_id) : null,
        course_id: form.course_id ? Number(form.course_id) : null,
        questions: mode === 'manual' ? [...questions] : [],
        file_url: mode === 'pdf' ? form.file_url : '',
      };

      if (files.image_url) payload.image_url = await uploadAdminFile(files.image_url, 'image');

      if (mode === 'pdf') {
        if (files.file_url) payload.file_url = await uploadAdminFile(files.file_url, 'pdf');
        if (!String(payload.file_url || '').trim()) {
          throw new Error('ارفع ملف PDF للواجب');
        }
      } else {
        payload.file_url = '';
        for (let i = 0; i < payload.questions.length; i += 1) {
          const imgFile = questionFiles[`q${i}_image`];
          const pdfFile = questionFiles[`q${i}_pdf`];
          if (imgFile) payload.questions[i].image_url = await uploadAdminFile(imgFile, 'image');
          if (pdfFile) payload.questions[i].pdf_url = await uploadAdminFile(pdfFile, 'pdf');
        }
        if (!payload.questions.some((q) => String(q.question_text || '').trim())) {
          throw new Error('أضف سؤال واحد على الأقل');
        }
      }

      if (editingId) await assignmentsApi.update(editingId, payload);
      else await assignmentsApi.create(payload);

      setModalOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await assignmentsApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-toolbar">
        <button type="button" className="dash-btn dash-btn--primary" onClick={openCreate}>
          <IconPlus />
          إضافة واجب
        </button>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      <div className="dash-panel dash-panel--table">
        <div className="dash-panel__head">
          <h2>الواجبات</h2>
          <span>{rows.length} عنصر</span>
        </div>
        <AdminDataTable
          columns={[
            { key: 'id', label: '#' },
            { key: 'title_ar', label: 'العنوان' },
            { key: 'grade_name', label: 'الصف', render: (r) => r.grade_name || '—' },
            { key: 'course_title', label: 'الكورس', render: (r) => r.course_title || '—' },
            {
              key: 'delivery_mode',
              label: 'نوع التسليم',
              render: (r) => (r.delivery_mode === 'pdf' || r.file_url ? 'PDF' : 'يدوي'),
            },
            {
              key: 'questions_count',
              label: 'أسئلة',
              render: (r) => (r.delivery_mode === 'pdf' ? '—' : (r.questions_count || 0)),
            },
            {
              key: 'file_url',
              label: 'PDF',
              render: (r) => (r.delivery_mode === 'pdf' && r.file_url ? fileLinkLabel(r.file_url) : '—'),
            },
            { key: 'due_date', label: 'التسليم', render: (r) => r.due_date || '—' },
            { key: 'status', label: 'الحالة' },
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

      <AdminModal open={modalOpen} wide title={editingId ? 'تعديل واجب' : 'إضافة واجب'} onClose={() => { setModalOpen(false); resetForm(); }}>
        <form className="admin-form admin-form--modal" onSubmit={onSubmit}>
          <div className="admin-form-grid">
            <div className="dash-form-section">
              <h3>بيانات الواجب</h3>
            </div>
            <StageGradeSelect
              grades={grades}
              stage={stage}
              gradeId={form.grade_id}
              onStageChange={setStage}
              onGradeIdChange={(value) => setForm({ ...form, grade_id: value })}
              required
            />
            <label>
              الكورس (اختياري)
              <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">بدون كورس محدد</option>
                {courseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="admin-form-full">
              عنوان الواجب *
              <input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} required />
            </label>
            <label className="admin-form-full">
              التفاصيل
              <textarea rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
            </label>
            <label>
              تاريخ التسليم
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </label>
            <label>
              الحالة
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
                <option value="closed">مغلق</option>
              </select>
            </label>

            <FileUploadField
              label="صورة الواجب (اختياري)"
              accept="image/*"
              uploadKind="image"
              value={form.image_url}
              file={files.image_url}
              onFileChange={(f) => setFiles((p) => ({ ...p, image_url: f }))}
            />

            <div className="dash-form-section admin-form-full">
              <h3>طريقة الواجب</h3>
              <p className="dash-questions-editor__hint">
                اختار طريقة واحدة واحدة: إما رفع PDF للطالب يرد عليه بـ PDF، أو أسئلة يدوية يجيب عليها داخل المنصة.
              </p>
              <div className="assignment-mode-toggle" role="group" aria-label="طريقة الواجب">
                <button
                  type="button"
                  className={`assignment-mode-toggle__btn${form.delivery_mode === 'pdf' ? ' is-active' : ''}`}
                  onClick={() => setDeliveryMode('pdf')}
                >
                  رفع PDF
                </button>
                <button
                  type="button"
                  className={`assignment-mode-toggle__btn${form.delivery_mode === 'manual' ? ' is-active' : ''}`}
                  onClick={() => setDeliveryMode('manual')}
                >
                  أسئلة يدوية
                </button>
              </div>
            </div>

            {form.delivery_mode === 'pdf' ? (
              <FileUploadField
                label="ملف الواجب (PDF)"
                accept="application/pdf,.pdf"
                uploadKind="pdf"
                value={form.file_url}
                file={files.file_url}
                onFileChange={(f) => setFiles((p) => ({ ...p, file_url: f }))}
                required={!form.file_url}
              />
            ) : (
              <QuestionsEditor
                questions={questions}
                onChange={setQuestions}
                fileState={questionFiles}
                onFileChange={onQuestionFile}
              />
            )}
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="dash-btn dash-btn--primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
