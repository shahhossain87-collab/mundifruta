#!/usr/bin/env node
/** Chrome: leftover Phase A pagination 44px + status/focus; vertical tab arrows; add Melancia 1/4. */
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

async function openReady(page, vw, vh, extras = {}) {
  await page.emulateMediaFeatures(extras.media || []);
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

async function checkPagination(page, label) {
  await resetFrutas(page);
  const before = await page.evaluate(() => {
    const next = document.querySelector('#pagination-catalog button[aria-label="Página seguinte"]');
    const status = document.querySelector('#pagination-catalog [role="status"]');
    const box = next ? next.getBoundingClientRect() : { width: 0, height: 0 };
    return {
      nextH: Math.round(box.height),
      nextW: Math.round(box.width),
      status: status ? status.textContent.trim() : '',
      pages: (status && status.textContent.match(/de (\d+)/) || [])[1] || '',
    };
  });
  ok(before.nextH >= 44 && before.nextW >= 44,
    `${label}: Seguinte tap is ${before.nextW}×${before.nextH}, need ≥44`);
  ok(/^Página 1 de \d+$/.test(before.status),
    `${label}: first page status should read Página 1 de N (got "${before.status}")`);
  ok(Number(before.pages) >= 2, `${label}: Frutas should span more than one page`);

  const after = await page.evaluate(() => {
    const next = document.querySelector('#pagination-catalog button[aria-label="Página seguinte"]');
    if (next) next.click();
    const status = document.querySelector('#pagination-catalog [role="status"]');
    const grid = document.getElementById('grid-catalog');
    const names = [...document.querySelectorAll('.shop-main .product-name')].map(n => n.textContent.trim());
    return {
      status: status ? status.textContent.trim() : '',
      focus: document.activeElement && document.activeElement.id,
      label: grid ? grid.getAttribute('aria-label') : '',
      names,
    };
  });
  ok(/^Página 2 de \d+$/.test(after.status),
    `${label}: after Seguinte, status should be Página 2 (got "${after.status}")`);
  ok(after.focus === 'grid-catalog', `${label}: focus should move to #grid-catalog (got ${after.focus})`);
  ok(after.label === 'Frutas', `${label}: grid accessible name stays Frutas`);
  ok(after.names.length > 0, `${label}: page 2 still shows products`);
}

async function checkReducedMotion(page) {
  const behavior = await page.evaluate(() => {
    const orig = Element.prototype.scrollIntoView;
    let seen = '';
    Element.prototype.scrollIntoView = function (opts) {
      seen = opts && opts.behavior;
      return orig.apply(this, arguments);
    };
    if (window.mudarPagina) window.mudarPagina(1);
    Element.prototype.scrollIntoView = orig;
    return seen;
  });
  ok(behavior === 'auto', `reduced-motion page change should scroll with auto (got "${behavior}")`);
}

async function checkVerticalArrows(page) {
  await resetFrutas(page);
  const down = await page.evaluate(() => {
    const frutas = document.getElementById('tab-frutas');
    frutas.focus();
    frutas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    return {
      active: document.activeElement && document.activeElement.id,
      selected: [...document.querySelectorAll('.cat-tab[aria-selected="true"]')].map(t => t.id),
      crumb: document.getElementById('crumb-cat')?.textContent,
      grid: document.getElementById('grid-catalog')?.getAttribute('aria-label'),
    };
  });
  ok(down.active === 'tab-legumes', `1280: ArrowDown from Frutas focuses Legumes (got ${down.active})`);
  ok(down.selected.includes('tab-legumes') && !down.selected.includes('tab-frutas'),
    `1280: ArrowDown selects Legumes (got ${down.selected.join(',')})`);
  ok(down.crumb === 'Legumes' && down.grid === 'Legumes',
    `1280: catalog crumb/grid follow Legumes (crumb=${down.crumb}, grid=${down.grid})`);

  const up = await page.evaluate(() => {
    const legumes = document.getElementById('tab-legumes');
    legumes.focus();
    legumes.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    return {
      active: document.activeElement && document.activeElement.id,
      selected: [...document.querySelectorAll('.cat-tab[aria-selected="true"]')].map(t => t.id),
      crumb: document.getElementById('crumb-cat')?.textContent,
    };
  });
  ok(up.active === 'tab-frutas', `1280: ArrowUp from Legumes focuses Frutas (got ${up.active})`);
  ok(up.selected.includes('tab-frutas'), `1280: ArrowUp selects Frutas (got ${up.selected.join(',')})`);
  ok(up.crumb === 'Frutas', `1280: catalog crumb returns to Frutas (got ${up.crumb})`);
}

async function addMelancia(page, label) {
  await resetFrutas(page);
  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const btn = card && card.querySelector('.add-btn');
    if (btn) btn.click();
    const count = document.getElementById('cart-count');
    return {
      clicked: !!btn,
      count: count ? count.textContent.trim() : '',
    };
  });
  ok(added.clicked, `${label}: Melancia 1/4 add button is present`);
  ok(added.count === '1', `${label}: cart badge is 1 after add (got "${added.count}")`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkPagination(mobile, '390');
  await addMelancia(mobile, '390');
  await mobile.close();

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkPagination(desktop, '1280');
  await checkVerticalArrows(desktop);
  await addMelancia(desktop, '1280');
  await desktop.close();

  const reduce = await browser.newPage();
  reduce.on('pageerror', err => errors.push('reduce pageerror: ' + err.message));
  await openReady(reduce, 1280, 800, {
    media: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await checkReducedMotion(reduce);
  await reduce.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-catalog-nav-leftover-browser failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('check-catalog-nav-leftover-browser: ok');
