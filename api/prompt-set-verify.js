import { validatePaystackPromptSetTransaction } from './prompt-set-core.mjs';

const SUPABASE_URL = 'https://zcyxoucbglsyrqzqksjc.supabase.co';

async function supabaseRpc(name, body, secret) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: secret,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || 'Order service unavailable.');
  return payload;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const reference = typeof req.query.reference === 'string' ? req.query.reference : '';
  if (!/^ILP-[A-Za-z0-9]{32}$/.test(reference)) {
    return res.status(400).json({ error: 'Invalid prompt-set payment reference.' });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!paystackSecret || !supabaseSecret) {
    return res.status(503).json({ error: 'Prompt-set verification is not configured yet.' });
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
      headers: { Authorization: 'Bearer ' + paystackSecret }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.status !== true) {
      return res.status(502).json({ error: 'Could not verify payment with Paystack.' });
    }

    const verified = validatePaystackPromptSetTransaction(payload.data, reference);
    if (!verified.ok) {
      return res.status(402).json({ paid: false, error: 'Payment is not verified for this prompt-set order.' });
    }

    const markedPaid = await supabaseRpc('mark_identitylock_prompt_order_paid', {
      p_order_id: verified.orderId,
      p_paystack_reference: reference,
      p_transaction_id: verified.transactionId,
      p_amount_kobo: 50000,
      p_currency: 'NGN',
      p_paid_at: verified.paidAt
    }, supabaseSecret);

    if (markedPaid !== true) {
      return res.status(409).json({ paid: false, error: 'Payment could not be matched to its order.' });
    }

    return res.status(200).json({
      paid: true,
      product: 'identitylock-prompt-set',
      order_id: verified.orderId,
      prompt_count: 10
    });
  } catch (error) {
    console.error('Prompt-set verification failed:', error?.message || 'unknown error');
    return res.status(503).json({ error: 'Prompt-set verification is temporarily unavailable.' });
  }
}
