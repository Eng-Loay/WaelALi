const TYPE_LABELS = {
  text: 'مقالي',
  true_false: 'صح وغلط',
  multiple_choice: 'اختيارات',
};

export default function QuestionViewer({ question, index, value = '', onChange, readOnly = false }) {
  const type = question.question_type || 'text';
  const options = Array.isArray(question.options) ? question.options : [];
  const name = `q-${question.id || index}`;
  const controlled = typeof onChange === 'function';

  return (
    <div className="student-question-item">
      <div className="student-question-item__meta">
        <strong>سؤال {index + 1}</strong>
        <span>{TYPE_LABELS[type] || type}</span>
      </div>
      <p>{question.question_text}</p>
      {question.image_url && <img src={question.image_url} alt="" className="student-question-image" />}
      {question.pdf_url && (
        <a href={question.pdf_url} target="_blank" rel="noreferrer">ملف السؤال PDF</a>
      )}

      {type === 'true_false' && (
        <div className="student-answer-group">
          <label>
            <input
              type="radio"
              name={name}
              value="true"
              disabled={readOnly}
              {...(controlled
                ? { checked: value === 'true', onChange: () => onChange('true') }
                : {})}
            />
            صح
          </label>
          <label>
            <input
              type="radio"
              name={name}
              value="false"
              disabled={readOnly}
              {...(controlled
                ? { checked: value === 'false', onChange: () => onChange('false') }
                : {})}
            />
            غلط
          </label>
        </div>
      )}

      {type === 'multiple_choice' && (
        <div className="student-answer-group">
          {options.map((opt) => (
            <label key={opt}>
              <input
                type="radio"
                name={name}
                value={opt}
                disabled={readOnly}
                {...(controlled
                  ? { checked: value === opt, onChange: () => onChange(opt) }
                  : {})}
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {type === 'text' && (
        controlled ? (
          <textarea
            className="student-answer-input"
            rows={3}
            placeholder="اكتب إجابتك"
            value={value}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <textarea
            className="student-answer-input"
            rows={3}
            placeholder="اكتب إجابتك"
            disabled={readOnly}
          />
        )
      )}
    </div>
  );
}
