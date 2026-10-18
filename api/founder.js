// GET /api/founder  ->  { limit, sold, left, active }
// How many founder-price units are left, for the price blocks on the site.
import { founderStatus } from './_lib/stripe.js';

export default async function handler(req, res) {
  try {
    const status = await founderStatus();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(status);
  } catch (err) {
    console.error('founder status failed', err);
    return res.status(503).json({ error: 'unavailable' });
  }
}
