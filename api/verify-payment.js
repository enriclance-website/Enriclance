import crypto from 'crypto';
import { guardApi } from './_guard.js';

export default function handler(req, res) {
  if (guardApi(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay key secret not configured' });
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    return res.status(200).json({ verified: true });
  }

  console.warn('[Razorpay] Signature mismatch for payment:', razorpay_payment_id);
  return res.status(400).json({ verified: false, error: 'Invalid payment signature' });
}
