import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminResource } from '../../api/adminApi';
import { uploadAdminFile } from '../../api/uploadApi';
import AdminDataTable from '../../admin/AdminDataTable';
import AdminModal from '../../admin/AdminModal';
import QuestionsEditor, { emptyQuestion } from '../../admin/QuestionsEditor';
import StageGradeSelect from '../../admin/StageGradeSelect';
import { getStageFromGradeId } from '../../admin/gradeHelpers';
import { IconPlus } from '../../admin/DashboardIcons';

const examsApi = adminResource('exams');
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
  questions_count: 10,
  duration_minutes: 60,
  is_active: true,
};

export default function AdminExams() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [grades, setGrades] = useState([]);
  const [stage, setStage] = useState('');
  const [courseOptions, setCourseOptions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState([]);
  const [questionFiles, setQuestionFiles] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await examsApi.list();
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
    setQuestionFiles({});
    setEditingId(null);
    setStage('');
  };

  const openCreate = () => {
    resetForm();
    setQuestions([emptyQuestion()]);
    setModalOpen(true);
  };

  const onEdit = async (row) => {
    setError('');
    try {
      const res = await examsApi.get(row.id);
      const data = res.data;
      setForm({
        grade_id: data.grade_id ? String(data.grade_id) : '',
        course_id: data.course_id ? String(data.course_id) : '',
        title_ar: data.title_ar || '',
        description_ar: data.description_ar || '',
        questions_count: data.questions_count || 10,
        duration_minutes: data.duration_minutes || 60,
        is_active: Boolean(data.is_active),
      });
      setStage(getStageFromGradeId(grades, data.grade_id));
      setQuestions((data.questions || []).length
        ? data.questions.map(normalizeLoadedQuestion)
        : [emptyQuestion()]);
      setQuestionFiles({});
      setEditingId(row.id);
      setModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const openResults = (row) => {
    navigate(`/admin/exams/${row.id}/results`);
  };

  const onQuestionFile = (scope, index, kind, file) => {
    setQuestionFiles((prev) => ({ ...prev, [`q${index}_${kind}`]: file }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        grade_id: form.grade_id ? Number(form.grade_id) : null,
        course_id: form.course_id ? Number(form.course_id) : null,
        questions_count: Number(form.questions_count || 0),
        duration_minutes: Number(form.duration_minutes || 60),
        is_active: Boolean(form.is_active),
        questions: [...questions],
        file_url: null,
      };

      payload.image_url = null;

      for (let i = 0; i < payload.questions.length; i += 1) {
        const imgFile = questionFiles[`q${i}_image`];
        const pdfFile = questionFiles[`q${i}_pdf`];
        if (imgFile) payload.questions[i].image_url = await uploadAdminFile(imgFile, 'image');
        if (pdfFile) payload.questions[i].pdf_url = await uploadAdminFile(pdfFile, 'pdf');
      }

      if (!payload.questions.some((q) => String(q.question_text || '').trim())) {
        throw new Error('أضف سؤال واحد على الأقل');
      }

      if (editingId) await examsApi.update(editingId, payload);
      else await examsApi.create(payload);

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
      await examsApi.remove(id);
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
          إضافة اختبار
        </button>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      <div className="dash-panel dash-panel--table">
        <div className="dash-panel__head">
          <h2>الاختبارات</h2>
          <span>{rows.length} عنصر</span>
        </div>
        <AdminDataTable
          columns={[
            { key: 'id', label: '#' },
            { key: 'title_ar', label: 'العنوان' },
            { key: 'grade_name', label: 'الصف', render: (r) => r.grade_name || '—' },
            { key: 'course_title', label: 'الكورس', render: (r) => r.course_title || '—' },
            { key: 'questions_count', label: 'الأسئلة' },
            { key: 'duration_minutes', label: 'المدة' },
            {
              key: 'submissions_count',
              label: 'نتائج',
              render: (r) => r.submissions_count || 0,
            },
            { key: 'is_active', label: 'الحالة', render: (r) => (r.is_active ? 'مفعل' : 'متوقف') },
          ]}
          rows={rows}
          loading={loading}
          actions={(row) => (
            <>
              <button type="button" className="dash-btn dash-btn--outline dash-btn--sm" onClick={() => openResults(row)}>
                النتائج
              </button>
              <button type="button" className="dash-btn dash-btn--outline dash-btn--sm" onClick={() => onEdit(row)}>تعديل</button>
              <button type="button" className="dash-btn dash-btn--outline dash-btn--sm dash-btn--danger" onClick={() => onDelete(row.id)}>حذف</button>
            </>
          )}
        />
      </div>

      <AdminModal
        open={modalOpen}
        wide
        title={editingId ? 'تعديل اختبار' : 'إضافة اختبار'}
        onClose={() => { setModalOpen(false); resetForm(); }}
        footer={(
          <button type="submit" form="exam-form" className="dash-btn dash-btn--primary" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        )}
      >
        <form id="exam-form" className="admin-form admin-form--modal" onSubmit={onSubmit}>
          <div className="admin-form-grid">
            <StageGradeSelect
              grades={grades}
              stage={stage}
              gradeId={form.grade_id}
              onStageChange={setStage}
              onGradeIdChange={(value) => setForm({ ...form, grade_id: value })}
            />
            <label>
              الكورس (اختياري)
              <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">بدون كورس محدد</option>
                {courseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="admin-form-full">
              عنوان الاختبار
              <input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} required />
            </label>
            <label className="admin-form-full">
              الوصف
              <textarea rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
            </label>
            <label>
              المدة (دقيقة)
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </label>
            <label>
              <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              {' '}مفعل
            </label>
            <div className="dash-form-section admin-form-full">
              <h3>أسئلة الاختبار</h3>
              <p className="dash-questions-editor__hint">
                الاختبارات أسئلة فقط داخل المنصة — بدون ملف PDF.
              </p>
            </div>
            <QuestionsEditor questions={questions} onChange={setQuestions} fileState={questionFiles} onFileChange={onQuestionFile} />
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
