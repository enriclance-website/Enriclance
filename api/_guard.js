const ALLOWED_ORIGINS = ['https://www.enriclance.in', 'https://enriclance.in'];

export function guardApi(req, res) {
  const origin = req.headers['origin'] || req.headers['referer'] || '';
  const secret = req.headers['x-api-secret'];
  const apiSecret = process.env.API_SECRET;

  // Always set CORS headers
  const originAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  res.setHeader('Access-Control-Allow-Origin', originAllowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-secret');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // handled
  }

  if (!apiSecret) return false; // secret not configured — skip guard in dev

  if (secret !== apiSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return true; // handled (blocked)
  }

  return false; // allowed — continue
}

export function guardDebug(req, res) {
  const apiSecret = process.env.API_SECRET;
  if (!apiSecret) return false;

  // Parse query string manually — req.query may not be populated in all Vercel runtimes
  const url = new URL(req.url, 'https://placeholder.com');
  const providedKey = url.searchParams.get('key') || req.query?.key || '';

  if (providedKey !== apiSecret) {
    res.status(401).json({
      error: 'Unauthorized — append ?key=<API_SECRET> to access this endpoint',
      received_length: providedKey.length,
      expected_length: apiSecret.length,
    });
    return true;
  }
  return false;
}
