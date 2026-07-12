const { verifyToken } = require('../utils/token');

function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'غير مصرح' });
  }

  try {
    req.admin = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'انتهت الجلسة، سجّل دخولك مرة أخرى' });
  }
}

module.exports = authAdmin;
