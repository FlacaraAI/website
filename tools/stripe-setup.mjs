// One-time (and safe to re-run) catalogue setup:
//   STRIPE_SECRET_KEY=rk_test_… node tools/stripe-setup.mjs [--webhook https://flacara.ai/api/stripe-webhook]
// Creates one Product per edition with two USD Prices: the regular price and
// the founder price, each under the lookup key /api/checkout looks up.
// Existing prices are left alone; to change one, create a new Price in Stripe
// and move the lookup key to it (transfer_lookup_key), since prices can't be
// edited. With --webhook, also creates the webhook destination (once) and
// prints its signing secret.
import Stripe from 'stripe';
import { EDITIONS, API_VERSION, SHIP_PROMISE } from '../api/_lib/stripe.js';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error('Set STRIPE_SECRET_KEY first.'); process.exit(1); }
const stripe = new Stripe(key, { apiVersion: API_VERSION });

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
];

for (const [edition, ed] of Object.entries(EDITIONS)) {
  const found = await stripe.products.search({ query: `metadata['edition']:'${edition}'` });
  const product = found.data[0] || await stripe.products.create({
    name: ed.productName,
    description: SHIP_PROMISE,
    metadata: { edition },
    shippable: true,
    tax_code: 'txcd_99999999', // general tangible goods
  });
  console.log(`${edition}: product ${product.id}${found.data[0] ? ' (existing)' : ''}`);

  for (const [lookupKey, amount, nickname] of [
    [ed.lookupKey, ed.unitAmount, 'Regular'],
    [ed.founderLookupKey, ed.founderAmount, 'Founder (first 300 units)'],
  ]) {
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    if (existing.data.length) { console.log(`  ${lookupKey}: exists (${existing.data[0].id})`); continue; }
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: amount,
      lookup_key: lookupKey,
      nickname,
      tax_behavior: 'exclusive',
    });
    console.log(`  ${lookupKey}: created ${price.id} at $${amount / 100}`);
  }
}

const i = process.argv.indexOf('--webhook');
if (i > -1) {
  const url = process.argv[i + 1];
  const all = await stripe.webhookEndpoints.list({ limit: 100 });
  const had = all.data.find((w) => w.url === url);
  if (had) {
    console.log(`webhook: exists (${had.id}); its secret is in the Dashboard`);
  } else {
    const wh = await stripe.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS, description: 'flacara orders' });
    console.log(`webhook: created ${wh.id}`);
    console.log(`WEBHOOK_SECRET=${wh.secret}`);
  }
}
