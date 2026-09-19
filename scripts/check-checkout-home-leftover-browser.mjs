#!/usr/bin/env node
/** Chrome: leftover cart/consent 44px taps + Home/End on category tabs; add Melancia 1/4. */
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

async function resetFrutas(page) {
  await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
}

async function addMelancia(page, label) {
  await resetFrutas(page);
  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const badge = document.getElementById('cart-count');
    return { ok: true, count: badge ? badge.textContent : '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

async function checkCheckoutTaps(page, label) {
  const sizes = await page.evaluate(() => {
    const minus = document.querySelector('.oi-stepper button[aria-label="Menos"]');
    const plus = document.querySelector('.oi-stepper button[aria-label="Mais"]');
    const remove = document.querySelector('.order-remove');
    const box = el => {
      if (!el) return { w: 0, h: 0 };
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    return { minus: box(minus), plus: box(plus), remove: box(remove) };
  });
  ok(sizes.minus.w >= 44 && sizes.minus.h >= 44,
    `${label}: cart − is ${sizes.minus.w}×${sizes.minus.h}, need ≥44`);
  ok(sizes.plus.w >= 44 && sizes.plus.h >= 44,
    `${label}: cart + is ${sizes.plus.w}×${sizes.plus.h}, need ≥44`);
  ok(sizes.remove.w >= 44 && sizes.remove.h >= 44,
    `${label}: cart remove is ${sizes.remove.w}×${sizes.remove.h}, need ≥44`);
}

async function checkConsentLink(page, label) {
  const size = await page.evaluate(() => {
    const link = document.querySelector('.consent-link');
    const banner = document.getElementById('consent');
    if (banner) banner.hidden = false;
    if (!link) return { w: 0, h: 0 };
    const r = link.getBoundingClientRect();
    if (banner) banner.hidden = true;
    return { w: Math.round(r.width), h: Math.round(r.height), text: link.textContent.trim() };
  });
  ok(size.text === 'Saber mais', `${label}: consent link copy stays “Saber mais” (got "${size.text}")`);
  ok(size.h >= 44, `${label}: consent “Saber mais” is ${size.w}×${size.h}, need height ≥44`);
}

async function checkHomeEnd(page, label) {
  await resetFrutas(page);
  const end = await page.evaluate(() => {
    const frutas = document.getElementById('tab-frutas');
    frutas.focus();
    frutas.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    return {
      active: document.activeElement && document.activeElement.id,
      selected: [...document.querySelectorAll('.cat-tab[aria-selected="true"]')].map(t => t.id),
    };
  });
  ok(end.active === 'tab-cabazes', `${label}: End from Frutas focuses Cabazes (got ${end.active})`);

  const home = await page.evaluate(() => {
    const cabazes = document.getElementById('tab-cabazes');
    cabazes.focus();
    cabazes.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    return {
      active: document.activeElement && document.activeElement.id,
      selected: [...document.querySelectorAll('.cat-tab[aria-selected="true"]')].map(t => t.id),
      crumb: document.getElementById('crumb-cat')?.textContent,
    };
  });
  ok(home.active === 'tab-frutas', `${label}: Home from Cabazes focuses Frutas (got ${home.active})`);
  ok(home.selected.includes('tab-frutas') && !home.selected.includes('tab-cabazes'),
    `${label}: Home selects Frutas (got ${home.selected.join(',')})`);
  ok(home.crumb === 'Frutas', `${label}: catalog crumb returns to Frutas (got ${home.crumb})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkHomeEnd(desktop, '1280');
  await addMelancia(desktop, '1280');
  await checkCheckoutTaps(desktop, '1280');
  await checkConsentLink(desktop, '1280');
  await desktop.close();

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkHomeEnd(mobile, '390');
  await addMelancia(mobile, '390');
  await checkCheckoutTaps(mobile, '390');
  await checkConsentLink(mobile, '390');
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-checkout-home-leftover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-checkout-home-leftover-browser: ok');
