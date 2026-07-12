const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'wael-ali-math-dev-secret-change-in-production';

function signToken(payload, expiresInHours = 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInHours * 3600 };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedBody = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token) {
  const [encodedHeader, encodedBody, signature] = token.split('.');
  if (!encodedHeader || !encodedBody || !signature) throw new Error('invalid token');
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  if (signature !== expected) throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
  return payload;
}

module.exports = { signToken, verifyToken };
