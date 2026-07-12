function parseOptions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeQuestionInput(question) {
  const questionType = ['text', 'true_false', 'multiple_choice'].includes(question?.question_type)
    ? question.question_type
    : 'text';

  const options = questionType === 'multiple_choice'
    ? (question.options || []).map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  let correctAnswer = String(question.correct_answer ?? '').trim();
  if (questionType === 'true_false') {
    correctAnswer = correctAnswer === 'false' ? 'false' : correctAnswer === 'true' ? 'true' : '';
  }
  if (questionType === 'multiple_choice' && correctAnswer && !options.includes(correctAnswer)) {
    correctAnswer = '';
  }

  return {
    question_text: String(question.question_text || '').trim(),
    question_type: questionType,
    image_url: question.image_url || null,
    pdf_url: question.pdf_url || null,
    options: questionType === 'multiple_choice' ? JSON.stringify(options) : null,
    correct_answer: correctAnswer || null,
  };
}

function formatQuestionRow(row) {
  return {
    ...row,
    options: parseOptions(row.options),
  };
}

module.exports = {
  parseOptions,
  normalizeQuestionInput,
  formatQuestionRow,
};
