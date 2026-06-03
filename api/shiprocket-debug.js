export default async function handler(req, res) {
  // Step 1: Test auth
  const tokenRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.token) {
    return res.status(200).json({
      step: 'auth',
      status: 'FAILED',
      detail: tokenData,
      env_email_set: !!process.env.SHIPROCKET_EMAIL,
      env_password_set: !!process.env.SHIPROCKET_PASSWORD,
    });
  }

  // Step 2: Fetch pickup locations
  const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
    headers: { Authorization: `Bearer ${tokenData.token}` },
  });
  const pickupData = await pickupRes.json();

  return res.status(200).json({
    step: 'auth',
    status: 'OK',
    pickup_locations: pickupData?.data?.shipping_address?.map(a => ({
      id: a.id,
      pickup_location: a.pickup_location,
      address: `${a.address}, ${a.city}, ${a.state} - ${a.pin_code}`,
    })) || pickupData,
  });
}
