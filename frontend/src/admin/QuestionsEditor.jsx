import FileUploadField from './FileUploadField';
import { IconPlus } from './DashboardIcons';

const QUESTION_TYPES = [
  { value: 'text', label: 'سؤال نصي' },
  { value: 'true_false', label: 'صح وغلط' },
  { value: 'multiple_choice', label: 'اختيار من متعدد' },
];

const emptyQuestion = () => ({
  question_text: '',
  question_type: 'text',
  image_url: '',
  pdf_url: '',
  options: ['', '', ''],
  correct_answer: '',
});

function normalizeOptions(options) {
  if (Array.isArray(options) && options.length) return options;
  return ['', '', ''];
}

export default function QuestionsEditor({ questions, onChange, fileState, onFileChange }) {
  const updateQuestion = (index, key, value) => {
    const next = questions.map((q, i) => {
      if (i !== index) return q;
      const updated = { ...q, [key]: value };
      if (key === 'question_type') {
        updated.correct_answer = '';
        if (value === 'multiple_choice') {
          updated.options = normalizeOptions(q.options);
        } else {
          updated.options = [];
        }
      }
      return updated;
    });
    onChange(next);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const next = questions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...normalizeOptions(q.options)];
      options[optIndex] = value;
      return { ...q, options };
    });
    onChange(next);
  };

  const addOption = (qIndex) => {
    const next = questions.map((q, i) => (
      i === qIndex ? { ...q, options: [...normalizeOptions(q.options), ''] } : q
    ));
    onChange(next);
  };

  const removeOption = (qIndex, optIndex) => {
    const next = questions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = normalizeOptions(q.options).filter((_, idx) => idx !== optIndex);
      const removed = normalizeOptions(q.options)[optIndex];
      const correctAnswer = q.correct_answer === removed ? '' : q.correct_answer;
      return { ...q, options: options.length ? options : ['', ''], correct_answer: correctAnswer };
    });
    onChange(next);
  };

  const addQuestion = () => onChange([...questions, emptyQuestion()]);

  const removeQuestion = (index) => {
    if (!window.confirm('حذف السؤال؟')) return;
    onChange(questions.filter((_, i) => i !== index));
    onFileChange?.('questions', index, null, null);
  };

  const renderCorrectAnswer = (q, index) => {
    if (q.question_type === 'true_false') {
      return (
        <label>
          الإجابة الصحيحة
          <select
            value={q.correct_answer || ''}
            onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
            required
          >
            <option value="">اختار...</option>
            <option value="true">صح</option>
            <option value="false">غلط</option>
          </select>
        </label>
      );
    }

    if (q.question_type === 'multiple_choice') {
      const filledOptions = normalizeOptions(q.options).filter((opt) => opt.trim());
      return (
        <label>
          الإجابة الصحيحة
          <select
            value={q.correct_answer || ''}
            onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
            required
            disabled={!filledOptions.length}
          >
            <option value="">{filledOptions.length ? 'اختار الإجابة الصحيحة...' : 'اكتب الاختيارات أولاً'}</option>
            {filledOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label className="admin-form-full">
        الإجابة الصحيحة
        <input
          value={q.correct_answer || ''}
          onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
          placeholder="اكتب الإجابة الصحيحة"
          required
        />
      </label>
    );
  };

  return (
    <div className="dash-questions-editor admin-form-full">
      <div className="dash-questions-editor__head">
        <div>
          <h3>الأسئلة اليدوية</h3>
          <p className="dash-questions-editor__hint">
            اختار نوع السؤال: نصي، صح وغلط، أو اختيار من متعدد — وحدد الإجابة الصحيحة
          </p>
        </div>
        <button type="button" className="dash-btn dash-btn--primary dash-btn--sm" onClick={addQuestion}>
          <IconPlus />
          إضافة سؤال
        </button>
      </div>

      {questions.length === 0 ? (
        <p className="dash-questions-editor__empty">
          اضغط «إضافة سؤال» لبناء الأسئلة يدوياً
        </p>
      ) : (
        questions.map((q, index) => (
          <div key={index} className="dash-question-card">
            <div className="dash-question-card__head">
              <strong>سؤال {index + 1}</strong>
              <button
                type="button"
                className="dash-btn dash-btn--outline dash-btn--sm dash-btn--danger"
                onClick={() => removeQuestion(index)}
              >
                حذف
              </button>
            </div>

            <label>
              نوع السؤال
              <select
                value={q.question_type || 'text'}
                onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>

            <label className="admin-form-full">
              نص السؤال
              <textarea
                rows={3}
                value={q.question_text}
                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                placeholder="اكتب السؤال هنا"
              />
            </label>

            {q.question_type === 'multiple_choice' && (
              <div className="dash-question-options admin-form-full">
                <div className="dash-question-options__head">
                  <strong>الاختيارات</strong>
                  <button
                    type="button"
                    className="dash-btn dash-btn--outline dash-btn--sm"
                    onClick={() => addOption(index)}
                  >
                    إضافة اختيار
                  </button>
                </div>
                {normalizeOptions(q.options).map((opt, optIndex) => (
                  <div key={optIndex} className="dash-question-option-row">
                    <input
                      value={opt}
                      onChange={(e) => updateOption(index, optIndex, e.target.value)}
                      placeholder={`الاختيار ${optIndex + 1}`}
                    />
                    {normalizeOptions(q.options).length > 2 && (
                      <button
                        type="button"
                        className="dash-btn dash-btn--outline dash-btn--sm dash-btn--danger"
                        onClick={() => removeOption(index, optIndex)}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {renderCorrectAnswer(q, index)}

            <FileUploadField
              label="صورة السؤال (اختياري)"
              accept="image/*"
              uploadKind="image"
              value={q.image_url}
              file={fileState?.[`q${index}_image`] || null}
              onFileChange={(file) => onFileChange?.('questions', index, 'image', file)}
            />
            <FileUploadField
              label="ملف PDF (اختياري)"
              accept="application/pdf,.pdf"
              uploadKind="pdf"
              value={q.pdf_url}
              file={fileState?.[`q${index}_pdf`] || null}
              onFileChange={(file) => onFileChange?.('questions', index, 'pdf', file)}
            />
          </div>
        ))
      )}
    </div>
  );
}

export { emptyQuestion };
