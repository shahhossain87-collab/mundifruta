#!/usr/bin/env node
/** Chrome: leftover privacy / footer-credit ≥44px; add Melancia 1/4. */
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
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('.footer-links a')]
      .find(a => /Privacidade/i.test(a.textContent || ''));
    if (link) link.click();
    else if (window.abrirPrivacidade) window.abrirPrivacidade();
  });
  const sizes = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return { w: 0, h: 0, display: 'none', href: '', text: '', outline: '', minH: '' };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        href: el.getAttribute('href') || '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        minH: cs.minHeight,
        outline: cs.outlineStyle + ' ' + cs.outlineWidth,
      };
    };
    const privacy = document.getElementById('privacy-modal');
    const wa = box(document.querySelector('.privacy-box a[href*="wa.me"]'));
    const email = box(document.querySelector('.privacy-box a[href^="mailto:"]'));
    const close = box(document.querySelector('.privacy-close'));
    const credit = box(document.querySelector('.footer-credit a'));
    const open = privacy ? !privacy.hidden : false;
    return { wa, email, close, credit, open };
  });
  ok(sizes.open, `${label}: footer Privacidade opens the privacy dialog`);
  await page.evaluate(() => {
    if (window.fecharPrivacidade) window.fecharPrivacidade();
  });

  ok(sizes.wa.h >= 44,
    `${label}: privacy WhatsApp is ${sizes.wa.w}×${sizes.wa.h}, need height ≥44`);
  ok(sizes.wa.href === 'https://wa.me/351932699850', `${label}: privacy WhatsApp href is unchanged`);
  ok(sizes.wa.text === 'WhatsApp', `${label}: privacy WhatsApp copy is unchanged`);

  ok(sizes.email.h >= 44,
    `${label}: privacy email is ${sizes.email.w}×${sizes.email.h}, need height ≥44`);
  ok(sizes.email.href === 'mailto:shahhossain87@gmail.com', `${label}: privacy email href is unchanged`);
  ok(sizes.email.text === 'email', `${label}: privacy email copy is unchanged`);

  ok(sizes.credit.h >= 44,
    `${label}: footer credit is ${sizes.credit.w}×${sizes.credit.h}, need height ≥44`);
  ok(sizes.credit.href === 'mailto:shahhossain050187@gmail.com', `${label}: footer credit href is unchanged`);
  ok(sizes.credit.text === 'Shah Hossain', `${label}: footer credit copy is unchanged`);

  ok(sizes.close.minH === '0px' || sizes.close.h > 0,
    `${label}: privacy close stays in the dialog (h=${sizes.close.h})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkTaps(desktop, '1280');
  await addMelancia(desktop, '1280');
  await desktop.close();

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkTaps(mobile, '390');
  await addMelancia(mobile, '390');
  const bar = await mobile.evaluate(() => {
    const items = [...document.querySelectorAll('.mobile-bar .mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return items;
  });
  ok(bar.length === 4, `390: mobile bar still has 4 items (${bar.join(' | ')})`);
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-privacy-footer-leftover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-privacy-footer-leftover-browser: ok');
