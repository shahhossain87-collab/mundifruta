#!/usr/bin/env node
/** Chrome: leftover cabaz add/qty/ver taps + featured ＋ size; add Melancia 1/4. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('/tmp/mf-test/node_modules/puppeteer-core');
}

const root = resolve(import.meta.dirname, '..');
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let file = decodeURIComponent(url.pathname);
  if (file === '/') file = '/index.html';
  try {
    const buf = await readFile(join(root, file));
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

async function openReady(page, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
}

function assertTap(box, vw, label) {
  ok(box && box.w >= 44 && box.h >= 44,
    `${vw}: ${label} is ${box ? `${Math.round(box.w)}×${Math.round(box.h)}` : 'missing'}, need ≥44`);
}

async function leftoverTaps(page, vw) {
  const info = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { w: r.width, h: r.height, display: cs.display, vis: cs.display !== 'none' && r.width > 1 };
    };
    const cabaz = document.querySelector('#grid-cabazes .product-card');
    const ver = cabaz?.querySelector('.cabaz-ver');
    const add = cabaz?.querySelector('.add-btn');
    const addBefore = rect(add);
    if (add) add.click();
    const qty = [...(cabaz?.querySelectorAll('.qty-btn') || [])].map(el => ({
      ...rect(el),
      text: el.textContent.trim(),
    }));
    const feature = document.querySelector('.feature-add');
    return {
      cabazName: cabaz?.querySelector('.product-name')?.textContent || '',
      ver: rect(ver),
      add: addBefore,
      qty,
      feature: rect(feature),
    };
  });

  ok(/Cabaz/.test(info.cabazName), `${vw}: expected a cabaz card, got "${info.cabazName}"`);
  assertTap(info.ver, vw, 'cabaz-ver');
  assertTap(info.add, vw, 'cabaz add');
  ok(info.qty.length === 2, `${vw}: expected 2 cabaz qty controls after add`);
  info.qty.forEach(q => assertTap(q, vw, `cabaz qty "${q.text}"`));
  assertTap(info.feature, vw, 'featured ＋');
}

async function addMelancia(page) {
  const name = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/.test(c.textContent || ''));
    const btn = card?.querySelector('.add-btn');
    if (btn) btn.click();
    return card?.querySelector('.product-name')?.textContent || '';
  });
  ok(name === 'Melancia 1/4', `expected to add Melancia 1/4, got "${name}"`);
  await new Promise(r => setTimeout(r, 250));
  const count = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/.test(c.textContent || ''));
    const badge = document.getElementById('cart-count') || document.getElementById('quick-cart-count');
    return {
      selected: card?.classList.contains('selected') || false,
      badge: badge?.textContent || '',
    };
  });
  ok(count.selected || Number(count.badge) >= 1,
    `cart should reflect Melancia add (selected=${count.selected} badge="${count.badge}")`);
}

try {
  const page = await browser.newPage();
  for (const [vw, vh] of [[390, 844], [1280, 800]]) {
    await openReady(page, vw, vh);
    await leftoverTaps(page, vw);
    await addMelancia(page);
    await page.evaluate(() => document.getElementById('cabazes')?.scrollIntoView());
    await new Promise(r => setTimeout(r, 150));
    await page.screenshot({ path: `/tmp/mf-cabazes-${vw}.png`, fullPage: false });
    await page.evaluate(() => document.getElementById('promocoes')?.scrollIntoView());
    await new Promise(r => setTimeout(r, 150));
    await page.screenshot({ path: `/tmp/mf-featured-${vw}.png`, fullPage: false });
  }
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}

if (errors.length) {
  console.error('FAIL\n' + errors.map(e => '- ' + e).join('\n'));
  process.exit(1);
}
console.log('OK Chrome leftover cabaz + featured taps');
