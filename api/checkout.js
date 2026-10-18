// POST /api/checkout  { edition: 'home' | 'clinical' }  ->  { url }
// Creates a Stripe Checkout Session and returns its hosted payment page.
// Fulfilment (the team email) happens in api/stripe-webhook.js, never here
// or on the thank-you page.
import {
  stripe, EDITIONS, priceFor, siteUrl, shippingCountries,
  founderStatus, FOUNDER_LIMIT, SHIP_PROMISE, dollars,
} from './_lib/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { edition } = req.body || {};
  const ed = EDITIONS[edition];
  if (!ed) return res.status(400).json({ error: 'Unknown edition' });

  try {
    // founder pricing while the first FOUNDER_LIMIT units last; if the count
    // can't be read, sell at founder price rather than block the sale
    const founder = await founderStatus().catch((err) => {
      console.error('founder count failed', err);
      return { active: true, left: ed.maxQuantity };
    });
    const price = await priceFor(edition, { founder: founder.active });
    const base = siteUrl(req);
    const saving = ed.unitAmount - ed.founderAmount;

    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price: price.id,
        quantity: 1,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: founder.active ? Math.max(1, Math.min(ed.maxQuantity, founder.left)) : ed.maxQuantity,
        },
      }],
      custom_text: {
        submit: {
          message: founder.active
            ? `Founder price: ${dollars(ed.founderAmount)} instead of ${dollars(ed.unitAmount)} — you save ${dollars(saving)} per unit. For the first ${FOUNDER_LIMIT} units only. ${SHIP_PROMISE}`
            : SHIP_PROMISE,
        },
      },
      // a physical device: we need somewhere to ship it and someone to call
      shipping_address_collection: { allowed_countries: shippingCountries() },
      phone_number_collection: { enabled: true },
      billing_address_collection: 'required',
      customer_creation: 'always',
      // an invoice PDF for every order (practices need one for their books)
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `${ed.productName} — pre-order${founder.active ? ' (founder price)' : ''}. ${SHIP_PROMISE}`,
          metadata: { edition },
          footer: 'flacara, a subsidiary of Lumo Imaging.',
        },
      },
      ...(edition === 'clinical' ? {
        custom_fields: [{
          key: 'practice',
          label: { type: 'custom', custom: 'Practice name' },
          type: 'text',
          optional: true,
        }],
      } : {}),
      allow_promotion_codes: true,
      // Off until a Stripe Tax registration exists; with no registration
      // Stripe collects nothing even when this is on. See STRIPE.md.
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'on' },
      metadata: { edition, audience: ed.audience, founder: String(founder.active) },
      payment_intent_data: {
        description: ed.productName,
        metadata: { edition, founder: String(founder.active) },
      },
      integration_identifier: 'flacara_preorder_hkqzmwtr',
      success_url: `${base}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}${ed.page}#pre-order`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error', err);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
}
