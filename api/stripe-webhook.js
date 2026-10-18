// POST /api/stripe-webhook — Stripe's event endpoint. Every event is
// signature-checked against STRIPE_WEBHOOK_SECRET before it is trusted.
// Fulfilment lives here: an order only counts once its payment is in.
import { stripe, EDITIONS } from './_lib/stripe.js';
import { notifyTeam, stamp } from './_lib/email.js';

// verification needs the exact bytes Stripe signed, so read the raw stream
export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

const money = (cents, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format((cents || 0) / 100);

function addressLines(a) {
  if (!a) return [];
  return [a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(' '), a.country].filter(Boolean);
}

async function fulfil(sessionId) {
  // re-read from Stripe rather than trusting the event body, and pull the items
  const s = await stripe().checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
  if (s.payment_status === 'unpaid') return; // async methods: wait for async_payment_succeeded

  // record the final quantity so the founder allowance counts units, not orders
  if (s.metadata?.founder === 'true' && s.payment_intent) {
    const units = (s.line_items?.data || []).reduce((n, li) => n + (li.quantity || 0), 0);
    await stripe().paymentIntents.update(
      typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent.id,
      { metadata: { founder_units: String(units) } },
    );
  }

  const ed = EDITIONS[s.metadata?.edition];
  const who = ed?.audience === 'doctor' ? 'Doctor' : ed?.audience === 'patient' ? 'Patient' : 'Unknown';
  const items = (s.line_items?.data || []).map((li) => `  ${li.quantity} × ${li.description} — ${money(li.amount_total, s.currency)}`);
  const ship = s.collected_information?.shipping_details || s.shipping_details;
  const practice = (s.custom_fields || []).find((f) => f.key === 'practice')?.text?.value;
  const email = s.customer_details?.email;

  const lines = [
    `Paid: ${money(s.amount_total, s.currency)} (${s.payment_status})`,
    `Who: ${who}${s.metadata?.founder === 'true' ? ' (founder price)' : ''}`,
    `Email: ${email || '—'}`,
    s.customer_details?.phone ? `Phone: ${s.customer_details.phone}` : null,
    practice ? `Practice: ${practice}` : null,
    '',
    'Items:',
    ...items,
    '',
    'Ship to:',
    ...(ship ? [`  ${ship.name}`, ...addressLines(ship.address).map((l) => `  ${l}`)] : ['  —']),
    '',
    `Stripe: https://dashboard.stripe.com/${s.livemode ? '' : 'test/'}checkout/sessions/${s.id}`,
  ].filter((l) => l !== null);

  await notifyTeam({
    subject: `New flacara order — ${who} — ${money(s.amount_total, s.currency)} — ${stamp()}`,
    text: lines.join('\n'),
    replyTo: email,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  let event;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    event = stripe().webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'], secret);
  } catch (err) {
    console.error('webhook signature check failed:', err.message);
    return res.status(400).send('Bad signature');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await fulfil(event.data.object.id);
        break;
      case 'checkout.session.async_payment_failed': {
        const s = event.data.object;
        await notifyTeam({
          subject: `flacara order payment failed — ${s.customer_details?.email || s.id}`,
          text: `A delayed payment failed for Checkout Session ${s.id}.\nEmail: ${s.customer_details?.email || '—'}`,
        });
        break;
      }
      default:
        break; // not subscribed to anything else; acknowledge and move on
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    // a non-2xx makes Stripe retry, so a failed email isn't a lost order
    console.error('webhook handler error', event.type, err);
    return res.status(500).json({ error: 'Handler failed' });
  }
}
