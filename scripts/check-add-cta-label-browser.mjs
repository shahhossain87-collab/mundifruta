#!/usr/bin/env node
/** Chrome: leftover catalog/cabaz "＋ Adicionar" survives add/remove; add Melancia 1/4. */
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

async function resetFrutas(page) {
  await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
}

async function catalogLabels(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('.shop-main .product-card')];
    const melancia = cards.find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const add = (card) => card ? card.querySelector('.add-btn') : null;
    const featured = document.querySelector('.feature-add');
    const cabaz = document.querySelector('#grid-cabazes .add-btn');
    const modal = document.getElementById('product-modal-add');
    const cabazModal = document.getElementById('cabaz-modal-add');
    const labelOf = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');
    return {
      first: labelOf(add(cards[0])),
      melancia: labelOf(add(melancia)),
      featured: labelOf(featured),
      cabaz: labelOf(cabaz),
      modal: labelOf(modal),
      cabazModal: labelOf(cabazModal),
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
}

async function addAndRemoveMelancia(page, label) {
  await resetFrutas(page);
  const before = await catalogLabels(page);
  ok(/Adicionar/.test(before.melancia), `${label}: leftover Melancia add starts as "${before.melancia}"`);
  ok(/Adicionar/.test(before.first), `${label}: leftover first catalog add starts as "${before.first}"`);
  ok(before.featured === '＋', `${label}: leftover featured add stays "＋" (got "${before.featured}")`);
  ok(/Adicionar/.test(before.cabaz), `${label}: leftover cabaz add starts as "${before.cabaz}"`);
  ok(before.modal === '＋', `${label}: leftover product-modal add stays "＋"`);
  ok(before.cabazModal === '＋', `${label}: leftover cabaz-modal add stays "＋"`);

  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const badge = document.getElementById('cart-count');
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return { ok: true, count: badge ? badge.textContent : '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);

  const removed = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false };
    const id = card.dataset.productId;
    if (window.removerProduto) window.removerProduto(id);
    const btn = card.querySelector('.add-btn');
    return {
      ok: true,
      label: btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '',
      selected: card.classList.contains('selected'),
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(removed.ok && !removed.selected && removed.count === '0',
    `${label}: remove Melancia (selected=${removed.selected}, count=${removed.count})`);
  ok(/Adicionar/.test(removed.label),
    `${label}: leftover Melancia add is "${removed.label}" after remove, not a bare plus`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await addAndRemoveMelancia(desktop, '1280');

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

  await addAndRemoveMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-add-cta-label-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-add-cta-label-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
