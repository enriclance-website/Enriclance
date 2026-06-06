import { guardDebug } from './_guard.js';

export default async function handler(req, res) {
  if (guardDebug(req, res)) return;
  const keyId = process.env.VITE_RAZORPAY_KEY || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  const maskedKeyId = keyId ? `${keyId.slice(0, 14)}...` : 'NOT SET';
  const maskedSecret = keySecret ? `${keySecret.slice(0, 4)}${'*'.repeat(keySecret.length - 4)}` : 'NOT SET';
  const keyMode = keyId.startsWith('rzp_live_') ? 'LIVE' : keyId.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN';

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  // Try creating a ₹1 order to verify credentials actually work
  const testRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: 100, currency: 'INR', receipt: 'debug_test' }),
  });

  const testData = await testRes.json();

  return res.status(200).json({
    key_id: maskedKeyId,
    key_secret_set: keySecret ? 'YES' : 'NO',
    key_secret_masked: maskedSecret,
    key_mode: keyMode,
    razorpay_auth_status: testRes.ok ? 'SUCCESS' : 'FAILED',
    razorpay_response: testRes.ok
      ? { order_id: testData.id, amount: testData.amount }
      : testData,
  });
}
