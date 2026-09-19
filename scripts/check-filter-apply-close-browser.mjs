#!/usr/bin/env node
/** Chrome: subcategory / chip / price apply closes the ≤900px drawer; add Melancia 1/4. */
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

async function openDrawer(page) {
  return page.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const sb = document.getElementById('shop-sidebar');
    if (filt) filt.click();
    return {
      open: !!(sb && sb.classList.contains('open')),
      body: document.body.classList.contains('filtros-open'),
    };
  });
}

async function checkMobileApplies(page) {
  await resetFrutas(page);

  const opened = await openDrawer(page);
  ok(opened.open && opened.body, '390: Filtros opens the drawer');

  const afterSub = await page.evaluate(() => {
    const chip = [...document.querySelectorAll('.subcat-chip')]
      .find(b => /citrinos/i.test(b.textContent || ''));
    if (chip) chip.click();
    const names = [...document.querySelectorAll('.shop-main .product-name')].map(n => n.textContent.trim());
    const sb = document.getElementById('shop-sidebar');
    const selected = [...document.querySelectorAll('.subcat-chip.active')].map(b => b.textContent.trim());
    return {
      open: !!(sb && sb.classList.contains('open')),
      body: document.body.classList.contains('filtros-open'),
      crumb: document.getElementById('crumb-cat')?.textContent,
      names,
      chipActive: selected.some(t => /citrinos/i.test(t)),
    };
  });
  ok(!afterSub.open && !afterSub.body, '390: picking a subcategory closes the drawer');
  ok(afterSub.chipActive, '390: Citrinos chip stays selected');
  ok(afterSub.crumb === 'Frutas', '390: catalog crumb stays Frutas after a subcategory');
  ok(afterSub.names.length > 0 && afterSub.names.every(n => /laranja|lim[aã]o|lima|tangerina|marcott|clementina/i.test(n)),
    `390: citrinos grid looks like citrus (got ${afterSub.names.join(', ') || 'empty'})`);

  await resetFrutas(page);
  const openedChip = await openDrawer(page);
  ok(openedChip.open, '390: Filtros reopens for the promo chip');
  const afterChip = await page.evaluate(() => {
    const chip = document.getElementById('filter-promo');
    if (chip) chip.click();
    const sb = document.getElementById('shop-sidebar');
    const names = [...document.querySelectorAll('.shop-main .product-name')].map(n => n.textContent.trim());
    return {
      open: !!(sb && sb.classList.contains('open')),
      pressed: chip?.getAttribute('aria-pressed'),
      names,
    };
  });
  ok(!afterChip.open, '390: tapping Em promoção closes the drawer');
  ok(afterChip.pressed === 'true', '390: Em promoção stays pressed');
  ok(afterChip.names.length > 0, `390: promo filter still shows products (got ${afterChip.names.length})`);

  await resetFrutas(page);
  await page.evaluate(() => { if (window.mudarPagina) window.mudarPagina(1); });
  const openedPrice = await openDrawer(page);
  ok(openedPrice.open, '390: Filtros reopens for the price select');
  const afterPrice = await page.evaluate(() => {
    const sel = document.getElementById('filter-preco');
    if (sel) {
      sel.value = '0-2';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const sb = document.getElementById('shop-sidebar');
    const pageLabel = document.querySelector('#pagination-catalog span')?.textContent || '';
    const names = [...document.querySelectorAll('.shop-main .product-name')].map(n => n.textContent.trim());
    return {
      open: !!(sb && sb.classList.contains('open')),
      value: sel?.value,
      pageLabel,
      names,
    };
  });
  ok(!afterPrice.open, '390: choosing a price range closes the drawer');
  ok(afterPrice.value === '0-2', '390: price select stays Até 2 €');
  ok(!/Página [2-9]/.test(afterPrice.pageLabel), `390: price filter starts on page 1 (got "${afterPrice.pageLabel || 'no pagination'}")`);
  ok(afterPrice.names.length > 0, `390: Até 2 € still shows products (got ${afterPrice.names.length})`);
}

async function checkDesktopApplies(page) {
  await resetFrutas(page);
  const info = await page.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const filtVisible = filt && getComputedStyle(filt).display !== 'none';
    const chip = [...document.querySelectorAll('.subcat-chip')]
      .find(b => /citrinos/i.test(b.textContent || ''));
    if (chip) chip.click();
    const sb = document.getElementById('shop-sidebar');
    const names = [...document.querySelectorAll('.shop-main .product-name')].map(n => n.textContent.trim());
    const sidebarBox = sb ? sb.getBoundingClientRect() : null;
    return {
      filtVisible,
      drawerOpen: !!(sb && sb.classList.contains('open')),
      sidebarVisible: !!(sidebarBox && sidebarBox.width > 40 && sidebarBox.height > 40),
      crumb: document.getElementById('crumb-cat')?.textContent,
      names,
    };
  });
  ok(!info.filtVisible, '1280: Filtros button stays hidden on desktop');
  ok(!info.drawerOpen, '1280: desktop sidebar is not a drawer');
  ok(info.sidebarVisible, '1280: sticky sidebar stays on screen after a subcategory');
  ok(info.crumb === 'Frutas', '1280: catalog crumb stays Frutas');
  ok(info.names.length > 0 && info.names.every(n => /laranja|lim[aã]o|lima|tangerina|marcott|clementina/i.test(n)),
    `1280: citrinos grid looks like citrus (got ${info.names.join(', ') || 'empty'})`);

  await resetFrutas(page);
  const price = await page.evaluate(() => {
    const sel = document.getElementById('filter-preco');
    if (sel) {
      sel.value = '5-999';
      if (window.aplicarFiltroPreco) window.aplicarFiltroPreco();
    }
    const sb = document.getElementById('shop-sidebar');
    return {
      value: sel?.value,
      drawerOpen: !!(sb && sb.classList.contains('open')),
      sidebarOn: !!(sb && sb.getBoundingClientRect().width > 40),
    };
  });
  ok(price.value === '5-999', '1280: price filter still applies');
  ok(!price.drawerOpen && price.sidebarOn, '1280: price apply does not hide the sticky sidebar');
}

async function addMelancia(page, vw) {
  const cart = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/.test(c.textContent || ''));
    const add = card?.querySelector('.add-btn');
    if (add) add.click();
    const badge = document.getElementById('cart-count');
    return badge ? badge.textContent.trim() : '';
  });
  ok(cart === '1', `${vw}: adding Melancia 1/4 still updates the cart (got "${cart}")`);
}

try {
  const mobile = await browser.newPage();
  await openReady(mobile, 390, 844);
  await checkMobileApplies(mobile);
  await addMelancia(mobile, 390);
  await mobile.close();

  const desktop = await browser.newPage();
  await openReady(desktop, 1280, 800);
  await checkDesktopApplies(desktop);
  await addMelancia(desktop, 1280);
  await desktop.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-filter-apply-close-browser failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('check-filter-apply-close-browser: ok');
