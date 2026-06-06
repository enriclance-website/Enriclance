import nodemailer from 'nodemailer';
import { guardApi } from './_guard.js';

export default async function handler(req, res) {
  if (guardApi(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const businessHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;background:#f5f2ed;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e2d9">
    <div style="background:#2d4c3a;padding:24px 28px">
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:4px;text-transform:uppercase">New Enquiry</p>
      <h2 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:400">From ${name}</h2>
    </div>
    <div style="padding:28px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;font-size:12px;color:#9a9080;text-transform:uppercase;letter-spacing:2px">Name</td><td style="padding:8px 0;font-size:14px;color:#3d3d2f;text-align:right">${name}</td></tr>
        <tr><td style="padding:8px 0;font-size:12px;color:#9a9080;text-transform:uppercase;letter-spacing:2px">Email</td><td style="padding:8px 0;font-size:14px;color:#3d3d2f;text-align:right"><a href="mailto:${email}" style="color:#2d4c3a">${email}</a></td></tr>
        <tr><td style="padding:8px 0;font-size:12px;color:#9a9080;text-transform:uppercase;letter-spacing:2px">Phone</td><td style="padding:8px 0;font-size:14px;color:#3d3d2f;text-align:right"><a href="tel:${phone}" style="color:#2d4c3a">${phone}</a></td></tr>
      </table>
      ${message ? `
      <div style="margin-top:20px;padding:16px;background:#f5f2ed;border-radius:12px">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c5a059;font-weight:bold">Message</p>
        <p style="margin:0;font-size:14px;color:#3d3d2f;line-height:1.7">${message}</p>
      </div>` : ''}
      <p style="margin:24px 0 0;font-size:12px;color:#c0b8ac">Reply directly to this email to respond to the customer.</p>
    </div>
  </div>
</body>
</html>`;

  const customerHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;background:#f5f2ed;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e2d9">
    <div style="background:linear-gradient(135deg,#2d4c3a,#1e3528);padding:32px;text-align:center">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:4px;text-transform:uppercase">Enquiry Received</p>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:400">Thank you, ${name}!</h1>
    </div>
    <div style="padding:28px;text-align:center">
      <p style="font-size:15px;color:#5a5a45;line-height:1.7">We've received your enquiry and will get back to you within <strong style="color:#2d4c3a">24 hours</strong>.</p>
      <p style="font-size:13px;color:#9a9080">In the meantime, feel free to browse our products at enriclance.com</p>
      <p style="margin-top:28px;font-size:12px;color:#c0b8ac">© 2025 Enriclance Adivasi Herbal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await Promise.all([
      // Notify the business
      transporter.sendMail({
        from: `"Enriclance Website" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        replyTo: email,
        subject: `[Enquiry] ${name} — ${phone}`,
        html: businessHtml,
      }),
      // Auto-reply to the customer
      transporter.sendMail({
        from: `"Enriclance" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'We received your enquiry — Enriclance',
        html: customerHtml,
      }),
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Enquiry] Email send failed:', err);
    return res.status(502).json({ error: 'Failed to send enquiry', detail: err.message });
  }
}
