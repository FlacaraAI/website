#!/usr/bin/env bash
# Switches flacara.ai to LIVE Stripe payments and deploys. Run it yourself:
#   bash tools/stripe-go-live.sh
# The live key is typed at a hidden prompt and goes only to Stripe and to
# Vercel's encrypted env vars; it is never written to disk or printed.
set -euo pipefail
cd "$(dirname "$0")/.."

SITE="https://flacara.ai"

printf 'Live Stripe key (sk_live_… or rk_live_…), input hidden: '
read -rs KEY; echo
case "$KEY" in
  sk_live_*|rk_live_*) ;;
  *) echo "That isn't a live key (must start sk_live_ or rk_live_). Nothing changed."; exit 1 ;;
esac

[ -d node_modules/stripe ] || npm install --silent

echo "1/4  Creating live products, prices and the webhook in Stripe…"
OUT=$(STRIPE_SECRET_KEY="$KEY" node tools/stripe-setup.mjs --webhook "$SITE/api/stripe-webhook")
echo "$OUT" | grep -v '^WEBHOOK_SECRET='
WHSEC=$(echo "$OUT" | sed -n 's/^WEBHOOK_SECRET=//p')
if [ -z "$WHSEC" ]; then
  echo
  echo "A live webhook for $SITE already exists, so Stripe won't show its secret again."
  printf 'Paste its signing secret (whsec_…) from Dashboard → Developers → Webhooks, input hidden: '
  read -rs WHSEC; echo
fi
case "$WHSEC" in whsec_*) ;; *) echo "No valid webhook secret. Vercel was not changed."; exit 1 ;; esac

echo "2/4  Replacing the test keys on Vercel (production)…"
for NAME in STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
  vercel env rm "$NAME" production --yes >/dev/null 2>&1 || true
done
printf %s "$KEY"   | vercel env add STRIPE_SECRET_KEY production --sensitive >/dev/null
printf %s "$WHSEC" | vercel env add STRIPE_WEBHOOK_SECRET production --sensitive >/dev/null
unset KEY WHSEC

echo "3/4  Deploying to production…"
vercel --prod --yes

echo "4/4  Checking the live site…"
sleep 5
curl -s "$SITE/api/founder"; echo
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"edition":"home"}' "$SITE/api/checkout")
echo "checkout endpoint: HTTP $CODE (200 = a live Checkout page can be opened)"
echo
echo "Done. Buy one unit yourself on $SITE/patients with a real card, check the order"
echo "email arrives, then refund it in the Stripe Dashboard."
