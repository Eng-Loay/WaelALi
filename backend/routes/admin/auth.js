const express = require('express');
const { signToken, verifyToken } = require('../../utils/token');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@waelalimath.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'مستر وائل علي';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'البريد وكلمة المرور مطلوبان' });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
  }

  const user = { id: 1, email: ADMIN_EMAIL, name: ADMIN_NAME, role: 'admin' };
  const token = signToken(user);

  res.json({
    success: true,
    data: { accessToken: token, user },
  });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false });
  }
  try {
    const payload = verifyToken(header.slice(7));
    res.json({ success: true, data: { user: payload } });
  } catch {
    res.status(401).json({ success: false });
  }
});

module.exports = router;
