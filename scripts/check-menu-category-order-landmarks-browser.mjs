#!/usr/bin/env node
/** Chrome: leftover menu / category / order landmarks; add Melancia 1/4. */
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

async function leftoverLandmarks(page, label) {
  const data = await page.evaluate(() => {
    const menu = document.getElementById('mobile-menu');
    const shortcuts = document.querySelector('.cat-quick');
    const form = document.getElementById('order-form');
    const list = document.getElementById('order-list');
    const nav = document.getElementById('main-nav');
    const bar = document.getElementById('mobile-bar');
    const labels = [...document.querySelectorAll('.cat-quick .cq-label')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    return {
      menuTag: menu ? menu.tagName : '',
      menuLabel: menu ? menu.getAttribute('aria-label') || '' : '',
      shortcutTag: shortcuts ? shortcuts.tagName : '',
      shortcutLabel: shortcuts ? shortcuts.getAttribute('aria-label') || '' : '',
      formLabel: form ? form.getAttribute('aria-label') || '' : '',
      listLabel: list ? list.getAttribute('aria-label') || '' : '',
      mainNavLabel: nav ? nav.getAttribute('aria-label') : null,
      barLabel: bar ? bar.getAttribute('aria-label') : null,
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded'),
      labels,
    };
  });
  ok(data.menuTag === 'NAV' && data.menuLabel === 'Menu',
    `${label}: leftover mobile-menu is ${data.menuTag} "${data.menuLabel}"`);
  ok(data.shortcutTag === 'NAV' && data.shortcutLabel === 'Categorias e carrinho',
    `${label}: leftover cat-quick is ${data.shortcutTag} "${data.shortcutLabel}"`);
  ok(data.formLabel === 'Os Seus Dados', `${label}: leftover order-form is "${data.formLabel}"`);
  ok(data.listLabel === 'A Sua Encomenda', `${label}: leftover order-list is "${data.listLabel}"`);
  ok(data.mainNavLabel == null, `${label}: leftover main-nav stays unnamed (PR #74)`);
  ok(data.barLabel == null, `${label}: leftover mobile-bar stays unnamed (PR #74)`);
  ok(data.hamburgerExpanded == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
  ok(data.labels.some(t => /^Frutas/i.test(t)), `${label}: leftover shortcuts still list Frutas`);
  ok(data.labels.some(t => /^Carrinho/i.test(t)), `${label}: leftover shortcuts still list Carrinho`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverLandmarks(desktop, '1280');
  await addMelancia(desktop, '1280');

  const search = await desktop.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input) return { morango: 0, tomate: 0 };
    input.value = 'morango';
    if (window.pesquisar) window.pesquisar();
    const morango = document.querySelectorAll('.shop-main .product-card').length;
    input.value = 'tomate';
    if (window.pesquisar) window.pesquisar();
    const tomate = document.querySelectorAll('.shop-main .product-card').length;
    if (window.limparPesquisa) window.limparPesquisa();
    return { morango, tomate };
  });
  ok(search.morango >= 1, `1280: leftover search morango (${search.morango})`);
  ok(search.tomate >= 1, `1280: leftover search tomate (${search.tomate})`);

  const desktopMenu = await desktop.evaluate(() => {
    const menu = document.getElementById('mobile-menu');
    const cs = menu ? getComputedStyle(menu) : null;
    return { display: cs ? cs.display : '', open: menu ? menu.classList.contains('open') : false };
  });
  ok(desktopMenu.display === 'none' && desktopMenu.open === false,
    `1280: leftover mobile-menu stays closed (display=${desktopMenu.display})`);

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

  await leftoverLandmarks(mobile, '390');

  const opened = await mobile.evaluate(() => {
    if (window.toggleMenu) window.toggleMenu();
    const menu = document.getElementById('mobile-menu');
    const cs = menu ? getComputedStyle(menu) : null;
    const links = menu ? [...menu.querySelectorAll('a')].map(a => (a.textContent || '').trim()) : [];
    return {
      open: menu ? menu.classList.contains('open') : false,
      display: cs ? cs.display : '',
      label: menu ? menu.getAttribute('aria-label') || '' : '',
      links,
    };
  });
  ok(opened.open && opened.display === 'flex' && opened.label === 'Menu',
    `390: leftover hamburger still opens Menu (open=${opened.open}, display=${opened.display})`);
  ok(opened.links.includes('Produtos') && opened.links.includes('Encomendar'),
    `390: leftover menu links stay (${opened.links.join(', ')})`);
  await mobile.evaluate(() => { if (window.toggleMenu) window.toggleMenu(); });

  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-menu-category-order-landmarks-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-menu-category-order-landmarks-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
