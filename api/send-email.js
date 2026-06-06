import nodemailer from 'nodemailer';

function buildOrderEmailHtml({ customerName, orderItems, orderTotal, paymentMethod, deliveryAddress, orderId }) {
  const rows = orderItems.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece5;font-size:14px;color:#3d3d2f">${item.name} (${item.volume})</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece5;text-align:center;font-size:14px;color:#3d3d2f">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece5;text-align:right;font-size:14px;font-weight:bold;color:#2d4c3a">₹${(item.unitPrice * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:Georgia,serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2d4c3a,#1e3528);border-radius:16px 16px 0 0;padding:32px;text-align:center">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:4px;text-transform:uppercase">Order Confirmed</p>
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:400">Thank you, ${customerName}!</h1>
      <p style="margin:12px 0 0;color:rgba(255,255,255,0.65);font-size:14px">Your Enriclance Adivasi Hair Oil is on its way.</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e8e2d9;border-top:none">

      <!-- Order Items -->
      <p style="margin:0 0 16px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c5a059;font-weight:bold">Your Order</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a9080;font-weight:normal">Product</th>
            <th style="text-align:center;padding-bottom:8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a9080;font-weight:normal">Qty</th>
            <th style="text-align:right;padding-bottom:8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a9080;font-weight:normal">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <!-- Total -->
      <div style="margin-top:16px;padding:16px;background:#f5f2ed;border-radius:12px;display:flex;justify-content:space-between">
        <div>
          <p style="margin:0;font-size:12px;color:#9a9080">Total (incl. GST)</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#2d4c3a">${orderTotal}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:12px;color:#9a9080">Payment</p>
          <p style="margin:4px 0 0;font-size:14px;color:#3d3d2f">${paymentMethod}</p>
          ${orderId !== 'COD' ? `<p style="margin:4px 0 0;font-size:10px;color:#c0b8ac;font-family:monospace">${orderId}</p>` : ''}
        </div>
      </div>

      <!-- Delivery -->
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #f0ece5">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c5a059;font-weight:bold">Delivery Address</p>
        <p style="margin:0;font-size:14px;color:#3d3d2f;line-height:1.6">${deliveryAddress}</p>
      </div>

      <!-- What's next -->
      <div style="margin-top:24px;padding:20px;background:#f5f2ed;border-radius:12px">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#2d4c3a;font-weight:bold">What Happens Next?</p>
        <p style="margin:0 0 6px;font-size:13px;color:#5a5a45"><span style="color:#c5a059;font-weight:bold">01 &nbsp;</span>Our team reviews and packs your order.</p>
        <p style="margin:0 0 6px;font-size:13px;color:#5a5a45"><span style="color:#c5a059;font-weight:bold">02 &nbsp;</span>Dispatch within 1–2 business days.</p>
        <p style="margin:0;font-size:13px;color:#5a5a45"><span style="color:#c5a059;font-weight:bold">03 &nbsp;</span>Tracking link sent via SMS/email once shipped.</p>
      </div>

      <!-- Footer -->
      <p style="margin:28px 0 0;text-align:center;font-size:12px;color:#c0b8ac">
        Questions? Reply to this email or contact us at
        <a href="mailto:enriclanceoil@gmail.com" style="color:#2d4c3a">enriclanceoil@gmail.com</a>
      </p>
      <p style="margin:8px 0 0;text-align:center;font-size:11px;color:#d4cec5">© 2025 Enriclance Adivasi Herbal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, customerName, orderItems, orderTotal, paymentMethod, deliveryAddress, orderId } = req.body;

  if (!to || !customerName || !orderItems || !orderTotal) {
    return res.status(400).json({ error: 'Missing required email fields' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const html = buildOrderEmailHtml({ customerName, orderItems, orderTotal, paymentMethod, deliveryAddress, orderId });

  try {
    await transporter.sendMail({
      from: `"Enriclance" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Order Confirmed — Enriclance Hair Oil (${orderId})`,
      html,
    });

    // BCC the business on every order
    await transporter.sendMail({
      from: `"Enriclance Orders" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `[New Order] ${customerName} — ${orderTotal} (${orderId})`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Email] Send failed:', err);
    return res.status(502).json({ error: 'Failed to send email', detail: err.message });
  }
}
