#!/usr/bin/env node
/** Chrome: leftover dialog/checkout rings exist; mobile bar ≥44px; add Melancia 1/4. */
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

async function checkLeftovers(page, label, { mobileBar }) {
  const sizes = await page.evaluate((needBar) => {
    const measure = (el) => {
      if (!el) return { w: 0, h: 0, display: 'none', text: '', minH: '', outline: '' };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        minH: cs.minHeight,
        outline: `${cs.outlineStyle} ${cs.outlineWidth}`,
      };
    };
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (card) {
      const photo = card.querySelector('.photo-wrap');
      if (photo) photo.click();
    }
    const modal = document.getElementById('product-modal');
    const modalOpen = modal ? modal.classList.contains('open') : false;
    const qtyBtns = [...document.querySelectorAll('.product-modal-qty button')].map(measure);
    const modalAdd = measure(document.getElementById('product-modal-add'));
    if (window.fecharProduto) window.fecharProduto();

    const consent = document.getElementById('consent');
    if (consent) consent.hidden = false;
    const consentNo = measure(document.querySelector('.consent-no'));
    const consentYes = measure(document.querySelector('.consent-yes'));
    if (consent) consent.hidden = true;

    const privacy = document.getElementById('privacy-modal');
    if (window.abrirPrivacidade) window.abrirPrivacidade();
    const reset = measure(document.querySelector('.privacy-reset'));
    if (window.fecharPrivacidade) window.fecharPrivacidade();

    const continuar = measure(document.querySelector('.btn-continuar'));
    const email = measure(document.querySelector('.btn-em'));
    const optional = measure(document.querySelector('.order-optional-toggle'));
    const skip = measure(document.querySelector('.cs-pop-skip'));
    const cabazAdd = measure(document.getElementById('cabaz-modal-add'));

    const bar = needBar
      ? [...document.querySelectorAll('.mobile-bar .mb-item')].map(el => {
        const b = measure(el);
        b.label = (el.querySelector('.mb-label')?.textContent || el.textContent || '')
          .replace(/\s+/g, ' ').trim();
        return b;
      })
      : [];

    return {
      modalOpen, qtyBtns, modalAdd, consentNo, consentYes, reset,
      continuar, email, optional, skip, cabazAdd, bar,
    };
  }, mobileBar);

  ok(sizes.modalOpen, `${label}: Melancia photo opens the product dialog`);
  ok(sizes.qtyBtns.length === 2, `${label}: product-modal qty still has −/+`);
  ok(sizes.modalAdd.text.includes('＋'), `${label}: modal add visible glyph stays ＋`);
  ok(sizes.consentNo.text === 'Só essenciais', `${label}: consent-no copy is unchanged`);
  ok(sizes.consentYes.text === 'Aceitar tudo', `${label}: consent-yes copy is unchanged`);
  ok(sizes.reset.text === 'Repor consentimento', `${label}: privacy-reset copy is unchanged`);
  ok(/Continuar a comprar/i.test(sizes.continuar.text), `${label}: continuar copy is unchanged`);
  ok(/encomende por email/i.test(sizes.email.text), `${label}: email-order copy is unchanged`);
  ok(/Hora de levantamento ou nota/i.test(sizes.optional.text), `${label}: optional-toggle copy is unchanged`);
  ok(/Continuar sem adicionar/i.test(sizes.skip.text), `${label}: cs-pop skip copy is unchanged`);

  if (mobileBar) {
    ok(sizes.bar.length === 4, `${label}: mobile bar still has 4 items (${sizes.bar.map(b => b.label).join(' | ')})`);
    sizes.bar.forEach((item, i) => {
      ok(item.h >= 44,
        `${label}: mb-item[${i}] ${item.label} is ${item.w}×${item.h}, need height ≥44`);
    });
    ok(sizes.bar[0] && /Carrinho/i.test(sizes.bar[0].label), `${label}: first mobile tab stays Carrinho`);
  }
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkLeftovers(desktop, '1280', { mobileBar: false });
  await addMelancia(desktop, '1280');
  const skipAfterAdd = await desktop.evaluate(() => {
    const skip = document.querySelector('.cs-pop-skip');
    const pop = document.getElementById('cs-pop');
    return {
      open: pop ? !pop.hidden : false,
      text: skip ? (skip.textContent || '').replace(/\s+/g, ' ').trim() : '',
    };
  });
  ok(skipAfterAdd.open && /Continuar sem adicionar/i.test(skipAfterAdd.text),
    `1280: add Melancia still shows leftover cross-sell skip (${skipAfterAdd.text})`);
  await desktop.close();

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkLeftovers(mobile, '390', { mobileBar: true });
  await addMelancia(mobile, '390');
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-dialog-checkout-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-dialog-checkout-focus-browser: ok');
