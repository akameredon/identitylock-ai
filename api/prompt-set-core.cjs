const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

function validatePromptSetCheckout(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid checkout request.' };
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  const ids = body.prompt_ids;
  if (!Array.isArray(ids) || ids.length !== 10 || !ids.every(isUuid)) {
    return { ok: false, error: 'Choose exactly 10 valid prompts.' };
  }
  const normalized = ids.map(id => id.toLowerCase());
  if (new Set(normalized).size !== 10) {
    return { ok: false, error: 'Choose 10 different prompts.' };
  }
  return { ok: true, email, promptIds: normalized };
}

function readMetadata(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function validatePaystackPromptSetTransaction(transaction, expectedReference) {
  if (!transaction || typeof transaction !== 'object') return { ok: false, error: 'Missing transaction data.' };
  const metadata = readMetadata(transaction.metadata);
  const orderId = metadata?.order_id;
  const valid = transaction.status === 'success'
    && transaction.reference === expectedReference
    && Number(transaction.amount) === 50000
    && transaction.currency === 'NGN'
    && metadata?.product === 'identitylock-prompt-set'
    && isUuid(orderId)
    && (typeof transaction.id === 'number' || (typeof transaction.id === 'string' && /^\d+$/.test(transaction.id)));
  if (!valid) return { ok: false, error: 'Payment does not match this prompt-set order.' };
  return {
    ok: true,
    orderId: orderId.toLowerCase(),
    transactionId: String(transaction.id),
    paidAt: transaction.paid_at || new Date().toISOString()
  };
}

module.exports = { isUuid, validatePromptSetCheckout, validatePaystackPromptSetTransaction };
