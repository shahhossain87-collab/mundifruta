#!/usr/bin/env node
/** Chrome: leftover catalog add names + leftover hamburger aria-expanded; add Melancia 1/4. */
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

async function leftoverCatalogAdd(page, label) {
  const info = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const btn = card ? card.querySelector('.add-btn') : null;
    const qtyMinus = card ? card.querySelector('.qty-btn') : null;
    return {
      found: Boolean(card && btn),
      label: btn ? btn.getAttribute('aria-label') || '' : '',
      text: btn ? (btn.textContent || '').trim() : '',
      qtyMinus: qtyMinus ? qtyMinus.getAttribute('aria-label') || '' : '',
    };
  });
  ok(info.found, `${label}: leftover Melancia 1/4 catalog card`);
  ok(/Melancia 1\/4/i.test(info.label) && /Adicionar/i.test(info.label),
    `${label}: leftover catalog add names Melancia 1/4 (got "${info.label}")`);
  ok(info.text === '＋ Adicionar', `${label}: leftover catalog add stays “＋ Adicionar” (got "${info.text}")`);
  ok(info.qtyMinus === 'Diminuir', `${label}: leftover catalog qty stays generic Diminuir (got "${info.qtyMinus}")`);
}

async function leftoverHamburger(page, label) {
  const state = await page.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    const before = {
      expanded: btn ? btn.getAttribute('aria-expanded') : null,
      controls: btn ? btn.getAttribute('aria-controls') : null,
      type: btn ? btn.getAttribute('type') : null,
      open: menu ? menu.classList.contains('open') : null,
    };
    if (window.toggleMenu) window.toggleMenu();
    const opened = {
      expanded: btn ? btn.getAttribute('aria-expanded') : null,
      open: menu ? menu.classList.contains('open') : null,
    };
    if (window.toggleMenu) window.toggleMenu();
    const closed = {
      expanded: btn ? btn.getAttribute('aria-expanded') : null,
      open: menu ? menu.classList.contains('open') : null,
    };
    return { before, opened, closed };
  });
  ok(state.before.expanded === 'false', `${label}: leftover hamburger starts aria-expanded=false`);
  ok(state.before.controls === 'mobile-menu', `${label}: leftover hamburger aria-controls=mobile-menu`);
  ok(state.before.type !== 'button', `${label}: leftover hamburger type stays unset (PR #63)`);
  ok(state.before.open === false, `${label}: leftover menu starts closed`);
  ok(state.opened.expanded === 'true' && state.opened.open === true,
    `${label}: leftover hamburger aria-expanded=true while menu is open`);
  ok(state.closed.expanded === 'false' && state.closed.open === false,
    `${label}: leftover hamburger aria-expanded=false after close`);
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    const labelBefore = btn ? btn.getAttribute('aria-label') || '' : '';
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      labelAfter: btn ? btn.getAttribute('aria-label') || '' : '',
      labelBefore,
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(/Melancia 1\/4/i.test(added.labelAfter),
    `${label}: leftover catalog add name survives add (got "${added.labelAfter}")`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCatalogAdd(desktop, '1280');
  await leftoverHamburger(desktop, '1280');
  await addMelancia(desktop, '1280');

  const search = await desktop.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input) return { ok: false };
    input.value = 'morango';
    if (window.pesquisar) window.pesquisar();
    const n = document.querySelectorAll('.shop-main .product-card').length;
    input.value = 'tomate';
    if (window.pesquisar) window.pesquisar();
    const n2 = document.querySelectorAll('.shop-main .product-card').length;
    if (window.limparTudo) window.limparTudo();
    return { ok: true, morango: n, tomate: n2 };
  });
  ok(search.ok && search.morango > 0, `1280: search morango still finds cards (${search.morango})`);
  ok(search.tomate > 0, `1280: search tomate still finds cards (${search.tomate})`);

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

  await leftoverCatalogAdd(mobile, '390');
  await leftoverHamburger(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-catalog-add-menu-expanded-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-catalog-add-menu-expanded-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
