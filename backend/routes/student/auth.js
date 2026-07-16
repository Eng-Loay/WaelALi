const express = require('express');
const pool = require('../../config/db');
const { signToken, verifyToken } = require('../../utils/token');
const { hashPassword, verifyPassword } = require('../../utils/password');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, phone, parent_phone, governorate, address, password, grade_id } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'الاسم والبريد وكلمة المرور مطلوبين' });
  }
  if (!parent_phone || !String(parent_phone).trim()) {
    return res.status(400).json({ success: false, message: 'رقم ولي الأمر مطلوب للتسجيل' });
  }
  if (!governorate || !String(governorate).trim()) {
    return res.status(400).json({ success: false, message: 'المحافظة مطلوبة' });
  }
  if (!address || !String(address).trim()) {
    return res.status(400).json({ success: false, message: 'العنوان مطلوب' });
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
      `INSERT INTO students (name, email, phone, parent_phone, governorate, address, password_hash, grade_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone || null,
        String(parent_phone).trim(),
        String(governorate).trim(),
        String(address).trim(),
        password_hash,
        grade_id,
      ],
    );

    // Registration does not auto-enroll — student (or admin) picks courses later
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
    return res.status(401).json({ success: false, message: 'انتهت الجلسة، سجّل دخولك مرة أخرى' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    if (payload.role !== 'student') return res.status(403).json({ success: false });
    const user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      parent_phone: payload.parent_phone,
      grade_id: payload.grade_id,
      role: 'student',
    };
    const accessToken = signToken(user);
    res.json({ success: true, data: { user, accessToken } });
  } catch {
    res.status(401).json({ success: false, message: 'انتهت الجلسة، سجّل دخولك مرة أخرى' });
  }
});

module.exports = router;
