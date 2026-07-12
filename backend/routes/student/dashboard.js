const express = require('express');
const pool = require('../../config/db');
const authStudent = require('../../middleware/authStudent');

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
      SELECT c.*, g.name_ar AS grade_name, e.progress, e.status, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN grades g ON g.id = c.grade_id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.student.id]);
    res.json({ success: true, data: rows });
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
  try {
    await pool.query(
      `UPDATE enrollments SET progress = ?, status = ? WHERE student_id = ? AND course_id = ?`,
      [progress, status, req.student.id, req.params.courseId],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث التقدم' });
  }
});

router.get('/assignments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, c.title_ar AS course_title, g.name_ar AS grade_name
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
    res.json({ success: true, data: rows });
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
    const [questions] = await pool.query(
      'SELECT * FROM assignment_questions WHERE assignment_id = ? ORDER BY sort_order, id',
      [req.params.id],
    );
    res.json({ success: true, data: { ...rows[0], questions } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الواجب' });
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
    res.json({ success: true, data: { ...rows[0], questions } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الاختبار' });
  }
});

module.exports = router;
