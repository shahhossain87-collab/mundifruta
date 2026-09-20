#!/usr/bin/env node
/** Chrome: leftover header wordmark current on leftover #inicio; add Melancia 1/4. */
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

async function leftoverLogo(page, label) {
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
      logo: document.querySelector('#main-nav .logo')?.getAttribute('aria-current') || '',
      logoText: (document.querySelector('#main-nav .logo')?.textContent || '').replace(/\s+/g, ''),
      href: document.querySelector('#main-nav .logo')?.getAttribute('href') || '',
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
      barCurrent: [...document.querySelectorAll('#mobile-bar [aria-current], .nav-order[aria-current]')]
        .map(el => el.getAttribute('aria-current') || '').filter(Boolean),
      labels: [...document.querySelectorAll('#mobile-bar .mb-label')].map(el => (el.textContent || '').trim()),
      navOrder: (document.querySelector('.nav-order')?.textContent || '').replace(/\s+/g, ' ').trim(),
      crumbInicio: [...document.querySelectorAll('.shop-crumbs span')]
        .map(el => (el.textContent || '').trim()),
    });

    const first = snap();

    if (window.abrirCatalogo) window.abrirCatalogo('frutas');
    await new Promise(r => setTimeout(r, 700));
    const afterCatalog = snap();

    const logo = document.querySelector('#main-nav .logo');
    if (logo) logo.click();
    await new Promise(r => setTimeout(r, 700));
    const afterLogo = snap();

    return { morango, tomate, first, afterCatalog, afterLogo };
  });

  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(data.first.logo === 'page' && data.first.href === '#inicio' && data.first.logoText === 'MUNDIFRUTA',
    `${label}: leftover wordmark is current on first leftover #inicio (logo=${data.first.logo})`);
  ok(data.afterCatalog.logo === '',
    `${label}: leftover wordmark clears after leftover abrirCatalogo (logo=${data.afterCatalog.logo})`);
  ok(data.afterLogo.logo === 'page',
    `${label}: leftover wordmark is current after leftover logo tap (logo=${data.afterLogo.logo})`);
  ok(!data.first.headerCurrent && !data.afterCatalog.headerCurrent && !data.afterLogo.headerCurrent,
    `${label}: leftover header spy current stays for PR #92`);
  ok(!data.first.menuCurrent && !data.afterCatalog.menuCurrent,
    `${label}: leftover menu current stays for PR #93`);
  ok(!data.first.footerCurrent && !data.afterCatalog.footerCurrent,
    `${label}: leftover footer current stays for PR #93`);
  ok(data.first.crumbCurrent === '' && data.afterCatalog.crumbCurrent === '',
    `${label}: leftover crumb location stays for PR #92`);
  ok(data.first.hamburgerExpanded === '', `${label}: leftover hamburger stays without expanded`);
  ok(!data.first.catQuickCurrent && !data.afterCatalog.catQuickCurrent,
    `${label}: leftover cat-quick current stays for PR #94`);
  ok(data.first.barCurrent.length === 0 && data.afterCatalog.barCurrent.length === 0,
    `${label}: leftover mobile-bar / Encomendar current stays for PR #95`);
  ok(data.first.labels.join('|') === 'Carrinho|Promoções|WhatsApp|Como Chegar',
    `${label}: leftover 4-item labels stay (${data.first.labels.join('|')})`);
  ok(/Encomendar/.test(data.first.navOrder), `${label}: leftover header Encomendar copy stays`);
  ok(data.first.crumbInicio.includes('Início') && data.first.crumbInicio.includes('Loja'),
    `${label}: leftover Início / Loja crumbs stay`);
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
    await leftoverLogo(page, label);
    await addMelancia(page, label);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-logo-inicio-current-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-logo-inicio-current-browser: ok');
