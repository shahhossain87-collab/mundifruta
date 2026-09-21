#!/usr/bin/env node
/** Chrome: leftover filter-drawer / menu overscroll; search + add Melancia 1/4. */
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

async function leftoverOverscroll(page, label, mobile) {
  const info = await page.evaluate((isMobile) => {
    const sb = document.getElementById('shop-sidebar');
    const menu = document.getElementById('mobile-menu');
    const ham = document.querySelector('.hamburger');
    const out = {
      sidebar: sb ? getComputedStyle(sb).overscrollBehavior : '',
      menu: menu ? getComputedStyle(menu).overscrollBehavior : '',
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : null,
      bodyOpen: '',
      drawerOpen: false,
    };
    if (isMobile && window.toggleFiltros) {
      window.toggleFiltros();
      out.drawerOpen = !!(sb && sb.classList.contains('open'));
      out.bodyOpen = getComputedStyle(document.body).overscrollBehavior;
      if (window.fecharFiltros) window.fecharFiltros();
    }
    return out;
  }, mobile);
  ok(/contain/i.test(info.sidebar), `${label}: leftover shop-sidebar overscroll is contain (got "${info.sidebar}")`);
  ok(/contain/i.test(info.menu), `${label}: leftover mobile-menu overscroll is contain (got "${info.menu}")`);
  ok(info.hamburgerExpanded == null, `${label}: leftover hamburger stays without aria-expanded`);
  if (mobile) {
    ok(info.drawerOpen, `${label}: leftover Filtros drawer still opens`);
    ok(/none/i.test(info.bodyOpen), `${label}: leftover body.filtros-open overscroll is none (got "${info.bodyOpen}")`);
  }
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverOverscroll(desktop, '1280', false);
  await searchCatalog(desktop, '1280');
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

  await leftoverOverscroll(mobile, '390', true);
  await searchCatalog(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filter-menu-overscroll-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filter-menu-overscroll-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
