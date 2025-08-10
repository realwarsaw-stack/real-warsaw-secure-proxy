export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if ((req.headers['x-admin-secret'] || '') !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const body = await getJsonBody(req);
    const { user_id, active } = body || {};
    if (!user_id || typeof active !== 'boolean') {
      res.status(400).json({ error: 'Provide user_id and active:boolean' });
      return;
    }
    const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/students?user_id=eq.${user_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ active })
    });
    const text = await resp.text();
    res.status(resp.status).setHeader('Content-Type','application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}

function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
