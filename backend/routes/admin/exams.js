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
        (SELECT COUNT(*) FROM exam_questions q WHERE q.exam_id = e.id) AS manual_questions_count,
        (SELECT COUNT(*) FROM exam_submissions s WHERE s.exam_id = e.id) AS submissions_count
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

router.get('/:id/results', async (req, res) => {
  try {
    const [exams] = await pool.query(
      `SELECT e.id, e.title_ar, e.duration_minutes, e.questions_count,
              c.title_ar AS course_title, g.name_ar AS grade_name
       FROM exams e
       LEFT JOIN courses c ON c.id = e.course_id
       LEFT JOIN grades g ON g.id = e.grade_id
       WHERE e.id = ?`,
      [req.params.id],
    );
    if (!exams.length) {
      return res.status(404).json({ success: false, message: 'الاختبار غير موجود' });
    }

    const questions = await fetchQuestions(req.params.id);
    let rows = [];
    try {
      const [subs] = await pool.query(
        `SELECT s.id, s.exam_id, s.student_id, s.answers_json, s.score, s.correct_count,
          s.total_questions, s.submitted_at, s.updated_at,
          st.name AS student_name, st.email AS student_email,
          e.title_ar AS exam_title,
          c.title_ar AS course_title,
          g.name_ar AS grade_name
         FROM exam_submissions s
         JOIN students st ON st.id = s.student_id
         JOIN exams e ON e.id = s.exam_id
         LEFT JOIN courses c ON c.id = e.course_id
         LEFT JOIN grades g ON g.id = e.grade_id
         WHERE s.exam_id = ?
         ORDER BY s.submitted_at DESC`,
        [req.params.id],
      );
      rows = subs;
    } catch {
      rows = [];
    }

    const results = rows.map((row) => {
      let answers = row.answers_json;
      if (typeof answers === 'string') {
        try { answers = JSON.parse(answers); } catch { answers = {}; }
      }
      return {
        ...row,
        answers: answers && typeof answers === 'object' ? answers : {},
        answers_json: undefined,
      };
    });

    res.json({
      success: true,
      data: {
        exam: exams[0],
        questions,
        results,
        stats: {
          total: results.length,
          avgScore: results.length
            ? Math.round(results.reduce((sum, r) => sum + Number(r.score || 0), 0) / results.length)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل نتائج الاختبار' });
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
    course_id, grade_id, title_ar, description_ar, image_url,
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
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        questions_count || 10,
        duration_minutes || 60,
        is_active !== false,
      ],
    );
    const qCount = await replaceExamQuestions(result.insertId, questions, connection);
    if (qCount === 0) {
      throw new Error('أضف سؤال واحد على الأقل');
    }
    await connection.query('UPDATE exams SET questions_count = ? WHERE id = ?', [qCount, result.insertId]);
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
    course_id, grade_id, title_ar, description_ar, image_url,
    questions_count, duration_minutes, is_active, questions,
  } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const qCount = await replaceExamQuestions(req.params.id, questions, connection);
    if (qCount === 0) {
      throw new Error('أضف سؤال واحد على الأقل');
    }
    await connection.query(
      `UPDATE exams SET course_id=?, grade_id=?, title_ar=?, description_ar=?, image_url=?, file_url=NULL, questions_count=?, duration_minutes=?, is_active=?
       WHERE id=?`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        qCount,
        duration_minutes || 60,
        is_active !== false,
        req.params.id,
      ],
    );
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
