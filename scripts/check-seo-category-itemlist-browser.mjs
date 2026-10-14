#!/usr/bin/env node
/** Chrome: leftover category ItemList JSON-LD; wrapping nav and homepage cart stay. */
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
  if (file.endsWith('/')) file += 'index.html';
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

async function openPage(page, path, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });
}

async function leftoverHomepage(page, label) {
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
  const burger = await page.$eval('.hamburger', el => el.getAttribute('aria-expanded'));
  ok(burger === null, `${label}: leftover hamburger stays without aria-expanded`);
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
  ok(added.ok && added.count === '1', `${label}: leftover add Melancia 1/4 (count=${added.count})`);
}

async function leftoverCategory(page, path, vw, vh, expectedName, label) {
  await openPage(page, path, vw, vh);
  const data = await page.evaluate(() => {
    const script = document.querySelector('script[type="application/ld+json"]');
    let jsonLd = null;
    try { jsonLd = JSON.parse(script ? script.textContent : 'null'); } catch (e) { jsonLd = { parseError: true }; }
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    const names = [...document.querySelectorAll('.seo-product-card h2')].map(el => (el.textContent || '').trim());
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map(link => link.getAttribute('href') || '')
      .find(href => href.includes('estilos.css')) || '';
    return { jsonLd, nav, h1, names, cssHref: css };
  });
  ok(data.jsonLd?.['@type'] === 'ItemList', `${label}: category JSON-LD is ItemList`);
  ok(data.jsonLd?.name === expectedName && data.h1 === expectedName, `${label}: leftover ItemList name stays ${expectedName}`);
  ok(Array.isArray(data.jsonLd?.itemListElement) && data.jsonLd.itemListElement.length > 0,
    `${label}: ItemList has leftover products`);
  const first = data.jsonLd?.itemListElement?.[0];
  ok(first?.['@type'] === 'ListItem' && first?.position === 1 && first?.url && first?.name,
    `${label}: first leftover ListItem has position/url/name`);
  ok(!first?.offers, `${label}: ItemList does not duplicate Offers`);
  ok(data.nav.join(' | ') === 'Início | Frutas | Legumes | Promoções',
    `${label}: leftover wrapping nav stays (${data.nav.join(' | ')})`);
  ok(!data.nav.includes('Ervas frescas') && !data.nav.includes('Cabazes'),
    `${label}: leftover wrapping nav is still the four-link first phase`);
  ok(data.cssHref.includes('estilos.css?v=65'), `${label}: generated CSS cache stays ?v=65`);
  return data;
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await desktop.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  const frutas = await leftoverCategory(desktop, '/categorias/frutas/', 1280, 800, 'Frutas', '1280 Frutas');
  ok(frutas.names.includes('Melancia 1/4'), '1280 Frutas: leftover Melancia 1/4 card stays');
  ok(frutas.jsonLd.itemListElement.some(item => item.name === 'Melancia 1/4' && /melancia-1-4/.test(item.url)),
    '1280 Frutas: leftover Melancia 1/4 is in ItemList');
  ok(frutas.jsonLd.itemListElement.some(item => item.name === 'Morango 500g' && /morango-500g/.test(item.url)),
    '1280 Frutas: leftover Morango 500g is in ItemList');

  await leftoverCategory(desktop, '/categorias/promocoes/', 1280, 800, 'Promoções', '1280 Promoções');

  await openPage(desktop, '/produtos/morango-500g/', 1280, 800);
  const product = await desktop.evaluate(() => {
    const jsonLd = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || 'null');
    return {
      type: jsonLd?.['@type'],
      name: jsonLd?.name,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      order: document.querySelector('.seo-order-link')?.getAttribute('href') || '',
    };
  });
  ok(product.type === 'Product', '1280 Morango: leftover Product JSON-LD stays');
  ok(product.name === 'Morango 500g' && product.h1 === 'Morango 500g', '1280 Morango: leftover name stays');
  ok(product.order === '/?produto=morango-500g#produtos', '1280 Morango: leftover order link stays');

  await openPage(desktop, '/', 1280, 800);
  await leftoverHomepage(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  const mobileFrutas = await leftoverCategory(mobile, '/categorias/frutas/', 390, 844, 'Frutas', '390 Frutas');
  ok(mobileFrutas.names.includes('Melancia 1/4'), '390 Frutas: leftover Melancia 1/4 card stays');
  ok(mobileFrutas.jsonLd?.['@type'] === 'ItemList', '390 Frutas: ItemList JSON-LD is present');

  await openPage(mobile, '/', 390, 844);
  await mobile.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await mobile.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await mobile.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  const bar = await mobile.evaluate(() => [...document.querySelectorAll('.mb-item')].map(el =>
    (el.textContent || '').replace(/\s+/g, ' ').trim()
  ));
  ok(bar.some(t => /Carrinho/i.test(t)) && bar.some(t => /Promoções/i.test(t))
    && bar.some(t => /WhatsApp/i.test(t)) && bar.some(t => /Como Chegar/i.test(t)) && bar.length === 4,
    `390: leftover 4-item bar stays (got ${bar.join(' / ')})`);
  await leftoverHomepage(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-category-itemlist-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-category-itemlist-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
