#!/usr/bin/env node
/** Chrome: leftover dialog/checkout taps + drawer vs bar; add Melancia 1/4. */
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

async function openReady(page, vw, vh, { showConsent = false } = {}) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate((keepConsent) => {
    try { localStorage.setItem('mf_consent', keepConsent ? '' : 'essential'); } catch (e) {}
    if (!keepConsent) {
      try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    } else {
      try { localStorage.removeItem('mf_consent'); } catch (e) {}
    }
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  }, showConsent);
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate((keepConsent) => {
    const c = document.getElementById('consent');
    if (c) c.hidden = !keepConsent;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  }, showConsent);
}

function assertTap(box, vw, label) {
  ok(box && box.w >= 44 && box.h >= 44,
    `${vw}: ${label} is ${box ? `${Math.round(box.w)}×${Math.round(box.h)}` : 'missing'}, need ≥44`);
}

async function leftoverDialogTaps(page, vw) {
  const info = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    };
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/.test(c.textContent || ''));
    const photo = card?.querySelector('.photo-wrap');
    if (photo) photo.click();
    const qty = [...document.querySelectorAll('.product-modal-qty button')].map(el => ({
      ...rect(el),
      text: el.textContent.trim(),
    }));
    document.getElementById('product-modal')?.classList.remove('open');
    document.body.style.overflow = '';

    const add = card?.querySelector('.add-btn');
    if (add) add.click();
    const skip = document.querySelector('.cs-pop-skip');
    const skipBox = rect(skip);
    if (skip) skip.click();

    document.getElementById('encomenda')?.scrollIntoView();
    const cont = rect(document.querySelector('.btn-continuar'));
    const em = rect(document.querySelector('.btn-em'));

    if (window.abrirPrivacidade) window.abrirPrivacidade();
    const reset = rect(document.querySelector('.privacy-reset'));
    if (window.fecharPrivacidade) window.fecharPrivacidade();

    return { qty, skip: skipBox, cont, em, reset };
  });

  ok(info.qty.length === 2, `${vw}: expected 2 product-modal qty controls`);
  info.qty.forEach(q => assertTap(q, vw, `product-modal qty "${q.text}"`));
  assertTap(info.skip, vw, 'cs-pop-skip');
  assertTap(info.cont, vw, 'btn-continuar');
  assertTap(info.em, vw, 'btn-em');
  assertTap(info.reset, vw, 'privacy-reset');
}

async function leftoverConsentTaps(page, vw) {
  await openReady(page, vw, vw <= 430 ? 844 : 800, { showConsent: true });
  const box = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, hidden: el.closest('[hidden]') != null && el.id !== 'consent' };
    };
    const banner = document.getElementById('consent');
    return {
      visible: banner && !banner.hidden,
      no: rect(document.querySelector('.consent-no')),
      yes: rect(document.querySelector('.consent-yes')),
    };
  });
  ok(box.visible, `${vw}: consent banner should be visible for leftover tap check`);
  assertTap(box.no, vw, 'consent-no');
  assertTap(box.yes, vw, 'consent-yes');
}

async function leftoverDrawerClearance(page) {
  const vw = 390;
  await openReady(page, vw, 844);
  const gap = await page.evaluate(() => {
    const sb = document.getElementById('shop-sidebar');
    const btn = document.querySelector('.filtbtn');
    const bar = document.getElementById('mobile-bar');
    const preco = document.getElementById('filter-preco');
    if (btn) btn.click();
    if (sb) sb.scrollTop = sb.scrollHeight;
    const sbOpen = sb?.classList.contains('open');
    const precoBox = preco?.getBoundingClientRect();
    const barBox = bar?.getBoundingClientRect();
    return {
      sbOpen,
      precoBottom: precoBox ? precoBox.bottom : null,
      barTop: barBox ? barBox.top : null,
      barDisplay: bar ? getComputedStyle(bar).display : '',
      pad: sb ? getComputedStyle(sb).paddingBottom : '',
    };
  });
  ok(gap.sbOpen, '390: filter drawer should open');
  ok(gap.barDisplay !== 'none', '390: mobile bar should be visible');
  ok(gap.precoBottom != null && gap.barTop != null,
    '390: expected price filter and mobile bar boxes');
  ok(gap.precoBottom <= gap.barTop + 1,
    `390: price filter bottom ${Math.round(gap.precoBottom)} must sit above bar top ${Math.round(gap.barTop)}`);
  ok(/px$/.test(gap.pad) && parseFloat(gap.pad) >= 90,
    `390: drawer padding-bottom should clear the bar (got ${gap.pad})`);
}

async function leftoverDesktopNoDrawerPad(page) {
  const vw = 1280;
  await openReady(page, vw, 800);
  const pad = await page.evaluate(() => {
    const sb = document.getElementById('shop-sidebar');
    return {
      open: sb?.classList.contains('open') || false,
      pad: sb ? getComputedStyle(sb).paddingBottom : '',
      sticky: sb ? getComputedStyle(sb).position : '',
    };
  });
  ok(!pad.open, '1280: desktop sidebar is not a drawer');
  ok(pad.sticky === 'sticky', '1280: desktop sidebar stays sticky');
  ok(parseFloat(pad.pad) < 40,
    `1280: desktop sidebar must not get the mobile bar gutter (got ${pad.pad})`);
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
    await leftoverDialogTaps(page, vw);
    await addMelancia(page);
  }
  await leftoverConsentTaps(page, 390);
  await leftoverConsentTaps(page, 1280);
  await leftoverDrawerClearance(page);
  await leftoverDesktopNoDrawerPad(page);
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}

if (errors.length) {
  console.error('FAIL\n' + errors.map(e => '- ' + e).join('\n'));
  process.exit(1);
}
console.log('OK Chrome leftover dialog taps + drawer clearance');
