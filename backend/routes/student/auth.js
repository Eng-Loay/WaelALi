const express = require('express');
const pool = require('../../config/db');
const { signToken, verifyToken } = require('../../utils/token');
const { hashPassword, verifyPassword } = require('../../utils/password');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, phone, parent_phone, password, grade_id } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'الاسم والبريد وكلمة المرور مطلوبين' });
  }
  if (!parent_phone || !String(parent_phone).trim()) {
    return res.status(400).json({ success: false, message: 'رقم ولي الأمر مطلوب للتسجيل' });
  }
  if (!grade_id) {
    return res.status(400).json({ success: false, message: 'الصف الدراسي مطلوب' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'كلمة المرور لازم تكون 6 أحرف على الأقل' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM students WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'البريد مستخدم بالفعل' });
    }

    const password_hash = hashPassword(password);
    const [result] = await pool.query(
      `INSERT INTO students (name, email, phone, parent_phone, password_hash, grade_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, String(parent_phone).trim(), password_hash, grade_id],
    );

    // Auto-enroll featured courses for the selected grade (or all featured)
    if (grade_id) {
      await pool.query(
        `INSERT IGNORE INTO enrollments (student_id, course_id, progress, status)
         SELECT ?, id, 0, 'active' FROM courses WHERE grade_id = ?`,
        [result.insertId, grade_id],
      );
    } else {
      await pool.query(
        `INSERT IGNORE INTO enrollments (student_id, course_id, progress, status)
         SELECT ?, id, FLOOR(RAND()*40), 'active' FROM courses WHERE is_featured = TRUE LIMIT 3`,
        [result.insertId],
      );
    }

    const user = {
      id: result.insertId,
      name,
      email,
      phone: phone || null,
      parent_phone: String(parent_phone).trim(),
      grade_id,
      role: 'student',
    };
    const token = signToken(user);

    res.status(201).json({
      success: true,
      data: { accessToken: token, user },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إنشاء الحساب' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'البريد وكلمة المرور مطلوبان' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE email = ? LIMIT 1', [email]);
    const student = rows[0];
    if (!student || !verifyPassword(password, student.password_hash)) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const user = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      parent_phone: student.parent_phone,
      grade_id: student.grade_id,
      role: 'student',
    };
    const token = signToken(user);
    res.json({ success: true, data: { accessToken: token, user } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false });
  }
  try {
    const payload = verifyToken(header.slice(7));
    if (payload.role !== 'student') return res.status(403).json({ success: false });
    res.json({ success: true, data: { user: payload } });
  } catch {
    res.status(401).json({ success: false });
  }
});

module.exports = router;
