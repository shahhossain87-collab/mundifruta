#!/usr/bin/env node
/** Chrome: leftover catalog-search keyboard ring + leftover chrome types; add Melancia 1/4. */
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

async function leftoverSearchRing(page, label) {
  await page.evaluate(() => {
    const clear = document.getElementById('search-clear');
    if (clear) clear.classList.remove('visible');
  });
  await page.focus('#search-input');
  const ring = await page.evaluate(() => {
    const search = document.getElementById('search-input');
    const active = document.activeElement === search;
    if (!active && search) search.focus();
    const cs = search ? getComputedStyle(search) : null;
    return {
      active: document.activeElement === search,
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      outlineColor: cs ? cs.outlineColor : '',
      boxShadow: cs ? cs.boxShadow : '',
    };
  });
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  const hasShadow = ring.boxShadow && ring.boxShadow !== 'none';
  ok(ring.active, `${label}: leftover catalog search is focused`);
  ok(hasOutline || hasShadow,
    `${label}: leftover catalog search keyboard ring (outline=${ring.outlineStyle}/${ring.outlineWidth}, shadow=${ring.boxShadow})`);
}

async function leftoverChromeTypes(page, label) {
  const types = await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const close = document.querySelector('.mobile-close');
    const clear = document.getElementById('search-clear');
    const sort = document.getElementById('price-sort');
    const filter = document.getElementById('filter-preco');
    return {
      hamburgerType: hamburger ? hamburger.getAttribute('type') : '',
      hamburgerLabel: hamburger ? hamburger.getAttribute('aria-label') || '' : '',
      closeType: close ? close.getAttribute('type') : '',
      closeLabel: close ? close.getAttribute('aria-label') || '' : '',
      clearType: clear ? clear.getAttribute('type') : '',
      clearLabel: clear ? clear.getAttribute('aria-label') || '' : '',
      sortTag: sort ? sort.tagName : '',
      filterTag: filter ? filter.tagName : '',
    };
  });
  ok(types.hamburgerType === 'button', `${label}: leftover hamburger type=button`);
  ok(types.hamburgerLabel === 'Menu', `${label}: leftover hamburger name stays Menu`);
  ok(types.closeType === 'button', `${label}: leftover mobile-close type=button`);
  ok(types.closeLabel === 'Fechar menu', `${label}: leftover mobile-close named Fechar menu`);
  ok(types.clearType === 'button', `${label}: leftover search-clear type=button`);
  ok(types.clearLabel === 'Limpar pesquisa', `${label}: leftover search-clear name stays Limpar pesquisa`);
  ok(types.sortTag === 'SELECT' && types.filterTag === 'SELECT',
    `${label}: leftover sort/filter stay native selects`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverSearchRing(desktop, '1280');
  await leftoverChromeTypes(desktop, '1280');
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
  await leftoverChromeTypes(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-search-ring-chrome-types-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-search-ring-chrome-types-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
