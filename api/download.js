import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method not allowed');
  const reference = String(req.query.reference || '');
  if (!/^[a-zA-Z0-9.=\-_]{5,100}$/.test(reference)) return res.status(400).end('Invalid payment reference');
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(503).end('Payment delivery is not configured');
  try {
    const response = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), { headers: { Authorization: 'Bearer ' + secret } });
    const payload = await response.json();
    const transaction = payload?.data;
    const verified = response.ok && payload?.status === true && transaction?.status === 'success' && transaction?.currency === 'NGN' && Number(transaction?.amount) === 50000 && transaction?.metadata?.product === 'identitylock-ai';
    if (!verified) return res.status(403).end('Verified purchase required');
    const file = path.join(process.cwd(), '.private-assets', 'IdentityLock_AI_Complete_Bundle.zip');
    if (!fs.existsSync(file)) return res.status(503).end('Product bundle is temporarily unavailable');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="IdentityLock_AI_Complete_Bundle.zip"');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return fs.createReadStream(file).pipe(res);
  } catch { return res.status(500).end('Secure delivery is temporarily unavailable'); }
}