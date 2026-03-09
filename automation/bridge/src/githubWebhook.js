import crypto from 'crypto';

/**
 * Verifica firma HMAC-SHA256 de GitHub Webhook.
 * @param {Buffer|string} rawBody - Body raw del request
 * @param {string} signature - Header x-hub-signature-256 (sha256=...)
 * @param {string} secret - GITHUB_WEBHOOK_SECRET
 * @returns {boolean}
 */
export function verifyGithubWebhook(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expected = 'sha256=' + hmac.digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}
