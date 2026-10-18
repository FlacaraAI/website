// Outgoing email through Resend. Used by the contact form and by the Stripe
// webhook's order notifications.
const FROM = () => process.env.MAIL_FROM || 'flacara <onboarding@resend.dev>';

export async function sendEmail({ to, subject, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM(),
      to: Array.isArray(to) ? to : [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      text,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

// the team inbox (NOTIFY_EMAIL)
export function notifyTeam(msg) {
  return sendEmail({ to: process.env.NOTIFY_EMAIL, ...msg });
}

// Replies to the person who wrote in. Resend's shared onboarding sender can
// only deliver to the account owner, so this only runs once MAIL_FROM is an
// address on a domain verified in Resend.
export function canEmailCustomers() {
  return Boolean(process.env.MAIL_FROM) && !/resend\.dev/i.test(process.env.MAIL_FROM);
}

export function stamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}
