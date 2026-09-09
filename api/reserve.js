const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, org, source } = req.body || {};

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const lines = [
    `Email: ${email}`,
    org ? `Practice/company: ${org}` : null,
    source ? `Source page: ${source}` : null,
  ].filter(Boolean);

  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const subject = `New Flacara pre-order — ${email} — ${stamp} UTC`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Flacara Pre-orders <onboarding@resend.dev>',
        to: [process.env.NOTIFY_EMAIL],
        reply_to: email,
        subject,
        text: lines.join('\n'),
      }),
    });

    if (!r.ok) {
      const body = await r.text();
      console.error('Resend error', r.status, body);
      return res.status(502).json({ error: 'Failed to send notification' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Reserve handler error', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
