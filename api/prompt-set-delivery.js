const SUPABASE_URL = 'https://zcyxoucbglsyrqzqksjc.supabase.co';

async function supabaseRpc(name, body, secret) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: secret, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || 'Delivery service unavailable.');
  return payload;
}

export default async function handler(req, res) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Avoid Vercel's legacy req.query getter, which internally calls url.parse().
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const reference = requestUrl.searchParams.get('reference') || '';
  if (!/^ILP-[A-Za-z0-9]{32}$/.test(reference)) {
    return res.status(400).json({ error: 'Invalid prompt-set payment reference.' });
  }

  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseSecret) return res.status(503).json({ error: 'Prompt delivery is not configured yet.' });

  try {
    const delivery = await supabaseRpc('get_identitylock_prompt_order_delivery', { p_paystack_reference: reference }, supabaseSecret);
    const items = Array.isArray(delivery?.items) ? delivery.items : [];
    const validItems = items.length === 10 && items.every((item, index) =>
      item && Number(item.position) === index + 1 && typeof item.title === 'string'
      && typeof item.slug === 'string' && typeof item.prompt_text === 'string' && item.prompt_text.trim().length > 0
    );
    if (!delivery || !validItems) return res.status(404).json({ error: 'No verified paid prompt set was found for this reference.' });
    return res.status(200).json({
      delivered: true, prompt_count: 10, paid_at: delivery.paid_at,
      items: items.map(item => ({ position: Number(item.position), title: item.title, slug: item.slug, prompt_text: item.prompt_text }))
    });
  } catch (error) {
    console.error('Prompt-set delivery failed:', error?.message || 'unknown error');
    return res.status(503).json({ error: 'Your prompts are temporarily unavailable. Please refresh in a moment.' });
  }
}
