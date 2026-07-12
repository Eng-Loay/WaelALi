const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');
const { hashPassword } = require('../../utils/password');

const router = express.Router();
router.use(authAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.name, s.email, s.phone, s.parent_phone, s.grade_id, s.created_at,
        g.name_ar AS grade_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) AS courses_count
      FROM students s
      LEFT JOIN grades g ON g.id = s.grade_id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: rows });
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

    await connection.query(
      `INSERT IGNORE INTO enrollments (student_id, course_id, progress, status)
       SELECT ?, id, 0, 'active' FROM courses WHERE grade_id = ?`,
      [studentId, Number(grade_id)],
    );

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

module.exports = router;
