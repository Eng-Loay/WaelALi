const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');
const { hashPassword } = require('../../utils/password');
const { ACTIVITY_LABELS } = require('../../utils/studentActivity');

const router = express.Router();
router.use(authAdmin);

router.get('/', async (req, res) => {
  try {
    const courseId = req.query.course_id ? Number(req.query.course_id) : null;
    let query;
    const params = [];

    if (courseId) {
      query = `
        SELECT s.id, s.name, s.email, s.phone, s.parent_phone, s.grade_id, s.created_at,
          g.name_ar AS grade_name,
          (SELECT COUNT(*) FROM enrollments en WHERE en.student_id = s.id) AS courses_count,
          e.progress AS course_progress,
          e.status AS enrollment_status,
          (SELECT MAX(sa.created_at) FROM student_activity sa
            WHERE sa.student_id = s.id AND sa.course_id = ?
          ) AS last_activity_at,
          (SELECT COUNT(*) FROM student_activity sa
            WHERE sa.student_id = s.id AND sa.course_id = ?
          ) AS activity_count
        FROM students s
        LEFT JOIN grades g ON g.id = s.grade_id
        INNER JOIN enrollments e ON e.student_id = s.id AND e.course_id = ?
        ORDER BY s.created_at DESC
      `;
      params.push(courseId, courseId, courseId);
    } else {
      query = `
        SELECT s.id, s.name, s.email, s.phone, s.parent_phone, s.grade_id, s.created_at,
          g.name_ar AS grade_name,
          (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) AS courses_count
        FROM students s
        LEFT JOIN grades g ON g.id = s.grade_id
        ORDER BY s.created_at DESC
      `;
    }

    const [rows] = await pool.query(query, params);
    const data = rows.map((row) => ({
      ...row,
      attendance: courseId ? (Number(row.activity_count) > 0 ? 'present' : 'absent') : null,
      attendance_label: courseId ? (Number(row.activity_count) > 0 ? 'حاضر' : 'غائب') : null,
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الطلاب' });
  }
});

router.post('/', async (req, res) => {
  const {
    name,
    email,
    phone,
    parent_phone,
    password,
    grade_id,
    course_id,
  } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'اسم الطالب مطلوب' });
  }
  if (!email?.trim()) {
    return res.status(400).json({ success: false, message: 'بريد الطالب مطلوب' });
  }
  if (!parent_phone?.trim()) {
    return res.status(400).json({ success: false, message: 'رقم ولي الأمر مطلوب' });
  }
  if (!grade_id) {
    return res.status(400).json({ success: false, message: 'اختار الصف الدراسي' });
  }
  if (!course_id) {
    return res.status(400).json({ success: false, message: 'اختار الكورس' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'كلمة المرور لازم تكون 6 أحرف على الأقل' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await connection.query(
      'SELECT id FROM students WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail],
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'البريد مستخدم بالفعل' });
    }

    const password_hash = hashPassword(password);
    const [result] = await connection.query(
      `INSERT INTO students (name, email, phone, parent_phone, password_hash, grade_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        normalizedEmail,
        phone?.trim() || null,
        String(parent_phone).trim(),
        password_hash,
        Number(grade_id),
      ],
    );

    const studentId = result.insertId;

    // Enroll only in the course selected by admin (not every course in the grade)
    if (course_id) {
      await connection.query(
        `INSERT INTO enrollments (student_id, course_id, progress, status)
         VALUES (?, ?, 0, 'active')
         ON DUPLICATE KEY UPDATE status = 'active'`,
        [studentId, Number(course_id)],
      );
    }

    const [rows] = await connection.query(
      `SELECT s.id, s.name, s.email, s.phone, s.parent_phone, s.grade_id, s.created_at,
        g.name_ar AS grade_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) AS courses_count
       FROM students s
       LEFT JOIN grades g ON g.id = s.grade_id
       WHERE s.id = ?
       LIMIT 1`,
      [studentId],
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'تم إضافة الطالب بنجاح',
      data: rows[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إضافة الطالب' });
  } finally {
    connection.release();
  }
});

router.get('/lookup', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, message: 'اكتب بريد الطالب' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, s.phone, g.name_ar AS grade_name
       FROM students s
       LEFT JOIN grades g ON g.id = s.grade_id
       WHERE LOWER(s.email) = ?
       LIMIT 1`,
      [email],
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'مفيش طالب بالبريد ده' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل البحث عن الطالب' });
  }
});

router.post('/enroll', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const courseId = Number(req.body.course_id);

  if (!email) {
    return res.status(400).json({ success: false, message: 'بريد الطالب مطلوب' });
  }
  if (!courseId) {
    return res.status(400).json({ success: false, message: 'اختار الدورة' });
  }

  try {
    const [students] = await pool.query(
      'SELECT id, name, email FROM students WHERE LOWER(email) = ? LIMIT 1',
      [email],
    );
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'مفيش طالب بالبريد ده' });
    }

    const [courses] = await pool.query(
      'SELECT id, title_ar FROM courses WHERE id = ? LIMIT 1',
      [courseId],
    );
    if (!courses.length) {
      return res.status(404).json({ success: false, message: 'الدورة غير موجودة' });
    }

    const student = students[0];
    const course = courses[0];

    await pool.query(
      `INSERT INTO enrollments (student_id, course_id, progress, status)
       VALUES (?, ?, 0, 'active')
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [student.id, course.id],
    );

    res.status(201).json({
      success: true,
      message: `تم تسجيل ${student.name} في ${course.title_ar}`,
      data: { student, course },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تسجيل الطالب في الدورة' });
  }
});

router.get('/:id', async (req, res) => {
  const studentId = Number(req.params.id);
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'معرّف الطالب غير صالح' });
  }

  try {
    const [students] = await pool.query(
      `SELECT s.*, g.name_ar AS grade_name
       FROM students s
       LEFT JOIN grades g ON g.id = s.grade_id
       WHERE s.id = ?
       LIMIT 1`,
      [studentId],
    );
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    }
    const student = students[0];
    delete student.password_hash;

    const [enrollments] = await pool.query(
      `SELECT e.*, c.title_ar AS course_title, c.title_en AS course_title_en,
        (SELECT COUNT(*) FROM course_lessons cl WHERE cl.course_id = c.id) AS lessons_total,
        (SELECT COUNT(DISTINCT sa.lesson_id) FROM student_activity sa
          WHERE sa.student_id = e.student_id AND sa.course_id = e.course_id AND sa.lesson_id IS NOT NULL
        ) AS lessons_opened,
        (SELECT MAX(sa.created_at) FROM student_activity sa
          WHERE sa.student_id = e.student_id AND sa.course_id = e.course_id
        ) AS last_activity_at,
        (SELECT COUNT(*) FROM student_activity sa
          WHERE sa.student_id = e.student_id AND sa.course_id = e.course_id
        ) AS activity_count
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId],
    );

    const coursesWithAttendance = enrollments.map((row) => ({
      ...row,
      attendance: row.activity_count > 0 ? 'present' : 'absent',
      attendance_label: row.activity_count > 0 ? 'حاضر' : 'غائب',
    }));

    let submissions = [];
    try {
      const [subRows] = await pool.query(
        `SELECT sub.*, a.title_ar AS assignment_title, a.course_id, c.title_ar AS course_title
         FROM assignment_submissions sub
         JOIN assignments a ON a.id = sub.assignment_id
         LEFT JOIN courses c ON c.id = a.course_id
         WHERE sub.student_id = ?
         ORDER BY sub.updated_at DESC`,
        [studentId],
      );
      submissions = subRows.map((row) => ({
        ...row,
        answers: typeof row.answers_json === 'string'
          ? JSON.parse(row.answers_json || '{}')
          : (row.answers_json || {}),
      }));
    } catch {
      submissions = [];
    }

    let activity = [];
    try {
      const [actRows] = await pool.query(
        `SELECT sa.*, c.title_ar AS course_title, cl.title_ar AS lesson_title
         FROM student_activity sa
         LEFT JOIN courses c ON c.id = sa.course_id
         LEFT JOIN course_lessons cl ON cl.id = sa.lesson_id
         WHERE sa.student_id = ?
         ORDER BY sa.created_at DESC
         LIMIT 100`,
        [studentId],
      );
      activity = actRows.map((row) => ({
        ...row,
        activity_label: ACTIVITY_LABELS[row.activity_type] || row.activity_type,
      }));
    } catch {
      activity = [];
    }

    const stats = {
      courses_count: enrollments.length,
      present_courses: coursesWithAttendance.filter((c) => c.attendance === 'present').length,
      assignments_submitted: submissions.length,
      activity_total: activity.length,
    };

    res.json({
      success: true,
      data: {
        student,
        enrollments: coursesWithAttendance,
        submissions,
        activity,
        stats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل تفاصيل الطالب' });
  }
});

module.exports = router;
