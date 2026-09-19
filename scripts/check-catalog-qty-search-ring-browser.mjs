#!/usr/bin/env node
/** Chrome: leftover catalog qty names + leftover search keyboard ring; add Melancia 1/4. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
const chrome = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable')
    ? '/usr/bin/google-chrome-stable'
    : '/usr/bin/google-chrome');
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

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

async function leftoverCatalogQtyNames(page, label) {
  const names = await page.evaluate(() => {
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const minus = card ? card.querySelector('.qty-btn') : null;
    const plus = card ? card.querySelectorAll('.qty-btn')[1] : null;
    const add = card ? card.querySelector('.add-btn') : null;
    return {
      minus: minus ? minus.getAttribute('aria-label') || '' : '',
      plus: plus ? plus.getAttribute('aria-label') || '' : '',
      minusType: minus ? minus.getAttribute('type') : '',
      plusType: plus ? plus.getAttribute('type') : '',
      addText: add ? (add.textContent || '').trim() : '',
      group: card ? card.querySelector('.qty-controls')?.getAttribute('aria-label') || '' : '',
    };
  });
  ok(/Melancia 1\/4/i.test(names.minus), `${label}: leftover catalog minus names Melancia 1/4 (got "${names.minus}")`);
  ok(/Melancia 1\/4/i.test(names.plus), `${label}: leftover catalog plus names Melancia 1/4 (got "${names.plus}")`);
  ok(/Diminuir quantidade/i.test(names.minus), `${label}: leftover catalog minus says Diminuir quantidade`);
  ok(/Aumentar quantidade/i.test(names.plus), `${label}: leftover catalog plus says Aumentar quantidade`);
  ok(names.minusType === 'button' && names.plusType === 'button', `${label}: leftover catalog qty type=button`);
  ok(/Adicionar/i.test(names.addText), `${label}: leftover catalog add stays “＋ Adicionar” (got "${names.addText}")`);
  ok(/Melancia 1\/4/i.test(names.group), `${label}: leftover catalog qty group still names Melancia 1/4`);
}

async function leftoverSearchRing(page, label) {
  await page.evaluate(() => {
    const clear = document.getElementById('search-clear');
    if (clear) clear.classList.remove('visible');
  });
  const search = await page.$('#search-input');
  ok(!!search, `${label}: leftover catalog search exists`);
  if (search) await search.focus();
  const ring = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    const active = document.activeElement === input;
    const cs = input ? getComputedStyle(input) : null;
    return {
      active,
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      outlineColor: cs ? cs.outlineColor : '',
      boxShadow: cs ? cs.boxShadow : '',
      borderColor: cs ? cs.borderColor : '',
    };
  });
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  const hasShadow = ring.boxShadow && ring.boxShadow !== 'none';
  ok(ring.active, `${label}: leftover catalog search is focused`);
  ok(hasOutline || hasShadow,
    `${label}: leftover catalog search keyboard ring (outline=${ring.outlineStyle}/${ring.outlineWidth}, shadow=${ring.boxShadow})`);
}

async function leftoverCabazModalType(page, label) {
  const info = await page.evaluate(() => {
    const add = document.getElementById('cabaz-modal-add');
    return {
      type: add ? add.getAttribute('type') : '',
      text: add ? (add.textContent || '').trim() : '',
    };
  });
  ok(info.type === 'button', `${label}: leftover cabaz-modal add type=button`);
  ok(info.text === '＋', `${label}: leftover cabaz-modal add stays a visible plus`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverSearchRing(desktop, '1280');
  await leftoverCatalogQtyNames(desktop, '1280');
  await leftoverCabazModalType(desktop, '1280');
  await addMelancia(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  await leftoverSearchRing(mobile, '390');
  await leftoverCatalogQtyNames(mobile, '390');
  await leftoverCabazModalType(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-catalog-qty-search-ring-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-catalog-qty-search-ring-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
