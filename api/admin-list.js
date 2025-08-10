export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if ((req.headers['x-admin-secret'] || '') !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/students?select=user_id,email,full_name,active,created_at&order=created_at.desc`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const text = await resp.text();
    res.status(resp.status).setHeader('Content-Type','application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
