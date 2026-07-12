const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');
const { normalizeQuestionInput, formatQuestionRow } = require('../../utils/questionHelpers');

const router = express.Router();
router.use(authAdmin);

async function replaceExamQuestions(examId, questions = [], connection = pool) {
  await connection.query('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);
  let order = 1;
  for (const raw of questions) {
    const q = normalizeQuestionInput(raw);
    if (!q.question_text) continue;
    await connection.query(
      `INSERT INTO exam_questions
        (exam_id, question_text, question_type, image_url, pdf_url, options, correct_answer, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        examId,
        q.question_text,
        q.question_type,
        q.image_url,
        q.pdf_url,
        q.options,
        q.correct_answer,
        order,
      ],
    );
    order += 1;
  }
  return order - 1;
}

async function fetchQuestions(examId) {
  const [rows] = await pool.query(
    'SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY sort_order, id',
    [examId],
  );
  return rows.map(formatQuestionRow);
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.title_ar AS course_title, g.name_ar AS grade_name,
        (SELECT COUNT(*) FROM exam_questions q WHERE q.exam_id = e.id) AS manual_questions_count
      FROM exams e
      LEFT JOIN courses c ON c.id = e.course_id
      LEFT JOIN grades g ON g.id = e.grade_id
      ORDER BY e.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الاختبارات' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, c.title_ar AS course_title, g.name_ar AS grade_name
       FROM exams e
       LEFT JOIN courses c ON c.id = e.course_id
       LEFT JOIN grades g ON g.id = e.grade_id
       WHERE e.id = ?`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'الاختبار غير موجود' });
    const questions = await fetchQuestions(req.params.id);
    res.json({ success: true, data: { ...rows[0], questions } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الاختبار' });
  }
});

router.post('/', async (req, res) => {
  const {
    course_id, grade_id, title_ar, description_ar, image_url, file_url,
    questions_count, duration_minutes, is_active, questions,
  } = req.body;
  if (!title_ar) return res.status(400).json({ success: false, message: 'عنوان الاختبار مطلوب' });
  if (!grade_id && !course_id) {
    return res.status(400).json({ success: false, message: 'اختار الصف الدراسي أو الكورس' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO exams (course_id, grade_id, title_ar, description_ar, image_url, file_url, questions_count, duration_minutes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        file_url || null,
        questions_count || 10,
        duration_minutes || 60,
        is_active !== false,
      ],
    );
    const qCount = await replaceExamQuestions(result.insertId, questions, connection);
    if (!file_url && qCount === 0) {
      throw new Error('أضف ملف PDF أو سؤال واحد على الأقل');
    }
    if (qCount > 0) {
      await connection.query('UPDATE exams SET questions_count = ? WHERE id = ?', [qCount, result.insertId]);
    }
    await connection.commit();
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'فشل إضافة الاختبار' });
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const {
    course_id, grade_id, title_ar, description_ar, image_url, file_url,
    questions_count, duration_minutes, is_active, questions,
  } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const qCount = await replaceExamQuestions(req.params.id, questions, connection);
    const finalCount = qCount > 0 ? qCount : (questions_count || 10);
    await connection.query(
      `UPDATE exams SET course_id=?, grade_id=?, title_ar=?, description_ar=?, image_url=?, file_url=?, questions_count=?, duration_minutes=?, is_active=?
       WHERE id=?`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        file_url || null,
        finalCount,
        duration_minutes || 60,
        is_active !== false,
        req.params.id,
      ],
    );
    if (!file_url && qCount === 0) {
      throw new Error('أضف ملف PDF أو سؤال واحد على الأقل');
    }
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث الاختبار' });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM exams WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف الاختبار' });
  }
});

module.exports = router;
