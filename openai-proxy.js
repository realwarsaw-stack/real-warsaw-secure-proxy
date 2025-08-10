export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
      return;
    }

    // 1) Verify Supabase user
    const userResp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    if (!userResp.ok) {
      const t = await userResp.text();
      res.status(401).json({ error: 'Invalid Supabase token', detail: t });
      return;
    }
    const user = await userResp.json();
    const userId = user.id;

    // 2) Check students table: active?
    const studentsResp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/students?user_id=eq.${userId}&select=active`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    if (!studentsResp.ok) {
      const t = await studentsResp.text();
      res.status(500).json({ error: 'Failed to query students table', detail: t });
      return;
    }
    const rows = await studentsResp.json();
    const active = rows?.[0]?.active === true;
    if (!active) {
      res.status(403).json({ error: 'Access revoked or not active' });
      return;
    }

    // 3) Proxy to OpenAI
    const body = await getJsonBody(req);
    const model = body.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const payload = { ...body, model };

    const oai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const text = await oai.text();
    res.status(oai.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err) });
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
