// Shared Stripe client and catalogue. Files under api/_lib are helpers, not
// routes (Vercel skips paths that start with an underscore).
import Stripe from 'stripe';

export const API_VERSION = '2026-09-30.endive';

let client;
export function stripe() {
  if (!client) {
    // a restricted key (rk_…) is preferred; see STRIPE.md for the permissions it needs
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    client = new Stripe(key, { apiVersion: API_VERSION });
  }
  return client;
}

// One Product per edition with two USD Prices, found by lookup key so the code
// never hard-codes price IDs: the regular price, and the founder price that
// applies to the first FOUNDER_LIMIT units sold across both editions.
// tools/stripe-setup.mjs creates them.
export const FOUNDER_LIMIT = 300;
export const SHIP_PROMISE = 'Ships within 3 months of your order, or a full refund.';

export const EDITIONS = {
  home: {
    lookupKey: 'flacara_h1_home',
    founderLookupKey: 'flacara_h1_home_founder',
    productName: 'flacara h1 — home edition',
    unitAmount: 24900,
    founderAmount: 19900,
    audience: 'patient',
    page: '/patients',
    maxQuantity: 3,
  },
  clinical: {
    lookupKey: 'flacara_h1_clinical',
    founderLookupKey: 'flacara_h1_clinical_founder',
    productName: 'flacara h1 — clinical edition',
    unitAmount: 29900,
    founderAmount: 24900,
    audience: 'doctor',
    page: '/doctors',
    maxQuantity: 50,
  },
};

export async function priceFor(edition, { founder = false } = {}) {
  const ed = EDITIONS[edition];
  const lookupKey = founder ? ed.founderLookupKey : ed.lookupKey;
  const { data } = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (!data.length) throw new Error(`No active Stripe price with lookup key ${lookupKey} — run tools/stripe-setup.mjs`);
  return data[0];
}

// Founder units sold so far. Checkout tags founder payments with
// metadata.founder, and the webhook records the final quantity as
// metadata.founder_units once paid. Search is eventually consistent (about a
// minute), which is close enough for a 300-unit allowance.
let soldCache = { at: 0, n: 0 };
export async function founderUnitsSold() {
  if (Date.now() - soldCache.at < 60_000) return soldCache.n;
  let n = 0;
  for await (const pi of stripe().paymentIntents.search({
    query: "metadata['founder']:'true' AND status:'succeeded'",
    limit: 100,
  })) {
    n += parseInt(pi.metadata.founder_units, 10) || 1;
  }
  soldCache = { at: Date.now(), n };
  return n;
}

export async function founderStatus() {
  const sold = await founderUnitsSold();
  const left = Math.max(0, FOUNDER_LIMIT - sold);
  return { limit: FOUNDER_LIMIT, sold, left, active: left > 0 };
}

export const dollars = (cents) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// Where Checkout sends people back to. SITE_URL pins it in production; the
// fallback covers preview deployments.
export function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `https://${host}`;
}

export function shippingCountries() {
  return (process.env.STRIPE_SHIP_COUNTRIES || 'US').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
}
