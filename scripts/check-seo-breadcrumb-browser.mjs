#!/usr/bin/env node
/** Chrome: leftover catalog BreadcrumbList JSON-LD; wrapping nav and homepage cart stay. */
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

function pageCatalogMeta() {
  const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => {
    try { return JSON.parse(script.textContent || 'null'); } catch (e) { return { parseError: true }; }
  });
  const breadcrumbs = blocks.find(block => block && block['@type'] === 'BreadcrumbList') || null;
  const product = blocks.find(block => block && block['@type'] === 'Product') || null;
  const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
  const crumbText = (document.querySelector('.seo-breadcrumbs')?.textContent || '').replace(/\s+/g, ' ').trim();
  const h1 = document.querySelector('h1')?.textContent?.trim() || '';
  const names = [...document.querySelectorAll('.seo-product-card h2')].map(el => (el.textContent || '').trim());
  const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map(link => link.getAttribute('href') || '')
    .find(href => href.includes('estilos.css')) || '';
  return { breadcrumbs, product, firstType: blocks[0]?.['@type'] || null, nav, crumbText, h1, names, cssHref: css };
}

async function leftoverCategory(page, path, vw, vh, expectedName, canonical, label) {
  await openPage(page, path, vw, vh);
  const data = await page.evaluate(pageCatalogMeta);
  const crumbs = data.breadcrumbs?.itemListElement || [];
  ok(data.breadcrumbs?.['@type'] === 'BreadcrumbList', `${label}: category JSON-LD includes BreadcrumbList`);
  ok(crumbs.length === 2, `${label}: leftover category trail has 2 items (got ${crumbs.length})`);
  ok(crumbs[0]?.position === 1 && crumbs[0]?.name === 'Início' && crumbs[0]?.item === 'https://mundifruta.com/',
    `${label}: leftover Início crumb stays`);
  ok(crumbs[1]?.position === 2 && crumbs[1]?.name === expectedName && crumbs[1]?.item === canonical,
    `${label}: leftover ${expectedName} crumb stays`);
  ok(data.h1 === expectedName, `${label}: leftover h1 stays ${expectedName}`);
  ok(data.crumbText.includes('Início') && data.crumbText.includes(expectedName),
    `${label}: leftover visible breadcrumbs stay (${data.crumbText})`);
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

  const frutas = await leftoverCategory(
    desktop, '/categorias/frutas/', 1280, 800, 'Frutas',
    'https://mundifruta.com/categorias/frutas/', '1280 Frutas'
  );
  ok(frutas.names.includes('Melancia 1/4'), '1280 Frutas: leftover Melancia 1/4 card stays');
  ok(frutas.names.includes('Morango 500g'), '1280 Frutas: leftover Morango 500g card stays');

  await leftoverCategory(
    desktop, '/categorias/promocoes/', 1280, 800, 'Promoções',
    'https://mundifruta.com/categorias/promocoes/', '1280 Promoções'
  );

  await leftoverCategory(
    desktop, '/categorias/cabazes/', 1280, 800, 'Cabazes',
    'https://mundifruta.com/categorias/cabazes/', '1280 Cabazes'
  );

  await openPage(desktop, '/produtos/morango-500g/', 1280, 800);
  const product = await desktop.evaluate(pageCatalogMeta);
  const productCrumbs = product.breadcrumbs?.itemListElement || [];
  ok(product.firstType === 'Product', '1280 Morango: leftover Product JSON-LD stays first');
  ok(product.product?.name === 'Morango 500g' && product.h1 === 'Morango 500g', '1280 Morango: leftover name stays');
  ok(product.breadcrumbs?.['@type'] === 'BreadcrumbList', '1280 Morango: leftover BreadcrumbList is present');
  ok(productCrumbs[0]?.name === 'Início' && productCrumbs[0]?.item === 'https://mundifruta.com/',
    '1280 Morango: leftover Início crumb stays');
  ok(productCrumbs[1]?.name === 'Frutas' && productCrumbs[1]?.item === 'https://mundifruta.com/categorias/frutas/',
    '1280 Morango: leftover Frutas crumb stays');
  ok(productCrumbs[2]?.name === 'Morango 500g' && productCrumbs[2]?.item === 'https://mundifruta.com/produtos/morango-500g/',
    '1280 Morango: leftover product crumb stays');
  ok(product.crumbText.includes('Início') && product.crumbText.includes('Frutas') && product.crumbText.includes('Morango 500g'),
    `1280 Morango: leftover visible breadcrumbs stay (${product.crumbText})`);
  const order = await desktop.$eval('.seo-order-link', el => el.getAttribute('href'));
  ok(order === '/?produto=morango-500g#produtos', '1280 Morango: leftover order link stays');

  await openPage(desktop, '/', 1280, 800);
  await leftoverHomepage(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  const mobileFrutas = await leftoverCategory(
    mobile, '/categorias/frutas/', 390, 844, 'Frutas',
    'https://mundifruta.com/categorias/frutas/', '390 Frutas'
  );
  ok(mobileFrutas.names.includes('Melancia 1/4'), '390 Frutas: leftover Melancia 1/4 card stays');
  ok(mobileFrutas.breadcrumbs?.['@type'] === 'BreadcrumbList', '390 Frutas: BreadcrumbList JSON-LD is present');

  await openPage(mobile, '/produtos/morango-500g/', 390, 844);
  const mobileProduct = await mobile.evaluate(pageCatalogMeta);
  ok(mobileProduct.firstType === 'Product', '390 Morango: leftover Product JSON-LD stays first');
  ok(mobileProduct.breadcrumbs?.itemListElement?.[2]?.name === 'Morango 500g',
    '390 Morango: leftover product crumb stays');

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
    console.error('check-seo-breadcrumb-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-breadcrumb-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
