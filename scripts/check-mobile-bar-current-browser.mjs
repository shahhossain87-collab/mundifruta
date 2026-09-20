#!/usr/bin/env node
/** Chrome: leftover mobile-bar / Encomendar current markers; add Melancia 1/4. */
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

async function leftoverBar(page, label) {
  const data = await page.evaluate(async () => {
    const search = document.getElementById('search-input');
    if (search) {
      search.value = 'morango';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Morango/i.test(c.textContent || ''));
    if (search) {
      search.value = 'tomate';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Tomate/i.test(c.textContent || ''));
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));

    const snap = () => ({
      promo: document.querySelector('#mobile-bar [data-bar="promocoes"]')?.getAttribute('aria-current') || '',
      cart: document.querySelector('#mobile-bar [data-bar="encomenda"]')?.getAttribute('aria-current') || '',
      order: document.querySelector('.nav-order')?.getAttribute('aria-current') || '',
      wa: [...document.querySelectorAll('#mobile-bar a')]
        .find(a => /WhatsApp/i.test(a.textContent || ''))?.getAttribute('aria-current') || '',
      map: [...document.querySelectorAll('#mobile-bar a')]
        .find(a => /Como Chegar/i.test(a.textContent || ''))?.getAttribute('aria-current') || '',
      labels: [...document.querySelectorAll('#mobile-bar .mb-label')].map(el => (el.textContent || '').trim()),
      navOrder: (document.querySelector('.nav-order')?.textContent || '').replace(/\s+/g, ' ').trim(),
      headerCurrent: [...document.querySelectorAll('.nav-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      menuCurrent: [...document.querySelectorAll('#mobile-menu a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      footerCurrent: [...document.querySelectorAll('.footer-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      crumbCurrent: document.getElementById('crumb-cat')?.getAttribute('aria-current') || '',
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded') || '',
      catQuickCurrent: [...document.querySelectorAll('.cat-quick-btn')]
        .some(btn => btn.getAttribute('aria-current')),
    });

    const first = snap();

    const promoBtn = document.querySelector('#mobile-bar [data-bar="promocoes"]');
    if (promoBtn) promoBtn.click();
    const afterPromo = snap();

    if (window.irParaEncomenda) window.irParaEncomenda();
    const afterOrder = snap();

    if (window.continuarAComprar) window.continuarAComprar();
    const afterContinue = snap();

    return { morango, tomate, first, afterPromo, afterOrder, afterContinue };
  });

  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(data.first.promo === '' && data.first.cart === '' && data.first.order === '',
    `${label}: first leftover bar / Encomendar stay unmarked`);
  ok(data.afterPromo.promo === 'page' && data.afterPromo.cart === '' && data.afterPromo.order === '',
    `${label}: leftover Promoções is current after the leftover bar tap (promo=${data.afterPromo.promo})`);
  ok(data.afterOrder.cart === 'true' && data.afterOrder.order === 'true' && data.afterOrder.promo === '',
    `${label}: leftover Carrinho / Encomendar are current after irParaEncomenda`);
  ok(data.afterContinue.cart === '' && data.afterContinue.order === '' && data.afterContinue.promo === '',
    `${label}: leftover bar / Encomendar clear after continuarAComprar`);
  ok(data.afterOrder.wa === '' && data.afterOrder.map === '' && data.first.wa === '' && data.first.map === '',
    `${label}: leftover WhatsApp / Como Chegar stay unmarked`);
  ok(data.first.labels.join('|') === 'Carrinho|Promoções|WhatsApp|Como Chegar',
    `${label}: leftover 4-item labels stay (${data.first.labels.join('|')})`);
  ok(/Encomendar/.test(data.first.navOrder), `${label}: leftover header Encomendar copy stays`);
  ok(!data.first.headerCurrent && !data.afterOrder.headerCurrent,
    `${label}: leftover header spy current stays for PR #92`);
  ok(!data.first.menuCurrent && !data.afterOrder.menuCurrent,
    `${label}: leftover menu current stays for PR #93`);
  ok(!data.first.footerCurrent && !data.afterOrder.footerCurrent,
    `${label}: leftover footer current stays for PR #93`);
  ok(data.first.crumbCurrent === '' && data.afterOrder.crumbCurrent === '',
    `${label}: leftover crumb location stays for PR #92`);
  ok(data.first.hamburgerExpanded === '', `${label}: leftover hamburger stays without expanded`);
  ok(!data.first.catQuickCurrent && !data.afterOrder.catQuickCurrent,
    `${label}: leftover cat-quick current stays for PR #94`);
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
  for (const [vw, vh, label] of [[390, 844, '390'], [1280, 800, '1280']]) {
    const page = await browser.newPage();
    page.on('pageerror', err => errors.push(`${label} pageerror: ${err.message}`));
    await openReady(page, vw, vh);
    await leftoverBar(page, label);
    await addMelancia(page, label);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-mobile-bar-current-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-mobile-bar-current-browser: ok');
