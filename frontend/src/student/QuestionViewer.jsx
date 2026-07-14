const TYPE_LABELS = {
  text: 'سؤال نصي',
  true_false: 'صح وغلط',
  multiple_choice: 'اختيار من متعدد',
};

export default function QuestionViewer({ question, index }) {
  const type = question.question_type || 'text';
  const options = Array.isArray(question.options) ? question.options : [];

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
          <label><input type="radio" name={`q-${question.id || index}`} value="true" /> صح</label>
          <label><input type="radio" name={`q-${question.id || index}`} value="false" /> غلط</label>
        </div>
      )}

      {type === 'multiple_choice' && (
        <div className="student-answer-group">
          {options.map((opt) => (
            <label key={opt}>
              <input type="radio" name={`q-${question.id || index}`} value={opt} />
              {opt}
            </label>
          ))}
        </div>
      )}

      {type === 'text' && (
        <input
          type="text"
          className="student-answer-input"
          placeholder="اكتب إجابتك"
        />
      )}
    </div>
  );
}
