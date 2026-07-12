const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');
const { normalizeQuestionInput, formatQuestionRow } = require('../../utils/questionHelpers');

const router = express.Router();
router.use(authAdmin);

async function replaceAssignmentQuestions(assignmentId, questions = [], connection = pool) {
  await connection.query('DELETE FROM assignment_questions WHERE assignment_id = ?', [assignmentId]);
  let order = 1;
  for (const raw of questions) {
    const q = normalizeQuestionInput(raw);
    if (!q.question_text) continue;
    await connection.query(
      `INSERT INTO assignment_questions
        (assignment_id, question_text, question_type, image_url, pdf_url, options, correct_answer, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignmentId,
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

async function fetchQuestions(assignmentId) {
  const [rows] = await pool.query(
    'SELECT * FROM assignment_questions WHERE assignment_id = ? ORDER BY sort_order, id',
    [assignmentId],
  );
  return rows.map(formatQuestionRow);
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, c.title_ar AS course_title, g.name_ar AS grade_name,
        (SELECT COUNT(*) FROM assignment_questions q WHERE q.assignment_id = a.id) AS questions_count
      FROM assignments a
      LEFT JOIN courses c ON c.id = a.course_id
      LEFT JOIN grades g ON g.id = a.grade_id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الواجبات' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.title_ar AS course_title, g.name_ar AS grade_name
       FROM assignments a
       LEFT JOIN courses c ON c.id = a.course_id
       LEFT JOIN grades g ON g.id = a.grade_id
       WHERE a.id = ?`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'الواجب غير موجود' });
    const questions = await fetchQuestions(req.params.id);
    res.json({ success: true, data: { ...rows[0], questions } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الواجب' });
  }
});

router.post('/', async (req, res) => {
  const {
    course_id, grade_id, title_ar, description_ar, image_url, file_url, due_date, status, questions,
  } = req.body;
  if (!title_ar) return res.status(400).json({ success: false, message: 'عنوان الواجب مطلوب' });
  if (!grade_id && !course_id) {
    return res.status(400).json({ success: false, message: 'اختار الصف الدراسي أو الكورس' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO assignments (course_id, grade_id, title_ar, description_ar, image_url, file_url, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        file_url || null,
        due_date || null,
        status || 'published',
      ],
    );
    const qCount = await replaceAssignmentQuestions(result.insertId, questions, connection);
    if (!file_url && qCount === 0) {
      throw new Error('أضف ملف PDF أو سؤال واحد على الأقل');
    }
    await connection.commit();
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'فشل إضافة الواجب' });
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const {
    course_id, grade_id, title_ar, description_ar, image_url, file_url, due_date, status, questions,
  } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE assignments SET course_id=?, grade_id=?, title_ar=?, description_ar=?, image_url=?, file_url=?, due_date=?, status=?
       WHERE id=?`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        file_url || null,
        due_date || null,
        status || 'published',
        req.params.id,
      ],
    );
    const qCount = await replaceAssignmentQuestions(req.params.id, questions, connection);
    if (!file_url && qCount === 0) {
      throw new Error('أضف ملف PDF أو سؤال واحد على الأقل');
    }
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث الواجب' });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف الواجب' });
  }
});

module.exports = router;
