// node tools/render-phone-frames.mjs  (needs the dev server on :3002 and `playwright`)
// Renders the hero phone at N scroll positions and writes PNGs to
// images/phone/; convert them to WebP afterwards (see README note in the html).
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
const N = 1, out = new URL('../images/phone/', import.meta.url);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 1200 } });
await page.goto('http://localhost:3002/tools/render-phone-frames.html');
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
for (let i = 0; i < N; i++) {
  const url = await page.evaluate(([i, n]) => window.renderFrame(i, n), [i, N]);
  writeFileSync(new URL('phone-hero.png', out), Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
console.log('rendered', N);
