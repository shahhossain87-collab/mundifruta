#!/usr/bin/env node
/** Chrome: leftover badge / origin / cart / toast marks; add Melancia 1/4. */
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

async function leftoverCatalogMarks(page, label) {
  const data = await page.evaluate(() => {
    const info = (el) => {
      if (!el) return null;
      return {
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').replace(/\s+/g, ' ').trim()),
      };
    };
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Morango 500g/i.test(c.textContent || ''));
    return {
      badge: info(card?.querySelector('.product-badge')),
      top: info(card?.querySelector('.top-badge')),
      origem: info(card?.querySelector('.product-origem')),
      morangoBadge: info(morango?.querySelector('.product-badge')),
      feature: info(document.querySelector('.feature-badge')),
      featureTop: info(document.querySelector('.feature-photo .top-badge, .feature-product .top-badge')),
      hamburger: document.querySelector('.hamburger')?.getAttribute('aria-expanded') || null,
      filtHidden: document.querySelector('.filtbtn')
        ? [...document.querySelector('.filtbtn').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      promoHidden: document.getElementById('filter-promo')
        ? [...document.getElementById('filter-promo').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      shopHidden: document.querySelector('.shop-link')
        ? [...document.querySelector('.shop-link').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      heroHidden: document.querySelector('.hero-chip')
        ? [...document.querySelector('.hero-chip').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      contact: document.querySelector('.contact-icon')?.getAttribute('aria-hidden') || null,
      ticker: document.querySelector('.announcement-track > span')
        ? [...document.querySelector('.announcement-track > span').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      scrollHidden: document.getElementById('scroll-top')
        ? [...document.getElementById('scroll-top').querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      searchClear: (document.getElementById('search-clear')?.textContent || '').trim(),
      addText: (card?.querySelector('.add-btn')?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });

  ok(data.badge && /Verão/.test(data.badge.text) && data.badge.hidden.some(m => /🌞/.test(m)),
    `${label}: leftover Melancia badge mark is hidden`);
  ok(data.top && /Mais vendido/.test(data.top.text) && data.top.hidden.some(m => /⭐/.test(m)),
    `${label}: leftover top-seller mark is hidden`);
  ok(data.origem && /Marrocos/.test(data.origem.text) && data.origem.hidden.some(m => /🌍/.test(m)),
    `${label}: leftover origin mark is hidden`);
  ok(data.morangoBadge && /Popular/.test(data.morangoBadge.text) && data.morangoBadge.hidden.some(m => /🔥/.test(m)),
    `${label}: leftover Morango badge mark is hidden`);
  ok(data.feature && data.feature.hidden.length > 0 && /Verão|Popular|Premium|Bio|Promoção/.test(data.feature.text),
    `${label}: leftover featured badge mark is hidden`);
  ok(data.addText === '＋ Adicionar', `${label}: leftover catalog add stays ＋ Adicionar`);
  ok(data.searchClear === '✕', `${label}: leftover search-clear stays a bare ✕ (PR #86)`);
  ok(data.filtHidden === 0 && data.promoHidden === 0 && data.shopHidden === 0,
    `${label}: must not hide leftover Filtros / filter-chip / shop-link marks (PR #83 / #82)`);
  ok(data.heroHidden === 0 && data.contact !== 'true' && data.ticker === 0 && data.scrollHidden === 0,
    `${label}: must not hide leftover hero / contact / ticker / scroll-top marks`);
  ok(data.hamburger == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
}

async function leftoverCartToast(page, label) {
  const data = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    const toast = document.getElementById('toast');
    const addToast = {
      text: (toast?.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: toast
        ? [...toast.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').replace(/\s+/g, ' ').trim())
        : [],
    };
    const line = document.querySelector('.order-item-main');
    const remove = document.querySelector('.order-remove');
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      addToast,
      line: line ? {
        text: (line.textContent || '').replace(/\s+/g, ' ').trim(),
        hidden: [...line.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').replace(/\s+/g, ' ').trim()),
      } : null,
      remove: remove ? {
        label: remove.getAttribute('aria-label'),
        hidden: [...remove.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
        text: (remove.textContent || '').trim(),
      } : null,
    };
  });

  ok(data.ok && data.count === '1', `${label}: add Melancia 1/4 (count=${data.count})`);
  ok(data.addToast && /Melancia 1\/4 adicionado/.test(data.addToast.text) && data.addToast.hidden.some(m => /✓/.test(m)),
    `${label}: leftover add-toast mark is hidden`);
  ok(data.line && /Melancia 1\/4/.test(data.line.text) && data.line.hidden.some(m => /🍉/.test(m)),
    `${label}: leftover cart-line emoji is hidden`);
  ok(data.remove && data.remove.label === 'Remover Melancia 1/4' && data.remove.hidden.includes('×'),
    `${label}: leftover order-remove mark is hidden`);

  const removed = await page.evaluate(() => {
    const remove = document.querySelector('.order-remove');
    if (remove) remove.click();
    const toast = document.getElementById('toast');
    return {
      count: document.getElementById('cart-count')?.textContent || '',
      toast: (toast?.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: toast
        ? [...toast.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').replace(/\s+/g, ' ').trim())
        : [],
      empty: (document.querySelector('.empty-msg')?.textContent || '').trim(),
    };
  });
  ok(removed.count === '0' && /Melancia 1\/4 removido/.test(removed.toast) && removed.hidden.some(m => /🍉/.test(m)),
    `${label}: leftover remove-toast mark is hidden`);
  ok(/Sem artigos ainda/.test(removed.empty), `${label}: leftover empty-cart copy stays`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCatalogMarks(desktop, '1280');
  await leftoverCartToast(desktop, '1280');

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

  await leftoverCatalogMarks(mobile, '390');
  await leftoverCartToast(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-badge-cart-toast-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-badge-cart-toast-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
