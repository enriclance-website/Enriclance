export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;

  if (!order) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  try {
    // Step 1: Authenticate with Shiprocket
    const tokenRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      return res.status(502).json({ error: 'Shiprocket auth failed', detail: err });
    }

    const { token } = await tokenRes.json();

    // Step 2: Create the order + shipment
    const shipRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: String(order.paymentId),
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary',
        channel_id: '',
        comment: 'Enriclance Adivasi Herbal Hair Oil',

        billing_customer_name: order.name,
        billing_last_name: '',
        billing_address: order.address,
        billing_address_2: '',
        billing_city: order.city,
        billing_pincode: String(order.pincode),
        billing_state: order.state || 'Kerala',
        billing_country: 'India',
        billing_email: order.email,
        billing_phone: String(order.phone),

        shipping_is_billing: true,

        order_items: order.items.map((item) => ({
          name: `${item.name} ${item.volume}`,
          sku: `ENRIC-${item.id}-${item.volume.replace(/\s/g, '')}`,
          units: item.quantity,
          selling_price: String(parseInt(String(item.price).replace(/[^0-9]/g, ''), 10)),
          discount: '',
          tax: '',
          hsn: '',
        })),

        payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: Number(order.total),

        length: 12,
        breadth: 8,
        height: 14,
        weight: parseFloat(
          order.items.reduce((sum, item) => {
            const vol = parseInt(item.volume, 10) || 250;
            return sum + (vol / 1000) * 1.15 * item.quantity;
          }, 0).toFixed(2)
        ),
      }),
    });

    const shipData = await shipRes.json();

    if (!shipRes.ok) {
      return res.status(502).json({ error: 'Shiprocket order creation failed', detail: shipData });
    }

    return res.status(200).json({
      success: true,
      shiprocket_order_id: shipData.order_id,
      shipment_id: shipData.shipment_id,
      awb_code: shipData.awb_code,
      courier_name: shipData.courier_name,
      tracking_url: shipData.tracking_url || null,
    });

  } catch (err) {
    console.error('Shiprocket integration error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
