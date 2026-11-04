import { randomUUID } from 'node:crypto';
import { validatePromptSetCheckout } from './prompt-set-core.mjs';

const SUPABASE_URL = 'https://zcyxoucbglsyrqzqksjc.supabase.co';
const AMOUNT_KOBO = 50000;

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const input = validatePromptSetCheckout(req.body);
  if (!input.ok) return res.status(400).json({ error: input.error });

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!paystackSecret || !supabaseSecret) {
    return res.status(503).json({ error: 'Prompt-set checkout is not configured yet.' });
  }

  const reference = 'ILP-' + randomUUID().replace(/-/g, '');
  try {
    const orderId = await supabaseRpc('create_identitylock_prompt_order', {
      p_email: input.email,
      p_prompt_ids: input.promptIds,
      p_paystack_reference: reference
    }, supabaseSecret);

    if (typeof orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId)) {
      throw new Error('Order service returned an invalid order ID.');
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + paystackSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: input.email,
        amount: AMOUNT_KOBO,
        currency: 'NGN',
        reference,
        callback_url: 'https://identitylock-ai.vercel.app/prompt-success.html',
        metadata: {
          product: 'identitylock-prompt-set',
          product_name: 'IdentityLock AI — Choose Any 10 Prompts',
          order_id: orderId,
          prompt_count: 10,
          price_ngn: 500
        }
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.status !== true || !payload?.data?.authorization_url) {
      console.error('Prompt-set Paystack initialization rejected:', payload?.message || response.status);
      return res.status(502).json({ error: 'Paystack could not initialize this checkout. Please try again.' });
    }

    return res.status(200).json({
      authorization_url: payload.data.authorization_url,
      reference,
      amount_kobo: AMOUNT_KOBO,
      currency: 'NGN'
    });
  } catch (error) {
    console.error('Prompt-set checkout failed:', error?.message || 'unknown error');
    return res.status(503).json({ error: 'Prompt-set checkout is temporarily unavailable.' });
  }
}
