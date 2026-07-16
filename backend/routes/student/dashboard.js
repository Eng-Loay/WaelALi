const express = require('express');
const pool = require('../../config/db');
const authStudent = require('../../middleware/authStudent');
const { formatQuestionRow } = require('../../utils/questionHelpers');
const { logStudentActivity } = require('../../utils/studentActivity');

const router = express.Router();
router.use(authStudent);

router.get('/overview', async (req, res) => {
  const studentId = req.student.id;
  try {
    const [[{ courses }]] = await pool.query(
      'SELECT COUNT(*) AS courses FROM enrollments WHERE student_id = ?',
      [studentId],
    );
    const [[{ completed }]] = await pool.query(
      "SELECT COUNT(*) AS completed FROM enrollments WHERE student_id = ? AND status = 'completed'",
      [studentId],
    );
    const [[{ avgProgress }]] = await pool.query(
      'SELECT COALESCE(AVG(progress), 0) AS avgProgress FROM enrollments WHERE student_id = ?',
      [studentId],
    );

    let assignments = 0;
    let exams = 0;
    try {
      [[{ assignments }]] = await pool.query(`
        SELECT COUNT(*) AS assignments FROM assignments a
        JOIN students s ON s.id = ?
        WHERE a.status = 'published'
          AND (
            (a.grade_id IS NOT NULL AND a.grade_id = s.grade_id)
            OR (a.course_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = a.course_id
            ))
          )
      `, [studentId]);
    } catch { assignments = 0; }

    try {
      [[{ exams }]] = await pool.query(`
        SELECT COUNT(*) AS exams FROM exams x
        JOIN students s ON s.id = ?
        WHERE x.is_active = TRUE
          AND (
            (x.grade_id IS NOT NULL AND x.grade_id = s.grade_id)
            OR (x.course_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = x.course_id
            ))
          )
      `, [studentId]);
    } catch { exams = 0; }

    res.json({
      success: true,
      data: {
        totalCourses: Number(courses),
        completedCourses: Number(completed),
        avgProgress: Math.round(Number(avgProgress)),
        assignments: Number(assignments),
        exams: Number(exams),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل نظرة عامة' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, g.name_ar AS grade_name, e.progress, e.status, e.enrolled_at,
        (SELECT COUNT(*) FROM course_lessons cl
         WHERE cl.course_id = c.id AND cl.is_published = 1) AS published_lessons
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN grades g ON g.id = c.grade_id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.student.id]);
    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        lessons_count: Number(row.published_lessons) || 0,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل كورساتك' });
  }
});

router.get('/available-courses', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, g.name_ar AS grade_name
      FROM courses c
      LEFT JOIN grades g ON g.id = c.grade_id
      WHERE c.id NOT IN (SELECT course_id FROM enrollments WHERE student_id = ?)
      ORDER BY c.created_at DESC
    `, [req.student.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الكورسات المتاحة' });
  }
});

router.post('/enroll/:courseId', async (req, res) => {
  try {
    await pool.query(
      `INSERT IGNORE INTO enrollments (student_id, course_id, progress, status)
       VALUES (?, ?, 0, 'active')`,
      [req.student.id, req.params.courseId],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل الاشتراك في الكورس' });
  }
});

router.patch('/courses/:courseId/progress', async (req, res) => {
  const progress = Math.max(0, Math.min(100, Number(req.body.progress) || 0));
  const status = progress >= 100 ? 'completed' : 'active';
  const courseId = Number(req.params.courseId);
  try {
    await pool.query(
      `UPDATE enrollments SET progress = ?, status = ? WHERE student_id = ? AND course_id = ?`,
      [progress, status, req.student.id, courseId],
    );
    const [courses] = await pool.query('SELECT title_ar FROM courses WHERE id = ?', [courseId]);
    await logStudentActivity({
      studentId: req.student.id,
      courseId,
      activityType: 'course_progress',
      titleAr: courses[0]?.title_ar ? `${courses[0].title_ar} — ${progress}%` : `${progress}%`,
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث التقدم' });
  }
});

router.get('/assignments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, c.title_ar AS course_title, g.name_ar AS grade_name,
        CASE
          WHEN a.delivery_mode = 'pdf' THEN 'pdf'
          WHEN a.delivery_mode = 'manual' THEN 'manual'
          WHEN a.file_url IS NOT NULL AND a.file_url != '' THEN 'pdf'
          ELSE 'manual'
        END AS delivery_mode_resolved
      FROM assignments a
      LEFT JOIN courses c ON c.id = a.course_id
      LEFT JOIN grades g ON g.id = a.grade_id
      JOIN students s ON s.id = ?
      WHERE a.status = 'published'
        AND (
          (a.grade_id IS NOT NULL AND a.grade_id = s.grade_id)
          OR (a.course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = a.course_id
          ))
        )
      ORDER BY a.due_date IS NULL, a.due_date ASC
    `, [req.student.id]);
    res.json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        delivery_mode: r.delivery_mode_resolved || r.delivery_mode || 'manual',
      })),
    });
  } catch (error) {
    console.error(error);
    res.json({ success: true, data: [] });
  }
});

router.get('/assignments/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, c.title_ar AS course_title, g.name_ar AS grade_name
      FROM assignments a
      LEFT JOIN courses c ON c.id = a.course_id
      LEFT JOIN grades g ON g.id = a.grade_id
      JOIN students s ON s.id = ?
      WHERE a.id = ? AND a.status = 'published'
        AND (
          (a.grade_id IS NOT NULL AND a.grade_id = s.grade_id)
          OR (a.course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = a.course_id
          ))
        )
    `, [req.student.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'الواجب غير متاح' });

    const assignment = rows[0];
    const mode = assignment.delivery_mode === 'pdf'
      ? 'pdf'
      : assignment.delivery_mode === 'manual'
        ? 'manual'
        : (assignment.file_url ? 'pdf' : 'manual');

    let questions = [];
    if (mode === 'manual') {
      const [qRows] = await pool.query(
        'SELECT * FROM assignment_questions WHERE assignment_id = ? ORDER BY sort_order, id',
        [req.params.id],
      );
      questions = qRows.map(formatQuestionRow);
    }

    let submission = null;
    try {
      const [subs] = await pool.query(
        `SELECT id, pdf_url, answers_json, submitted_at, updated_at
         FROM assignment_submissions
         WHERE assignment_id = ? AND student_id = ?
         LIMIT 1`,
        [req.params.id, req.student.id],
      );
      if (subs.length) {
        const row = subs[0];
        let answers = row.answers_json;
        if (typeof answers === 'string') {
          try { answers = JSON.parse(answers); } catch { answers = {}; }
        }
        submission = {
          id: row.id,
          pdf_url: row.pdf_url,
          answers: answers && typeof answers === 'object' ? answers : {},
          submitted_at: row.submitted_at,
          updated_at: row.updated_at,
        };
      }
    } catch {
      submission = null;
    }

    res.json({
      success: true,
      data: {
        ...assignment,
        delivery_mode: mode === 'pdf' ? 'pdf' : 'manual',
        questions: mode === 'manual' ? questions : [],
        file_url: mode === 'pdf' ? assignment.file_url : null,
        submission,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الواجب' });
  }
});

router.post('/assignments/:id/submit', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*
      FROM assignments a
      JOIN students s ON s.id = ?
      WHERE a.id = ? AND a.status = 'published'
        AND (
          (a.grade_id IS NOT NULL AND a.grade_id = s.grade_id)
          OR (a.course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = a.course_id
          ))
        )
    `, [req.student.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'الواجب غير متاح' });

    const assignment = rows[0];
    const mode = assignment.delivery_mode === 'pdf'
      ? 'pdf'
      : assignment.delivery_mode === 'manual'
        ? 'manual'
        : (assignment.file_url ? 'pdf' : 'manual');

    const { pdf_url, answers } = req.body || {};

    if (mode === 'pdf') {
      if (!String(pdf_url || '').trim()) {
        return res.status(400).json({ success: false, message: 'ارفع ملف PDF الإجابة' });
      }
      await pool.query(
        `INSERT INTO assignment_submissions (assignment_id, student_id, pdf_url, answers_json)
         VALUES (?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE pdf_url = VALUES(pdf_url), answers_json = NULL, updated_at = CURRENT_TIMESTAMP`,
        [assignment.id, req.student.id, pdf_url],
      );
    } else {
      const answersObj = answers && typeof answers === 'object' ? answers : {};
      const answered = Object.values(answersObj).some((v) => String(v ?? '').trim() !== '');
      if (!answered) {
        return res.status(400).json({ success: false, message: 'أجب على الأسئلة قبل التسليم' });
      }
      await pool.query(
        `INSERT INTO assignment_submissions (assignment_id, student_id, pdf_url, answers_json)
         VALUES (?, ?, NULL, ?)
         ON DUPLICATE KEY UPDATE answers_json = VALUES(answers_json), pdf_url = NULL, updated_at = CURRENT_TIMESTAMP`,
        [assignment.id, req.student.id, JSON.stringify(answersObj)],
      );
    }

    if (assignment.course_id) {
      await logStudentActivity({
        studentId: req.student.id,
        courseId: assignment.course_id,
        activityType: 'submit_assignment',
        titleAr: assignment.title_ar,
      });
    }

    res.json({ success: true, message: 'تم تسليم الواجب بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تسليم الواجب' });
  }
});

router.get('/exams', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT x.*, c.title_ar AS course_title, g.name_ar AS grade_name
      FROM exams x
      LEFT JOIN courses c ON c.id = x.course_id
      LEFT JOIN grades g ON g.id = x.grade_id
      JOIN students s ON s.id = ?
      WHERE x.is_active = TRUE
        AND (
          (x.grade_id IS NOT NULL AND x.grade_id = s.grade_id)
          OR (x.course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = x.course_id
          ))
        )
      ORDER BY x.created_at DESC
    `, [req.student.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.json({ success: true, data: [] });
  }
});

router.get('/exams/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT x.*, c.title_ar AS course_title, g.name_ar AS grade_name
      FROM exams x
      LEFT JOIN courses c ON c.id = x.course_id
      LEFT JOIN grades g ON g.id = x.grade_id
      JOIN students s ON s.id = ?
      WHERE x.id = ? AND x.is_active = TRUE
        AND (
          (x.grade_id IS NOT NULL AND x.grade_id = s.grade_id)
          OR (x.course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = x.course_id
          ))
        )
    `, [req.student.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'الاختبار غير متاح' });
    const [questions] = await pool.query(
      'SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY sort_order, id',
      [req.params.id],
    );

    let submission = null;
    try {
      const [subs] = await pool.query(
        `SELECT id, answers_json, score, correct_count, total_questions, submitted_at, updated_at
         FROM exam_submissions
         WHERE exam_id = ? AND student_id = ?
         LIMIT 1`,
        [req.params.id, req.student.id],
      );
      if (subs.length) {
        const row = subs[0];
        let answers = row.answers_json;
        if (typeof answers === 'string') {
          try { answers = JSON.parse(answers); } catch { answers = {}; }
        }
        submission = {
          id: row.id,
          answers: answers && typeof answers === 'object' ? answers : {},
          score: row.score,
          correct_count: row.correct_count,
          total_questions: row.total_questions,
          submitted_at: row.submitted_at,
          updated_at: row.updated_at,
        };
      }
    } catch {
      submission = null;
    }

    const safeQuestions = questions.map((q) => {
      const formatted = formatQuestionRow(q);
      if (!submission) {
        const { correct_answer, ...rest } = formatted;
        return rest;
      }
      return formatted;
    });

    res.json({
      success: true,
      data: {
        ...rows[0],
        file_url: null,
        questions: safeQuestions,
        submission,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الاختبار' });
  }
});

router.post('/exams/:id/submit', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT x.*
      FROM exams x
      JOIN students s ON s.id = ?
      WHERE x.id = ? AND x.is_active = TRUE
        AND (
          (x.grade_id IS NOT NULL AND x.grade_id = s.grade_id)
          OR (x.course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = x.course_id
          ))
        )
    `, [req.student.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'الاختبار غير متاح' });

    const exam = rows[0];
    const answersObj = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
    const answered = Object.values(answersObj).some((v) => String(v ?? '').trim() !== '');
    if (!answered) {
      return res.status(400).json({ success: false, message: 'أجب على الأسئلة قبل التسليم' });
    }

    const [questions] = await pool.query(
      'SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY sort_order, id',
      [req.params.id],
    );
    if (!questions.length) {
      return res.status(400).json({ success: false, message: 'الاختبار بدون أسئلة' });
    }

    let correctCount = 0;
    for (const q of questions) {
      const studentAnswer = String(answersObj[String(q.id)] ?? '').trim().toLowerCase();
      const correct = String(q.correct_answer ?? '').trim().toLowerCase();
      if (!correct) continue;
      if (studentAnswer && studentAnswer === correct) correctCount += 1;
    }
    const total = questions.length;
    const score = total ? Math.round((correctCount / total) * 10000) / 100 : 0;

    await pool.query(
      `INSERT INTO exam_submissions (exam_id, student_id, answers_json, score, correct_count, total_questions)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         answers_json = VALUES(answers_json),
         score = VALUES(score),
         correct_count = VALUES(correct_count),
         total_questions = VALUES(total_questions),
         updated_at = CURRENT_TIMESTAMP`,
      [exam.id, req.student.id, JSON.stringify(answersObj), score, correctCount, total],
    );

    if (exam.course_id) {
      await logStudentActivity({
        studentId: req.student.id,
        courseId: exam.course_id,
        activityType: 'open_exam',
        titleAr: exam.title_ar,
      });
    }

    res.json({
      success: true,
      message: 'تم تسليم الاختبار بنجاح',
      data: { score, correct_count: correctCount, total_questions: total },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تسليم الاختبار' });
  }
});

module.exports = router;
