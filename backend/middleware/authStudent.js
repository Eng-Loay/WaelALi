const { verifyToken } = require('../utils/token');

function authStudent(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'غير مصرح' });
  }

  try {
    const payload = verifyToken(header.slice(7));
    if (payload.role !== 'student') {
      return res.status(403).json({ success: false, message: 'غير مصرح للطلاب فقط' });
    }
    req.student = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'انتهت الجلسة، سجّل دخولك مرة أخرى' });
  }
}

module.exports = authStudent;
