import { guardApi } from './_guard.js';

export default async function handler(req, res) {
  if (guardApi(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount (in INR) is required' });
  }

  const keyId = process.env.VITE_RAZORPAY_KEY;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({
      error: 'Razorpay credentials not configured',
      keyId: keyId ? `${keyId.slice(0, 12)}...` : 'NOT SET',
      keySecret: keySecret ? 'SET' : 'NOT SET',
    });
  }

  // Warn if key modes don't match (test vs live)
  const keyIdMode = keyId.startsWith('rzp_live_') ? 'live' : 'test';
  console.log(`[Razorpay] key_id mode: ${keyIdMode}, amount: ₹${amount}`);

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const razorRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: `enric_${Date.now()}`,
      }),
    });

    const data = await razorRes.json();

    if (!razorRes.ok) {
      console.error('[Razorpay] Order creation failed:', data);
      return res.status(502).json({ error: 'Razorpay order creation failed', detail: data });
    }

    return res.status(200).json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (err) {
    console.error('[Razorpay] Network error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
