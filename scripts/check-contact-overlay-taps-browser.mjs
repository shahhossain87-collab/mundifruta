#!/usr/bin/env node
/** Chrome: leftover contact / float-cart ≥44px; add Melancia 1/4. */
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

async function checkTaps(page, label) {
  const sizes = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return { w: 0, h: 0, display: 'none', href: '', text: '', outline: '' };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        href: el.getAttribute('href') || '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        minH: cs.minHeight,
      };
    };
    const phone = box(document.querySelector('.contact-card a[href^="tel:"]'));
    const email = box(document.querySelector('.contact-card a[href^="mailto:"]'));
    const cart = box(document.querySelector('.float-cart'));
    const top = box(document.querySelector('.scroll-top'));
    const offer = document.getElementById('offer-pop');
    const offerWasHidden = !offer || offer.hidden;
    if (offer) offer.hidden = false;
    const close = box(document.querySelector('.reveal-close'));
    const cta = box(document.querySelector('.reveal-cta'));
    const later = box(document.querySelector('.reveal-later'));
    if (offer) offer.hidden = offerWasHidden;
    return { phone, email, cart, top, close, cta, later };
  });

  ok(sizes.phone.h >= 44,
    `${label}: contact phone is ${sizes.phone.w}×${sizes.phone.h}, need height ≥44`);
  ok(sizes.phone.href === 'tel:932699850', `${label}: contact phone href is unchanged`);
  ok(sizes.phone.text === '932 699 850', `${label}: contact phone copy is unchanged`);

  ok(sizes.email.h >= 44,
    `${label}: contact email is ${sizes.email.w}×${sizes.email.h}, need height ≥44`);
  ok(sizes.email.href === 'mailto:shahhossain87@gmail.com', `${label}: contact email href is unchanged`);
  ok(sizes.email.text === 'shahhossain87@gmail.com', `${label}: contact email copy is unchanged`);

  ok(sizes.top.minH === '44px' || sizes.top.h >= 44,
    `${label}: scroll-top stays ≥44 (${sizes.top.w}×${sizes.top.h})`);
  ok(sizes.close.h >= 44 && sizes.cta.h >= 44 && sizes.later.h >= 44,
    `${label}: offer controls stay ≥44 (close ${sizes.close.h}, cta ${sizes.cta.h}, later ${sizes.later.h})`);
  ok(/Receber Oferta/.test(sizes.cta.text) && /Agora não/.test(sizes.later.text),
    `${label}: offer CTA copy is unchanged`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkTaps(desktop, '1280');
  await addMelancia(desktop, '1280');
  const deskCart = await desktop.evaluate(() => {
    const el = document.querySelector('.float-cart');
    if (!el) return { h: 0, visible: false };
    const r = el.getBoundingClientRect();
    return { h: Math.round(r.height), visible: el.classList.contains('visible'), text: el.textContent.trim() };
  });
  ok(deskCart.visible && deskCart.h >= 44,
    `1280: float-cart after add is ${deskCart.h}px visible=${deskCart.visible}`);
  await desktop.close();

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkTaps(mobile, '390');
  await addMelancia(mobile, '390');
  const mobCart = await mobile.evaluate(() => {
    const el = document.querySelector('.float-cart');
    if (!el) return { h: 0, visible: false };
    const r = el.getBoundingClientRect();
    return { h: Math.round(r.height), visible: el.classList.contains('visible') };
  });
  ok(mobCart.visible && mobCart.h >= 44,
    `390: float-cart after add is ${mobCart.h}px visible=${mobCart.visible}`);
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-contact-overlay-taps-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-contact-overlay-taps-browser: ok');
