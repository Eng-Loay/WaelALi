const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');
const { cairoTodayDate } = require('../../utils/studentActivity');

const router = express.Router();
router.use(authAdmin);

function parseDate(input) {
  const raw = String(input || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return cairoTodayDate();
}

router.get('/courses', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.title_ar, c.grade_id, g.name_ar AS grade_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS students_count
      FROM courses c
      LEFT JOIN grades g ON g.id = c.grade_id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الكورسات' });
  }
});

router.get('/courses/:courseId', async (req, res) => {
  const courseId = Number(req.params.courseId);
  const date = parseDate(req.query.date);

  try {
    const [courses] = await pool.query(
      `SELECT c.*, g.name_ar AS grade_name
       FROM courses c
       LEFT JOIN grades g ON g.id = c.grade_id
       WHERE c.id = ?`,
      [courseId],
    );
    if (!courses.length) {
      return res.status(404).json({ success: false, message: 'الكورس غير موجود' });
    }

    const [students] = await pool.query(
      `SELECT s.id, s.name, s.email
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       WHERE e.course_id = ?
       ORDER BY s.name ASC`,
      [courseId],
    );

    let manualMap = {};
    try {
      const [manual] = await pool.query(
        `SELECT student_id, status FROM course_attendance
         WHERE course_id = ? AND attendance_date = ?`,
        [courseId, date],
      );
      manualMap = Object.fromEntries(manual.map((row) => [row.student_id, row.status]));
    } catch {
      manualMap = {};
    }

    let autoPresent = new Set();
    try {
      const dayStart = new Date(`${date}T00:00:00+03:00`);
      const dayEnd = new Date(`${date}T24:00:00+03:00`);
      const [autoActivity] = await pool.query(
        `SELECT DISTINCT student_id FROM student_activity
         WHERE course_id = ? AND created_at >= ? AND created_at < ?`,
        [courseId, dayStart, dayEnd],
      );
      autoPresent = new Set(autoActivity.map((row) => row.student_id));
    } catch {
      autoPresent = new Set();
    }

    const rows = students.map((student) => {
      const hasActivity = autoPresent.has(student.id);
      let status = 'absent';
      if (manualMap[student.id]) {
        status = manualMap[student.id];
      } else if (hasActivity) {
        status = 'present';
      }
      return {
        ...student,
        status,
        status_label: status === 'present' ? 'حاضر' : 'غائب',
        is_manual: Boolean(manualMap[student.id]) && !hasActivity,
        is_auto: status === 'present' && hasActivity,
      };
    });

    const present = rows.filter((row) => row.status === 'present').length;
    const total = rows.length;

    res.json({
      success: true,
      data: {
        course: courses[0],
        date,
        students: rows,
        stats: {
          total,
          present,
          absent: total - present,
          percent: total ? Math.round((present / total) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الحضور' });
  }
});

router.put('/courses/:courseId', async (req, res) => {
  const courseId = Number(req.params.courseId);
  const studentId = Number(req.body.student_id);
  const date = parseDate(req.body.date);
  const status = req.body.status;

  if (!studentId) {
    return res.status(400).json({ success: false, message: 'معرّف الطالب مطلوب' });
  }
  if (!['present', 'absent'].includes(status)) {
    return res.status(400).json({ success: false, message: 'حالة الحضور غير صالحة' });
  }

  try {
    const [enrolled] = await pool.query(
      'SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1',
      [studentId, courseId],
    );
    if (!enrolled.length) {
      return res.status(404).json({ success: false, message: 'الطالب غير مسجّل في هذا الكورس' });
    }

    await pool.query(
      `INSERT INTO course_attendance (course_id, student_id, attendance_date, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      [courseId, studentId, date, status],
    );

    res.json({
      success: true,
      data: {
        student_id: studentId,
        status,
        status_label: status === 'present' ? 'حاضر' : 'غائب',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث الحضور' });
  }
});

module.exports = router;
