const crypto = require('crypto');

/** Stable fallback — never change this string or existing sessions break when .env lacks JWT_SECRET. */
const DEFAULT_SECRET = 'wael-ali-math-dev-secret-change-in-production';

function getSecret() {
  const fromEnv = (process.env.JWT_SECRET || '').trim();
  return fromEnv || DEFAULT_SECRET;
}

function getExpiryHours(explicitHours) {
  if (explicitHours != null && Number.isFinite(Number(explicitHours))) {
    return Number(explicitHours);
  }
  const fromEnv = Number(process.env.JWT_EXPIRES_HOURS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  // 30 days — survives restarts/deploys without forcing re-login every day
  return 24 * 30;
}

function signToken(payload, expiresInHours) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const hours = getExpiryHours(expiresInHours);
  const { iat: _iat, exp: _exp, ...safePayload } = payload || {};
  const body = { ...safePayload, iat: now, exp: now + hours * 3600 };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedBody = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token) {
  const [encodedHeader, encodedBody, signature] = String(token || '').split('.');
  if (!encodedHeader || !encodedBody || !signature) throw new Error('invalid token');
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  if (signature !== expected) throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
  return payload;
}

module.exports = { signToken, verifyToken, getExpiryHours };
