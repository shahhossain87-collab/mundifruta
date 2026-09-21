#!/usr/bin/env node
/** Chrome: leftover CS-row overscroll; search + add Melancia 1/4. */
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

async function searchCatalog(page, label) {
  const hits = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { morango: 0, tomate: 0 };
    input.value = 'morango';
    window.pesquisar();
    const morango = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = 'tomate';
    window.pesquisar();
    const tomate = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = '';
    if (window.limparPesquisa) window.limparPesquisa();
    else if (window.limparTudo) window.limparTudo();
    return { morango, tomate };
  });
  ok(hits.morango >= 1, `${label}: leftover search morango (${hits.morango})`);
  ok(hits.tomate >= 1, `${label}: leftover search tomate (${hits.tomate})`);
}

async function leftoverCsRowOverscroll(page, label) {
  const info = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();

    const styleOf = (el) => el ? getComputedStyle(el).overscrollBehavior : '';
    const overflowXOf = (el) => el ? getComputedStyle(el).overflowX : '';
    const pop = document.getElementById('cs-pop');
    const popRow = document.getElementById('cs-pop-row');
    const cartRow = document.getElementById('crosssell-cart-row');
    const ham = document.querySelector('.hamburger');
    const carousel = document.querySelector('.feature-grid.carousel');
    const sb = document.getElementById('shop-sidebar');
    const menu = document.getElementById('mobile-menu');
    const product = document.getElementById('product-modal');
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      popHidden: pop ? pop.hidden : true,
      popTitle: document.getElementById('cs-pop-title')?.textContent || '',
      popCards: popRow ? popRow.querySelectorAll('.cs-card').length : 0,
      popOverscroll: styleOf(popRow),
      popOverflowX: overflowXOf(popRow),
      cartHidden: document.getElementById('crosssell-cart')?.hidden ?? true,
      cartCards: cartRow ? cartRow.querySelectorAll('.cs-card').length : 0,
      cartOverscroll: styleOf(cartRow),
      cartOverflowX: overflowXOf(cartRow),
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : null,
      carousel: carousel ? getComputedStyle(carousel).overscrollBehavior : '',
      sidebar: sb ? getComputedStyle(sb).overscrollBehavior : '',
      menu: menu ? getComputedStyle(menu).overscrollBehavior : '',
      product: product ? getComputedStyle(product).overscrollBehavior : '',
      popBox: pop ? getComputedStyle(pop).overscrollBehavior : '',
    };
  });

  ok(info.ok && info.count === '1', `${label}: add Melancia 1/4 (count=${info.count} reason=${info.reason || ''})`);
  ok(!info.popHidden, `${label}: leftover Combina bem popup still opens`);
  ok(
    /combina bem|também pode gostar/i.test(info.popTitle || ''),
    `${label}: leftover CS title stays (${info.popTitle})`
  );
  ok(info.popCards >= 1, `${label}: leftover #cs-pop-row still has cards (${info.popCards})`);
  ok(/contain/i.test(info.popOverscroll), `${label}: leftover #cs-pop-row overscroll is contain (got "${info.popOverscroll}")`);
  ok(
    info.popOverflowX === 'auto' || info.popOverflowX === 'scroll',
    `${label}: leftover #cs-pop-row stays a horizontal scroller (got "${info.popOverflowX}")`
  );
  ok(!info.cartHidden, `${label}: leftover Complete o seu pedido row still mounts`);
  ok(info.cartCards >= 1, `${label}: leftover #crosssell-cart-row still has cards (${info.cartCards})`);
  ok(/contain/i.test(info.cartOverscroll), `${label}: leftover #crosssell-cart-row overscroll is contain (got "${info.cartOverscroll}")`);
  ok(
    info.cartOverflowX === 'auto' || info.cartOverflowX === 'scroll',
    `${label}: leftover #crosssell-cart-row stays a horizontal scroller (got "${info.cartOverflowX}")`
  );
  ok(info.hamburgerExpanded == null, `${label}: leftover hamburger stays without aria-expanded`);
  ok(!/contain/i.test(info.carousel), `${label}: leftover featured-carousel overscroll stays for PR #99 (got "${info.carousel}")`);
  ok(!/contain/i.test(info.sidebar), `${label}: leftover shop-sidebar overscroll stays for PR #98 (got "${info.sidebar}")`);
  ok(!/contain/i.test(info.menu), `${label}: leftover mobile-menu overscroll stays for PR #98 (got "${info.menu}")`);
  ok(!/contain/i.test(info.product), `${label}: leftover product-modal overscroll stays for PR #27 (got "${info.product}")`);
  ok(!/contain/i.test(info.popBox), `${label}: leftover .cs-pop overlay overscroll stays (got "${info.popBox}")`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCsRowOverscroll(desktop, '1280');
  await searchCatalog(desktop, '1280');

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

  await leftoverCsRowOverscroll(mobile, '390');
  await searchCatalog(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cs-row-overscroll-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cs-row-overscroll-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
