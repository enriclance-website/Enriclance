import nodemailer from 'nodemailer';

import { guardDebug } from './_guard.js';

export default async function handler(req, res) {
  if (guardDebug(req, res)) return;
  const user = process.env.GMAIL_USER || '';
  const pass = process.env.GMAIL_APP_PASSWORD || '';

  const maskedUser = user || 'NOT SET';
  const maskedPass = pass ? `${pass.slice(0, 2)}${'*'.repeat(pass.length - 2)}` : 'NOT SET';

  if (!user || !pass) {
    return res.status(200).json({
      status: 'FAILED',
      reason: 'Credentials not set in environment variables',
      GMAIL_USER: maskedUser,
      GMAIL_APP_PASSWORD: maskedPass,
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    return res.status(200).json({
      status: 'OK',
      GMAIL_USER: maskedUser,
      GMAIL_APP_PASSWORD: maskedPass,
      message: 'Gmail SMTP connection verified successfully',
    });
  } catch (err) {
    return res.status(200).json({
      status: 'FAILED',
      GMAIL_USER: maskedUser,
      GMAIL_APP_PASSWORD: maskedPass,
      error: err.message,
      hint: err.message.includes('Invalid login')
        ? 'App Password is wrong or 2FA is not enabled on the Gmail account'
        : err.message.includes('Username and Password not accepted')
        ? 'App Password rejected — regenerate it from myaccount.google.com → Security → App Passwords'
        : 'Check credentials and try again',
    });
  }
}
