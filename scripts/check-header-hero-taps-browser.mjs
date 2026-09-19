#!/usr/bin/env node
/** Chrome: leftover logo / Encomendar / hero-rating ≥44px; add Melancia 1/4. */
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

async function checkTaps(page, label, vw) {
  const sizes = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return { w: 0, h: 0, display: 'none' };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        href: el.getAttribute('href') || '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      };
    };
    const logo = box(document.querySelector('#main-nav .logo'));
    const order = box(document.querySelector('.nav-order'));
    const rating = box(document.querySelector('.hero-rating'));
    const wa = box(document.querySelector('.btn-wa'));
    const navLinks = [...document.querySelectorAll('.nav-links a')].map(a => box(a));
    return { logo, order, rating, wa, navLinks };
  });

  ok(sizes.logo.h >= 44 && sizes.logo.w >= 44,
    `${label}: logo is ${sizes.logo.w}×${sizes.logo.h}, need ≥44`);
  ok(sizes.logo.href === '#inicio', `${label}: logo still goes to #inicio`);
  ok(/MUNDI\s*FRUTA/i.test(sizes.logo.text), `${label}: logo copy is unchanged`);

  ok(sizes.rating.h >= 44,
    `${label}: hero rating is ${sizes.rating.w}×${sizes.rating.h}, need height ≥44`);
  ok(/maps\.app\.goo\.gl/.test(sizes.rating.href), `${label}: hero rating URL is unchanged`);
  ok(/4,9/.test(sizes.rating.text) && /107/.test(sizes.rating.text),
    `${label}: hero rating copy is unchanged`);

  ok(sizes.wa.h >= 44, `${label}: WhatsApp CTA stays usable (${sizes.wa.w}×${sizes.wa.h})`);
  ok(/Encomendar por WhatsApp/.test(sizes.wa.text), `${label}: WhatsApp CTA copy is unchanged`);

  if (vw >= 769) {
    ok(sizes.order.display !== 'none' && sizes.order.h >= 44,
      `${label}: Encomendar is ${sizes.order.w}×${sizes.order.h}, need height ≥44`);
    ok(/Encomendar/.test(sizes.order.text), `${label}: Encomendar copy is unchanged`);
    ok(sizes.navLinks.every(n => n.h < 44 || n.h === 0),
      `${label}: must not enlarge leftover nav-links (PR #51)`);
  } else {
    ok(sizes.order.display === 'none' || (sizes.order.w === 0 && sizes.order.h === 0),
      `${label}: Encomendar stays hidden on mobile`);
  }
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkTaps(desktop, '1280', 1280);
  await addMelancia(desktop, '1280');
  await desktop.close();

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkTaps(mobile, '390', 390);
  await addMelancia(mobile, '390');
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-header-hero-taps-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-header-hero-taps-browser: ok');
