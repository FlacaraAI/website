// node tools/render-device-hero.mjs  (needs the dev server on :3002 and `playwright`)
// Renders the doctors hero's still to images/h1-hero.png; convert to WebP after.
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 1200 } });
await page.goto('http://localhost:3002/tools/render-device-hero.html');
await page.waitForFunction(() => window.ready === true, null, { timeout: 90000 });
const url = await page.evaluate(() => window.renderStill());
writeFileSync(new URL('../images/h1-hero.png', import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
await browser.close();
console.log('rendered images/h1-hero.png');
