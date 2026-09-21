#!/usr/bin/env node
/** Chrome: leftover hamburger Menu vs leftover 4-item bar; search + add Melancia 1/4. */
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

async function leftoverMenuBar(page, label, mobile) {
  const info = await page.evaluate((isMobile) => {
    const menu = document.getElementById('mobile-menu');
    const bar = document.getElementById('mobile-bar');
    const ham = document.querySelector('.hamburger');
    const close = document.querySelector('.mobile-close');
    const styleOf = (el) => el ? getComputedStyle(el) : null;
    const menuCs = styleOf(menu);
    const barCs = styleOf(bar);
    const closeCs = styleOf(close);
    const out = {
      menuZ: menuCs ? menuCs.zIndex : '',
      barZ: barCs ? barCs.zIndex : '',
      announcementZ: getComputedStyle(document.querySelector('.announcement-bar') || document.body).zIndex,
      navZ: getComputedStyle(document.getElementById('main-nav') || document.body).zIndex,
      overflowY: menuCs ? menuCs.overflowY : '',
      overscroll: menuCs ? menuCs.overscrollBehavior : '',
      closePosition: closeCs ? closeCs.position : '',
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      open: false,
      bodyOverflow: '',
      labels: [],
      contactTop: null,
      barTop: null,
    };
    if (isMobile && window.toggleMenu) {
      window.toggleMenu();
      out.open = !!(menu && menu.classList.contains('open'));
      out.bodyOverflow = getComputedStyle(document.body).overflow;
      out.labels = [...(menu ? menu.querySelectorAll('a') : [])].map(a =>
        (a.textContent || '').replace(/\s+/g, ' ').trim()
      );
      const contact = menu && [...menu.querySelectorAll('a')].find(a => /Contacto/i.test(a.textContent || ''));
      out.contactTop = contact ? contact.getBoundingClientRect().top : null;
      out.barTop = bar ? bar.getBoundingClientRect().top : null;
      out.menuZOpen = getComputedStyle(menu).zIndex;
      out.barZOpen = getComputedStyle(bar).zIndex;
      window.toggleMenu();
    }
    return out;
  }, mobile);

  ok(String(info.menuZ) === '1300' || Number(info.menuZ) >= 1300, `${label}: leftover hamburger Menu z-index is 1300 (got "${info.menuZ}")`);
  ok(
    info.overflowY === 'auto' || info.overflowY === 'scroll',
    `${label}: leftover hamburger Menu stays a vertical scroller (got "${info.overflowY}")`
  );
  ok(!/contain/i.test(info.overscroll || ''), `${label}: leftover mobile-menu overscroll stays for PR #98 (got "${info.overscroll}")`);
  ok(info.closePosition === 'fixed', `${label}: leftover hamburger close stays fixed (got "${info.closePosition}")`);
  ok(info.hamburgerExpanded == null, `${label}: leftover hamburger stays without aria-expanded`);
  if (mobile) {
    ok(info.open, `${label}: leftover hamburger Menu still opens`);
    ok(/hidden/i.test(info.bodyOverflow || ''), `${label}: leftover open Menu locks page scroll (got "${info.bodyOverflow}")`);
    ok(info.labels.some(t => /Promoções/i.test(t)), `${label}: leftover Menu still lists Promoções`);
    ok(info.labels.some(t => /Cabazes/i.test(t)), `${label}: leftover Menu still lists Cabazes`);
    ok(info.labels.some(t => /Como Funciona/i.test(t)), `${label}: leftover Menu still lists Como Funciona`);
    ok(info.labels.some(t => /Produtos/i.test(t)), `${label}: leftover Menu still lists Produtos`);
    ok(info.labels.some(t => /Quem Somos/i.test(t)), `${label}: leftover Menu still lists Quem Somos`);
    ok(info.labels.some(t => /Avaliações/i.test(t)), `${label}: leftover Menu still lists Avaliações`);
    ok(info.labels.some(t => /Encomendar/i.test(t)), `${label}: leftover Menu still lists Encomendar`);
    ok(info.labels.some(t => /Contacto/i.test(t)), `${label}: leftover Menu still lists Contacto`);
    ok(Number(info.menuZOpen) > Number(info.barZOpen), `${label}: leftover Menu stacks above leftover 4-item bar (${info.menuZOpen} vs ${info.barZOpen})`);
  }
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverMenuBar(desktop, '1280', false);
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

  await leftoverMenuBar(mobile, '390', true);
  await searchCatalog(mobile, '390');
  await addMelancia(mobile, '390');

  const landscape = await browser.newPage();
  landscape.on('pageerror', err => errors.push('390x500 pageerror: ' + err.message));
  await openReady(landscape, 390, 500);
  await leftoverMenuBar(landscape, '390x500', true);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-menu-bar-scroll-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-menu-bar-scroll-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
