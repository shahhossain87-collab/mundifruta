#!/usr/bin/env node
/** Chrome: leftover qty taps after add + product/cabaz/privacy dialogs vs social dock. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

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
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
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
}

async function qtyAfterAdd(page, vw) {
  const qty = await page.evaluate(() => {
    return [...document.querySelectorAll('.shop-main .product-card.selected .qty-btn')].map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { w: r.width, h: r.height, display: cs.display, text: el.textContent.trim() };
    });
  });
  ok(qty.length === 2, `${vw}: expected 2 leftover qty controls after add`);
  qty.forEach(q => {
    ok(q.h >= 44 && q.w >= 44, `${vw}: leftover qty "${q.text}" is ${Math.round(q.w)}×${Math.round(q.h)}, need ≥44`);
  });
}

async function dialogVsDock(page, vw, selBox, selClose, label) {
  const info = await page.evaluate((selBox, selClose) => {
    const boxEl = document.querySelector(selBox);
    const closeEl = document.querySelector(selClose);
    const dock = [...document.querySelectorAll('.social-panel .social-link')]
      .map(el => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { l: r.left, r: r.right, t: r.top, b: r.bottom, vis: cs.display !== 'none' && r.width > 1 };
      })
      .filter(d => d.vis);
    const b = boxEl ? boxEl.getBoundingClientRect() : null;
    const c = closeEl ? closeEl.getBoundingClientRect() : null;
    const pad = boxEl ? parseFloat(getComputedStyle(boxEl.parentElement).paddingRight) : 0;
    return {
      box: b ? { r: b.right, l: b.left, t: b.top, b: b.bottom } : null,
      close: c ? { r: c.right, l: c.left, t: c.top, b: c.bottom } : null,
      dock,
      pad,
    };
  }, selBox, selClose);

  if (vw <= 768) {
    ok(info.dock.length === 0, `${vw} ${label}: dock should stay hidden`);
    ok(info.pad < 40, `${vw} ${label}: must not use the 200px dock gutter`);
    return;
  }
  ok(info.dock.length > 0, `${vw} ${label}: expected visible dock`);
  ok(info.pad >= 199, `${vw} ${label}: overlay padding-right should be 200px (got ${info.pad})`);
  const dockLeft = Math.min(...info.dock.map(d => d.l));
  const gapBox = dockLeft - info.box.r;
  ok(gapBox >= 20, `${vw} ${label}: box/dock gap ${Math.round(gapBox)}px, need ≥20`);
  info.dock.forEach((d, i) => {
    const ox = Math.min(info.box.r, d.r) - Math.max(info.box.l, d.l);
    const oy = Math.min(info.box.b, d.b) - Math.max(info.box.t, d.t);
    ok(ox <= 0 || oy <= 0, `${vw} ${label}: overlaps dock[${i}] by ${Math.round(ox)}×${Math.round(oy)}`);
  });
  if (info.close) {
    const gapClose = dockLeft - info.close.r;
    ok(gapClose >= 20, `${vw} ${label} close/dock gap ${Math.round(gapClose)}px, need ≥20`);
  }
}

try {
  const page = await browser.newPage();

  await openReady(page, 390, 844);
  await addMelancia(page);
  await qtyAfterAdd(page, 390);
  await page.evaluate(() => {
    const photo = [...document.querySelectorAll('.shop-main .photo-wrap')]
      .find(b => /Melancia/.test(b.getAttribute('aria-label') || ''));
    if (photo) photo.click();
  });
  await new Promise(r => setTimeout(r, 200));
  await dialogVsDock(page, 390, '.product-modal-box', '.product-modal-close', 'product');
  await page.evaluate(() => { if (typeof fecharProduto === 'function') fecharProduto(); });

  for (const [vw, vh] of [[769, 800], [900, 800], [1024, 768], [1280, 800]]) {
    await openReady(page, vw, vh);
    await addMelancia(page);
    await qtyAfterAdd(page, vw);

    await page.evaluate(() => {
      const photo = [...document.querySelectorAll('.shop-main .photo-wrap')]
        .find(b => /Melancia/.test(b.getAttribute('aria-label') || ''));
      if (photo) photo.click();
    });
    await new Promise(r => setTimeout(r, 200));
    await dialogVsDock(page, vw, '.product-modal-box', '.product-modal-close', 'product');
    const addGap = await page.evaluate(() => {
      const add = document.querySelector('.product-modal-add');
      const dock = [...document.querySelectorAll('.social-panel .social-link')]
        .map(el => el.getBoundingClientRect())
        .filter(r => r.width > 1);
      if (!add || !dock.length) return null;
      const a = add.getBoundingClientRect();
      const left = Math.min(...dock.map(d => d.left));
      return left - a.right;
    });
    if (addGap != null) ok(addGap >= 20, `${vw} product add/dock gap ${Math.round(addGap)}px, need ≥20`);
    await page.evaluate(() => { if (typeof fecharProduto === 'function') fecharProduto(); });

    await page.evaluate(() => {
      const first = document.querySelector('#grid-cabazes .product-card');
      if (first && typeof abrirCabaz === 'function') abrirCabaz(first.dataset.productId);
    });
    await new Promise(r => setTimeout(r, 200));
    await dialogVsDock(page, vw, '.cabaz-modal-box', '.cabaz-modal-close', 'cabaz');
    await page.evaluate(() => { if (typeof fecharCabaz === 'function') fecharCabaz(); });

    await page.evaluate(() => { if (typeof abrirPrivacidade === 'function') abrirPrivacidade(); });
    await new Promise(r => setTimeout(r, 150));
    await dialogVsDock(page, vw, '.privacy-box', '.privacy-close', 'privacy');
    await page.evaluate(() => { if (typeof fecharPrivacidade === 'function') fecharPrivacidade(); });
  }
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}

if (errors.length) {
  console.error('FAIL\n' + errors.map(e => '- ' + e).join('\n'));
  process.exit(1);
}
console.log('OK Chrome leftover qty taps + dialog dock gutter');
