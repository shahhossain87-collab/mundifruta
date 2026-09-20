#!/usr/bin/env node
/** Chrome: leftover search-clear / sidebar-close / dialog-close / credits marks; add Melancia 1/4. */
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

async function openReady(page, vw, vh, path = '/') {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base.replace(/\/$/, '') + path, { waitUntil: 'networkidle0', timeout: 60000 });
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

async function leftoverMarks(page, label) {
  const data = await page.evaluate(() => {
    const info = (el) => {
      if (!el) return null;
      return {
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
        label: el.getAttribute('aria-label'),
      };
    };
    return {
      search: info(document.getElementById('search-clear')),
      sidebar: info(document.querySelector('.sidebar-close')),
      cs: info(document.querySelector('.cs-pop-close')),
      reveal: info(document.querySelector('.reveal-close')),
      privacy: info(document.querySelector('.privacy-close')),
      product: info(document.querySelector('.product-modal-close')),
      cabaz: info(document.querySelector('.cabaz-modal-close')),
      mobile: info(document.querySelector('.mobile-close')),
      filt: info(document.querySelector('.filtbtn')),
      promo: info(document.getElementById('filter-promo')),
      shop: info(document.querySelector('.shop-link')),
      heroChip: info(document.querySelector('.hero-chip')),
      contact: document.querySelector('.contact-icon')?.getAttribute('aria-hidden') || null,
      hamburger: document.querySelector('.hamburger')?.getAttribute('aria-expanded') || null,
      ticker: document.querySelector('.announcement-track > span')
        ? [...document.querySelector('.announcement-track > span').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      scrollHidden: document.getElementById('scroll-top')
        ? [...document.getElementById('scroll-top').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      optionalHidden: document.getElementById('order-optional-toggle')
        ? [...document.getElementById('order-optional-toggle').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
    };
  });

  ok(data.search && data.search.label === 'Limpar pesquisa' && data.search.hidden.includes('✕'),
    `${label}: leftover search-clear mark is hidden`);
  ok(data.sidebar && data.sidebar.label === 'Fechar filtros' && data.sidebar.hidden.includes('✕'),
    `${label}: leftover sidebar-close mark is hidden`);
  ok(data.cs && data.cs.label === 'Fechar' && data.cs.hidden.includes('✕'),
    `${label}: leftover cs-pop-close mark is hidden`);
  ok(data.reveal && data.reveal.label === 'Fechar oferta' && data.reveal.hidden.includes('✕'),
    `${label}: leftover reveal-close mark is hidden`);
  ok(data.privacy && data.privacy.label === 'Fechar' && data.privacy.hidden.includes('✕'),
    `${label}: leftover privacy-close mark is hidden`);
  ok(data.product && data.product.label === 'Fechar' && data.product.hidden.includes('✕'),
    `${label}: leftover product-modal-close mark is hidden`);
  ok(data.cabaz && data.cabaz.label === 'Fechar' && data.cabaz.hidden.includes('✕'),
    `${label}: leftover cabaz-modal-close mark is hidden`);
  ok(data.mobile && data.mobile.text === '✕' && data.mobile.hidden.length === 0 && data.mobile.label == null,
    `${label}: leftover mobile-close stays a bare ✕ (PR #63)`);

  ok((data.filt?.hidden || []).length === 0 && (data.promo?.hidden || []).length === 0 && (data.shop?.hidden || []).length === 0,
    `${label}: must not hide leftover Filtros / filter-chip / shop-link marks (PR #83 / #82)`);
  ok((data.heroChip?.hidden || []).length === 0 && data.contact !== 'true' && data.ticker === 0,
    `${label}: must not hide leftover hero / contact / ticker marks (PR #81 / #80 / #84)`);
  ok(data.scrollHidden === 0 && data.optionalHidden === 0,
    `${label}: must not hide leftover scroll-top / optional marks (PR #85)`);
  ok(data.hamburger == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
}

async function leftoverSearchClear(page, label) {
  const data = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    const clear = document.getElementById('search-clear');
    if (!input || !clear || !window.pesquisar || !window.limparPesquisa) {
      return { ok: false, reason: 'search controls missing' };
    }
    input.value = 'morango';
    window.pesquisar();
    const visibleAfterType = clear.classList.contains('visible');
    const cardsAfterType = document.querySelectorAll('.shop-main .product-card').length;
    clear.click();
    return {
      ok: true,
      visibleAfterType,
      cardsAfterType,
      valueAfter: input.value,
      visibleAfterClear: clear.classList.contains('visible'),
      cardsAfterClear: document.querySelectorAll('.shop-main .product-card').length,
    };
  });
  ok(data.ok && data.visibleAfterType && data.cardsAfterType >= 1,
    `${label}: leftover search-clear still appears after typing (${data.cardsAfterType})`);
  ok(data.valueAfter === '' && data.visibleAfterClear === false && data.cardsAfterClear > data.cardsAfterType,
    `${label}: leftover search-clear still clears the query`);
}

async function leftoverProductClose(page, label) {
  const data = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const photo = card.querySelector('.photo-wrap, button, img, .product-name');
    if (photo) photo.click();
    else card.click();
    const modal = document.getElementById('product-modal');
    const close = document.querySelector('.product-modal-close');
    const open = modal && (modal.classList.contains('open') || getComputedStyle(modal).visibility === 'visible');
    if (close) close.click();
    const closed = modal && !modal.classList.contains('open');
    return {
      ok: true,
      open: !!open,
      closed: !!closed,
      name: document.getElementById('product-modal-name')?.textContent || '',
    };
  });
  ok(data.ok && data.open, `${label}: leftover product modal still opens`);
  ok(data.closed, `${label}: leftover product-modal-close still closes`);
}

async function leftoverCredits(page, label) {
  await page.goto(base + 'creditos.html', { waitUntil: 'networkidle0', timeout: 60000 });
  const data = await page.evaluate(() => {
    const back = document.querySelector('.credits-back');
    if (!back) return null;
    return {
      text: (back.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...back.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
      href: back.getAttribute('href'),
      target: back.getAttribute('target'),
    };
  });
  ok(!!data && data.hidden.includes('←') && /Voltar à loja/.test(data.text),
    `${label}: leftover credits back arrow is hidden`);
  ok(data && data.href === 'index.html' && data.target == null,
    `${label}: leftover credits back stays same-tab index.html`);
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

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverMarks(desktop, '1280');
  await leftoverSearchClear(desktop, '1280');
  await leftoverProductClose(desktop, '1280');
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

  await leftoverCredits(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  await leftoverMarks(mobile, '390');
  await leftoverSearchClear(mobile, '390');
  await leftoverProductClose(mobile, '390');
  await addMelancia(mobile, '390');
  await leftoverCredits(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-close-credits-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-close-credits-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
