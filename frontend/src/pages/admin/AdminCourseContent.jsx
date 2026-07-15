import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminFetch } from '../../api/adminApi';
import { uploadAdminFile } from '../../api/uploadApi';
import AdminModal from '../../admin/AdminModal';
import FileUploadField from '../../admin/FileUploadField';
import QuestionsEditor, { emptyQuestion } from '../../admin/QuestionsEditor';

const LESSON_TYPES = [
  { type: 'video', label: 'درس فيديو', color: 'video' },
  { type: 'text', label: 'درس نصي', color: 'text' },
  { type: 'pdf', label: 'ملف PDF', color: 'pdf' },
  { type: 'assignment', label: 'واجب', color: 'assignment' },
  { type: 'quiz', label: 'اختبار', color: 'quiz' },
];

const TYPE_LABELS = {
  ...Object.fromEntries(LESSON_TYPES.map((t) => [t.type, t.label])),
  record: 'ريكورد',
};

function emptyLessonForm() {
  return {
    title: '',
    content_text: '',
    content_url: '',
    due_date: '',
    duration_minutes: 30,
    quizSource: 'new',
    existing_exam_id: '',
    questions: [emptyQuestion()],
    useUpload: true,
  };
}

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/${url}`;
}

export default function AdminCourseContent() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('سيتم الحفظ تلقائياً...');
  const [saving, setSaving] = useState(false);

  const [sectionModal, setSectionModal] = useState(null);
  const [lessonModal, setLessonModal] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [lessonFile, setLessonFile] = useState(null);
  const [questionFiles, setQuestionFiles] = useState({});

  const flashSaved = () => {
    setStatusText('تم الحفظ');
    setTimeout(() => setStatusText('سيتم الحفظ تلقائياً...'), 1800);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [contentRes, examsRes] = await Promise.all([
        adminFetch(`/course-content/${courseId}/content`),
        adminFetch('/exams').catch(() => ({ data: [] })),
      ]);
      setCourse(contentRes.data.course);
      setSections(contentRes.data.sections || []);
      setExams(examsRes.data || []);
    } catch (err) {
      setError(err.message || 'فشل تحميل المحتوى');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const courseExams = useMemo(
    () => exams.filter((e) => !e.course_id || String(e.course_id) === String(courseId)),
    [exams, courseId],
  );

  const addSection = async () => {
    setSaving(true);
    setError('');
    try {
      await adminFetch(`/course-content/${courseId}/sections`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      flashSaved();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    await load();
    flashSaved();
  };

  const openRenameSection = (section) => {
    setSectionModal({ id: section.id, title: section.title_ar || section.title || '' });
  };

  const submitRenameSection = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminFetch(`/course-content/sections/${sectionModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title_ar: sectionModal.title }),
      });
      setSectionModal(null);
      flashSaved();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (section) => {
    if (!window.confirm('حذف القسم وجميع دروسه؟')) return;
    setSaving(true);
    setError('');
    try {
      await adminFetch(`/course-content/sections/${section.id}`, { method: 'DELETE' });
      flashSaved();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddLesson = (sectionId, type) => {
    setLessonModal({ mode: 'create', sectionId, type, lessonId: null });
    setLessonForm(emptyLessonForm());
    setLessonFile(null);
    setQuestionFiles({});
  };

  const onQuestionFileChange = (scope, index, kind, file) => {
    if (scope !== 'questions') return;
    const key = `q${index}_${kind === 'pdf' ? 'pdf' : 'image'}`;
    setQuestionFiles((prev) => ({ ...prev, [key]: file }));
  };

  const openEditLesson = (lesson) => {
    setLessonModal({
      mode: 'edit',
      sectionId: lesson.section_id,
      type: lesson.lesson_type,
      lessonId: lesson.id,
    });
    setLessonForm({
      ...emptyLessonForm(),
      title: lesson.title_ar || '',
      content_text: lesson.content_text || '',
      content_url: lesson.content_url || '',
      useUpload: false,
    });
    setLessonFile(null);
  };

  const deleteLesson = async (lesson) => {
    if (!window.confirm('حذف هذا الدرس؟')) return;
    setSaving(true);
    setError('');
    try {
      await adminFetch(`/course-content/lessons/${lesson.id}`, { method: 'DELETE' });
      flashSaved();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitLesson = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let contentUrl = lessonForm.content_url.trim();
      const type = lessonModal.type;

      if (lessonFile && ['video', 'record', 'pdf', 'assignment'].includes(type)) {
        const kind = type === 'pdf' || (type === 'assignment' && lessonFile.type === 'application/pdf')
          ? 'pdf'
          : type === 'record'
            ? 'audio'
            : type === 'assignment' && lessonFile.type?.startsWith('image/')
              ? 'image'
              : 'video';
        contentUrl = await uploadAdminFile(lessonFile, kind);
      }

      if (lessonModal.mode === 'edit') {
        await adminFetch(`/course-content/lessons/${lessonModal.lessonId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title_ar: lessonForm.title.trim(),
            content_text: lessonForm.content_text,
            content_url: contentUrl,
          }),
        });
      } else {
        const payload = {
          section_id: lessonModal.sectionId,
          lesson_type: type,
          title: lessonForm.title.trim(),
          content_text: lessonForm.content_text,
          content_url: contentUrl,
          due_date: lessonForm.due_date || null,
          duration_minutes: Number(lessonForm.duration_minutes) || 30,
          quizSource: lessonForm.quizSource,
          existing_exam_id: lessonForm.existing_exam_id || null,
          questions: (
            await Promise.all(
              lessonForm.questions.map(async (q, index) => {
                if (!q.question_text.trim()) return null;
                let image_url = q.image_url || '';
                let pdf_url = q.pdf_url || '';
                const imgFile = questionFiles[`q${index}_image`];
                const pdfFile = questionFiles[`q${index}_pdf`];
                if (imgFile) image_url = await uploadAdminFile(imgFile, 'image');
                if (pdfFile) pdf_url = await uploadAdminFile(pdfFile, 'pdf');
                return {
                  question_text: q.question_text,
                  question_type: q.question_type || 'text',
                  options: (q.options || []).filter((o) => String(o).trim()),
                  correct_answer: q.correct_answer,
                  image_url,
                  pdf_url,
                };
              }),
            )
          ).filter(Boolean),
        };
        await adminFetch(`/course-content/${courseId}/lessons`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setLessonModal(null);
      flashSaved();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const modalTypeMeta = LESSON_TYPES.find((t) => t.type === lessonModal?.type);

  return (
    <div className="dash-page course-content">
      <div className="course-content__toolbar">
        <div className="course-content__toolbar-start">
          <Link to="/admin/courses" className="dash-btn dash-btn--outline">
            ← رجوع للكورسات
          </Link>
          <div>
            <h1 className="course-content__title">
              محتوى الدورة: {course?.title_ar || `#${courseId}`}
            </h1>
            <p className="course-content__status">{statusText}</p>
          </div>
        </div>
        <div className="course-content__toolbar-actions">
          <button type="button" className="dash-btn dash-btn--outline" onClick={addSection} disabled={saving}>
            + قسم جديد
          </button>
          <button type="button" className="dash-btn dash-btn--primary" onClick={saveAll} disabled={loading}>
            حفظ الكل
          </button>
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}
      {loading ? (
        <div className="dash-panel">جاري التحميل...</div>
      ) : (
        <div className="course-content__sections">
          {sections.map((section) => (
            <article key={section.id} className="course-section-card">
              <header className="course-section-card__head">
                <div className="course-section-card__title-wrap">
                  <span className="course-section-card__handle" aria-hidden="true">⋮⋮</span>
                  <h2>{section.title_ar || section.title}</h2>
                </div>
                <div className="course-section-card__actions">
                  <button type="button" className="dash-btn dash-btn--outline dash-btn--sm" onClick={() => openRenameSection(section)}>
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="dash-btn dash-btn--danger-filled dash-btn--sm"
                    onClick={() => deleteSection(section)}
                  >
                    حذف
                  </button>
                </div>
              </header>

              <div className="course-section-card__pills" role="group" aria-label="أنواع المحتوى">
                {LESSON_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={`course-type-pill course-type-pill--${item.color}`}
                    onClick={() => openAddLesson(section.id, item.type)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="course-section-card__lessons">
                {(section.lessons || []).length === 0 ? (
                  <p className="course-section-card__empty">لا توجد دروس في هذا القسم — اختار نوع من فوق.</p>
                ) : (
                  (section.lessons || []).map((lesson) => (
                    <div key={lesson.id} className="course-lesson-row">
                      <div className="course-lesson-row__info">
                        <span className={`course-lesson-row__badge course-type-pill--${lesson.lesson_type}`}>
                          {TYPE_LABELS[lesson.lesson_type] || lesson.lesson_type}
                        </span>
                        <strong>{lesson.title_ar}</strong>
                      </div>
                      <div className="course-lesson-row__actions">
                        {lesson.content_url && (
                          <a
                            href={resolveMediaUrl(lesson.content_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="dash-btn dash-btn--outline dash-btn--sm"
                          >
                            فتح
                          </a>
                        )}
                        <button
                          type="button"
                          className="dash-btn dash-btn--outline dash-btn--sm"
                          onClick={() => openEditLesson(lesson)}
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          className="dash-btn dash-btn--danger-filled dash-btn--sm"
                          onClick={() => deleteLesson(lesson)}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}

          <button type="button" className="course-content__add-section" onClick={addSection} disabled={saving}>
            + إضافة قسم جديد
          </button>
        </div>
      )}

      <AdminModal
        open={Boolean(sectionModal)}
        title="تعديل اسم القسم"
        onClose={() => setSectionModal(null)}
      >
        {sectionModal && (
          <form className="admin-form admin-form--modal" onSubmit={submitRenameSection}>
            <label className="admin-form-full">
              عنوان القسم
              <input
                value={sectionModal.title}
                onChange={(e) => setSectionModal((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </label>
            <div className="admin-form-actions">
              <button type="submit" className="dash-btn dash-btn--primary" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(lessonModal)}
        title={
          lessonModal?.mode === 'edit'
            ? `تعديل: ${TYPE_LABELS[lessonModal.type] || ''}`
            : `إضافة: ${modalTypeMeta?.label || ''}`
        }
        onClose={() => setLessonModal(null)}
        wide={lessonModal?.type === 'quiz'}
      >
        {lessonModal && (
          <form className="admin-form admin-form--modal" onSubmit={submitLesson}>
            <div className="admin-form-grid">
              <label className="admin-form-full">
                العنوان
                <input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </label>

              {lessonModal.type === 'text' && (
                <label className="admin-form-full">
                  نص الدرس
                  <textarea
                    rows={5}
                    value={lessonForm.content_text}
                    onChange={(e) => setLessonForm((p) => ({ ...p, content_text: e.target.value }))}
                    required={lessonModal.mode === 'create'}
                  />
                </label>
              )}

              {['video', 'record', 'pdf'].includes(lessonModal.type) && (
                <>
                  <label className="admin-form-full">
                    طريقة الإضافة
                    <select
                      value={lessonForm.useUpload ? 'upload' : 'link'}
                      onChange={(e) => setLessonForm((p) => ({ ...p, useUpload: e.target.value === 'upload' }))}
                    >
                      <option value="upload">رفع ملف</option>
                      <option value="link">لينك خارجي</option>
                    </select>
                  </label>
                  {lessonForm.useUpload ? (
                    <FileUploadField
                      label={lessonModal.type === 'pdf' ? 'ملف PDF' : lessonModal.type === 'record' ? 'ملف ريكورد' : 'فيديو'}
                      accept={
                        lessonModal.type === 'pdf'
                          ? 'application/pdf,.pdf'
                          : lessonModal.type === 'record'
                            ? 'video/*,audio/*'
                            : 'video/*'
                      }
                      uploadKind={lessonModal.type === 'pdf' ? 'pdf' : lessonModal.type === 'record' ? 'audio' : 'video'}
                      value={lessonForm.content_url}
                      file={lessonFile}
                      onFileChange={setLessonFile}
                      required={lessonModal.mode === 'create' && !lessonForm.content_url}
                    />
                  ) : (
                    <label className="admin-form-full">
                      اللينك
                      <input
                        type="url"
                        value={lessonForm.content_url}
                        onChange={(e) => setLessonForm((p) => ({ ...p, content_url: e.target.value }))}
                        placeholder="https://..."
                        required={lessonModal.mode === 'create'}
                      />
                    </label>
                  )}
                </>
              )}

              {lessonModal.type === 'assignment' && lessonModal.mode === 'create' && (
                <>
                  <label className="admin-form-full">
                    وصف الواجب
                    <textarea
                      rows={4}
                      value={lessonForm.content_text}
                      onChange={(e) => setLessonForm((p) => ({ ...p, content_text: e.target.value }))}
                    />
                  </label>
                  <label>
                    موعد التسليم
                    <input
                      type="date"
                      value={lessonForm.due_date}
                      onChange={(e) => setLessonForm((p) => ({ ...p, due_date: e.target.value }))}
                    />
                  </label>
                  <FileUploadField
                    label="مرفق (اختياري)"
                    accept="application/pdf,.pdf,image/*"
                    uploadKind="pdf"
                    value={lessonForm.content_url}
                    file={lessonFile}
                    onFileChange={setLessonFile}
                  />
                </>
              )}

              {lessonModal.type === 'quiz' && lessonModal.mode === 'create' && (
                <>
                  <label className="admin-form-full">
                    مصدر الاختبار
                    <select
                      value={lessonForm.quizSource}
                      onChange={(e) => setLessonForm((p) => ({ ...p, quizSource: e.target.value }))}
                    >
                      <option value="new">إنشاء اختبار جديد</option>
                      <option value="existing">ربط باختبار موجود</option>
                    </select>
                  </label>

                  {lessonForm.quizSource === 'existing' ? (
                    <label className="admin-form-full">
                      اختار اختبار
                      <select
                        value={lessonForm.existing_exam_id}
                        onChange={(e) => setLessonForm((p) => ({ ...p, existing_exam_id: e.target.value }))}
                        required
                      >
                        <option value="">—</option>
                        {courseExams.map((exam) => (
                          <option key={exam.id} value={exam.id}>
                            {exam.title_ar}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <>
                      <label>
                        مدة الاختبار (دقيقة)
                        <input
                          type="number"
                          min={1}
                          value={lessonForm.duration_minutes}
                          onChange={(e) => setLessonForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                        />
                      </label>
                      <QuestionsEditor
                        questions={lessonForm.questions}
                        onChange={(questions) => setLessonForm((p) => ({ ...p, questions }))}
                        fileState={questionFiles}
                        onFileChange={onQuestionFileChange}
                      />
                    </>
                  )}
                </>
              )}

              {lessonModal.mode === 'edit' && lessonModal.type === 'quiz' && (
                <p className="admin-form-full" style={{ color: '#64748b' }}>
                  لتعديل أسئلة الاختبار استخدم صفحة الاختبارات في لوحة التحكم.
                </p>
              )}

              {lessonModal.mode === 'edit' && lessonModal.type === 'assignment' && (
                <label className="admin-form-full">
                  الوصف
                  <textarea
                    rows={4}
                    value={lessonForm.content_text}
                    onChange={(e) => setLessonForm((p) => ({ ...p, content_text: e.target.value }))}
                  />
                </label>
              )}
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="dash-btn dash-btn--primary" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </form>
        )}
      </AdminModal>
    </div>
  );
}
