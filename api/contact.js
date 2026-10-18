// POST /api/contact — the contact page's form.
// Emails the team inbox (reply-to set to the sender). Two extras:
// - topic 'invoice' (a practice ordering several clinical units on account):
//   creates a DRAFT Stripe invoice for the team to review and send from the
//   Dashboard. Drafts are never sent automatically, so a public form can't be
//   used to make Stripe email strangers.
// - once MAIL_FROM is a verified Resend domain, the sender gets a short
//   acknowledgement.
import { stripe, EDITIONS, priceFor } from './_lib/stripe.js';
import { notifyTeam, sendEmail, canEmailCustomers, stamp } from './_lib/email.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = {
  question: 'General question',
  invoice: 'Practice order by invoice',
  support: 'Order or product support',
  press: 'Press',
  partnership: 'Partnership',
  other: 'Something else',
};
const ROLES = { patient: 'Patient', doctor: 'Doctor / clinician', practice: 'Practice manager', other: 'Other' };

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function draftPracticeInvoice({ email, name, org, quantity }) {
  const s = stripe();
  const price = await priceFor('clinical');
  const found = await s.customers.list({ email, limit: 1 });
  const customer = found.data[0] || await s.customers.create({
    email,
    name: org || name || undefined,
    metadata: { contact_name: name, source: 'contact form' },
  });
  const invoice = await s.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: 30,
    auto_advance: false,
    description: `${EDITIONS.clinical.productName} × ${quantity} — practice pre-order`,
    footer: 'flacara, a subsidiary of Lumo Imaging.',
    metadata: { edition: 'clinical', source: 'contact form' },
  });
  await s.invoiceItems.create({ customer: customer.id, invoice: invoice.id, pricing: { price: price.id }, quantity });
  return `https://dashboard.stripe.com/${invoice.livemode ? '' : 'test/'}invoices/${invoice.id}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const b = req.body || {};
  // honeypot: humans never see this field
  if (clean(b.website, 200)) return res.status(200).json({ ok: true });

  const email = clean(b.email, 254);
  const name = clean(b.name, 120);
  const org = clean(b.org, 160);
  const message = clean(b.message, 5000);
  const topic = TOPICS[b.topic] ? b.topic : 'other';
  const role = ROLES[b.role] ? b.role : 'other';
  const quantity = Math.min(500, Math.max(1, parseInt(b.quantity, 10) || 1));

  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!name) return res.status(400).json({ error: 'Please tell us your name.' });
  if (topic !== 'invoice' && message.length < 5) return res.status(400).json({ error: 'Please add a short message.' });

  let invoiceLink = null;
  let invoiceNote = null;
  if (topic === 'invoice') {
    try {
      invoiceLink = await draftPracticeInvoice({ email, name, org, quantity });
    } catch (err) {
      console.error('draft invoice failed', err);
      invoiceNote = 'Could not create the draft invoice automatically — create it by hand in Stripe.';
    }
  }

  const lines = [
    `From: ${name} <${email}>`,
    `Role: ${ROLES[role]}`,
    org ? `Practice/company: ${org}` : null,
    `Topic: ${TOPICS[topic]}`,
    topic === 'invoice' ? `Clinical units: ${quantity}` : null,
    invoiceLink ? `Draft invoice (review, then send): ${invoiceLink}` : null,
    invoiceNote,
    '',
    message || '(no message)',
  ].filter((l) => l !== null);

  try {
    await notifyTeam({
      subject: `flacara contact — ${TOPICS[topic]} — ${name} — ${stamp()}`,
      text: lines.join('\n'),
      replyTo: email,
    });
  } catch (err) {
    console.error('contact notify failed', err);
    return res.status(502).json({ error: 'Your message could not be sent. Please try again.' });
  }

  if (canEmailCustomers()) {
    const ack = topic === 'invoice'
      ? `Thanks, ${name}. We've got your request for ${quantity} clinical edition unit${quantity === 1 ? '' : 's'} and will send an invoice to this address shortly.`
      : `Thanks, ${name}. We've got your message and will reply to this address.`;
    sendEmail({ to: email, subject: 'We got your message — flacara', text: `${ack}\n\n— flacara` })
      .catch((err) => console.error('ack email failed', err));
  }

  return res.status(200).json({ ok: true, invoice: Boolean(invoiceLink) });
}
