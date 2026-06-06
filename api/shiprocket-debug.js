import { guardDebug } from './_guard.js';

export default async function handler(req, res) {
  if (guardDebug(req, res)) return;
  const email = process.env.SHIPROCKET_EMAIL || '';
  const password = process.env.SHIPROCKET_PASSWORD || '';

  // Show masked credentials so user can confirm they're correct
  const maskedEmail = email
    ? email.slice(0, 5) + '***' + email.slice(email.indexOf('@'))
    : 'NOT SET';
  const maskedPassword = password
    ? password.slice(0, 2) + '*'.repeat(Math.max(0, password.length - 2))
    : 'NOT SET';

  const body = JSON.stringify({ email, password });

  const tokenRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.token) {
    return res.status(200).json({
      status: 'FAILED',
      http_status: tokenRes.status,
      shiprocket_response: tokenData,
      credentials_being_used: {
        email: maskedEmail,
        password: maskedPassword,
        password_length: password.length,
      },
      hint: tokenRes.status === 403
        ? 'Possible causes: (1) Email not verified after password reset — check inbox. (2) Wrong email — confirm the masked email above matches your Shiprocket account. (3) Account suspended or not activated.'
        : 'Unexpected error from Shiprocket.',
    });
  }

  // Auth OK — fetch pickup locations
  const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
    headers: { Authorization: `Bearer ${tokenData.token}` },
  });
  const pickupData = await pickupRes.json();

  return res.status(200).json({
    status: 'OK',
    credentials_being_used: { email: maskedEmail },
    pickup_locations: pickupData?.data?.shipping_address?.map(a => ({
      id: a.id,
      pickup_location: a.pickup_location,
      address: `${a.address}, ${a.city}, ${a.state} - ${a.pin_code}`,
    })) || pickupData,
  });
}
