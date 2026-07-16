const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');
const { normalizeQuestionInput, formatQuestionRow } = require('../../utils/questionHelpers');

const router = express.Router();
router.use(authAdmin);

function resolveDeliveryMode(body, questionCount, fileUrl) {
  const raw = String(body.delivery_mode || '').trim();
  if (raw === 'pdf' || raw === 'manual') return raw;
  if (fileUrl) return 'pdf';
  if (questionCount > 0) return 'manual';
  return 'manual';
}

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
        (SELECT COUNT(*) FROM assignment_questions q WHERE q.assignment_id = a.id) AS questions_count,
        (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id) AS submissions_count
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

router.get('/:id/submissions', async (req, res) => {
  try {
    const [assignments] = await pool.query(
      `SELECT a.id, a.title_ar, a.delivery_mode, a.file_url,
              c.title_ar AS course_title, g.name_ar AS grade_name
       FROM assignments a
       LEFT JOIN courses c ON c.id = a.course_id
       LEFT JOIN grades g ON g.id = a.grade_id
       WHERE a.id = ?`,
      [req.params.id],
    );
    if (!assignments.length) {
      return res.status(404).json({ success: false, message: 'الواجب غير موجود' });
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.assignment_id, s.student_id, s.pdf_url, s.answers_json,
        s.submitted_at, s.updated_at,
        st.name AS student_name, st.email AS student_email,
        a.title_ar AS assignment_title,
        c.title_ar AS course_title,
        g.name_ar AS grade_name
       FROM assignment_submissions s
       JOIN students st ON st.id = s.student_id
       JOIN assignments a ON a.id = s.assignment_id
       LEFT JOIN courses c ON c.id = a.course_id
       LEFT JOIN grades g ON g.id = a.grade_id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC`,
      [req.params.id],
    );

    const questions = await fetchQuestions(req.params.id);
    const data = rows.map((row) => {
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
        assignment: assignments[0],
        questions,
        submissions: data,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل تسليمات الواجب' });
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

  const incomingQuestions = Array.isArray(questions) ? questions : [];
  const deliveryMode = resolveDeliveryMode(req.body, incomingQuestions.length, file_url);

  if (deliveryMode === 'pdf' && !String(file_url || '').trim()) {
    return res.status(400).json({ success: false, message: 'ارفع ملف PDF للواجب' });
  }
  if (deliveryMode === 'manual' && !incomingQuestions.some((q) => String(q.question_text || '').trim())) {
    return res.status(400).json({ success: false, message: 'أضف سؤال واحد على الأقل' });
  }

  const savedFileUrl = deliveryMode === 'pdf' ? (file_url || null) : null;
  const savedQuestions = deliveryMode === 'manual' ? incomingQuestions : [];

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO assignments
        (course_id, grade_id, title_ar, description_ar, image_url, file_url, due_date, status, delivery_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        savedFileUrl,
        due_date || null,
        status || 'published',
        deliveryMode,
      ],
    );
    await replaceAssignmentQuestions(result.insertId, savedQuestions, connection);
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

  const incomingQuestions = Array.isArray(questions) ? questions : [];
  const deliveryMode = resolveDeliveryMode(req.body, incomingQuestions.length, file_url);

  if (deliveryMode === 'pdf' && !String(file_url || '').trim()) {
    return res.status(400).json({ success: false, message: 'ارفع ملف PDF للواجب' });
  }
  if (deliveryMode === 'manual' && !incomingQuestions.some((q) => String(q.question_text || '').trim())) {
    return res.status(400).json({ success: false, message: 'أضف سؤال واحد على الأقل' });
  }

  const savedFileUrl = deliveryMode === 'pdf' ? (file_url || null) : null;
  const savedQuestions = deliveryMode === 'manual' ? incomingQuestions : [];

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE assignments
       SET course_id=?, grade_id=?, title_ar=?, description_ar=?, image_url=?, file_url=?, due_date=?, status=?, delivery_mode=?
       WHERE id=?`,
      [
        course_id || null,
        grade_id || null,
        title_ar,
        description_ar || null,
        image_url || null,
        savedFileUrl,
        due_date || null,
        status || 'published',
        deliveryMode,
        req.params.id,
      ],
    );
    await replaceAssignmentQuestions(req.params.id, savedQuestions, connection);
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
