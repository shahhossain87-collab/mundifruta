#!/usr/bin/env node
/** Chrome: leftover product-page Ver no catálogo e encomendar keyboard forest ring. */
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

async function leftoverOrderRing(page, label) {
  await page.setViewport({
    width: label.startsWith('390') ? 390 : 1280,
    height: label.startsWith('390') ? 844 : 800,
    deviceScaleFactor: 1,
    isMobile: label.startsWith('390'),
  });
  await page.goto(new URL('produtos/melancia-1-4/', base).href, { waitUntil: 'networkidle0', timeout: 60000 });

  const product = await page.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    const cs = order ? getComputedStyle(order) : null;
    return {
      text: (order?.textContent || '').trim(),
      href: order ? order.getAttribute('href') : '',
      classes: order ? order.className : '',
      display: cs ? cs.display : '',
      minHeight: cs ? cs.minHeight : '',
      width: order ? order.getBoundingClientRect().width : 0,
      parentWidth: order && order.parentElement ? order.parentElement.getBoundingClientRect().width : 0,
      nav: [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim()),
      crumbs: [...document.querySelectorAll('.seo-breadcrumbs a')].map(a => (a.textContent || '').trim()),
      hamburger: !!document.querySelector('.hamburger'),
      crawl: document.querySelectorAll('.seo-crawl-links a').length,
      textLink: !!document.querySelector('.seo-text-link'),
    };
  });
  ok(product.text === 'Ver no catálogo e encomendar',
    `${label}: leftover order CTA stays (${product.text})`);
  ok(product.href === '/?produto=melancia-1-4#produtos',
    `${label}: leftover order CTA still points at catalog (got ${product.href})`);
  ok(/\bbtn-prim\b/.test(product.classes) && /\bseo-order-link\b/.test(product.classes),
    `${label}: leftover order CTA stays btn-prim seo-order-link`);
  ok(product.display === 'inline-block',
    `${label}: leftover order CTA stays display:inline-block (got ${product.display})`);
  ok(product.minHeight === '0px' || product.minHeight === 'auto' || product.minHeight === '',
    `${label}: leftover order CTA stays without combined 44px tap (minHeight=${product.minHeight})`);
  if (!label.startsWith('390')) {
    ok(product.width < product.parentWidth - 24,
      `${label}: leftover order CTA stays hugging the label, not full-width (width=${product.width}, parent=${product.parentWidth})`);
  }
  ok(product.nav.includes('Frutas') && product.nav.includes('Legumes') && product.nav.includes('Promoções'),
    `${label}: leftover wrapping Frutas / Legumes / Promoções stay (${product.nav.join(', ')})`);
  ok(product.crumbs[0] === 'Início' && product.crumbs.includes('Frutas'),
    `${label}: leftover product breadcrumb stays Início / Frutas (got ${product.crumbs.join(', ')})`);
  ok(!product.hamburger, `${label}: leftover product page stays without a hamburger`);
  ok(product.crawl === 0, `${label}: leftover product page stays without homepage crawl chips`);
  ok(!product.textLink, `${label}: leftover product page stays without Ver produto`);

  await page.$eval('.seo-breadcrumbs a:last-of-type', el => el.scrollIntoView({ block: 'center' }));
  await page.focus('.seo-breadcrumbs a:last-of-type');
  await page.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 50));
  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    const cs = active ? getComputedStyle(active) : null;
    return {
      tag: active ? active.tagName : '',
      text: active ? (active.textContent || '').trim() : '',
      href: active && active.getAttribute ? active.getAttribute('href') : '',
      cls: active ? active.className : '',
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      outlineColor: cs ? cs.outlineColor : '',
    };
  });
  ok(ring.tag === 'A' && /seo-order-link/.test(ring.cls) && ring.text === 'Ver no catálogo e encomendar',
    `${label}: Tab from leftover Frutas breadcrumb lands on leftover order CTA (got ${ring.tag} "${ring.text}" ${ring.cls})`);
  ok(ring.href === '/?produto=melancia-1-4#produtos',
    `${label}: leftover focused order CTA still points at catalog (got ${ring.href})`);
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') >= 3;
  ok(hasOutline && /27,\s*67,\s*50/.test(ring.outlineColor),
    `${label}: leftover SEO order-link keyboard forest ring (outline=${ring.outlineStyle}/${ring.outlineWidth} ${ring.outlineColor})`);
}

async function leftoverCategoryStay(page, label) {
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(new URL('categorias/frutas/', base).href, { waitUntil: 'networkidle0', timeout: 60000 });
  const category = await page.evaluate(() => ({
    nav: [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim()),
    crumbs: [...document.querySelectorAll('.seo-breadcrumbs a')].map(a => (a.textContent || '').trim()),
    textLink: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    order: document.querySelectorAll('.seo-order-link').length,
    hamburger: !!document.querySelector('.hamburger'),
  }));
  ok(category.nav.includes('Frutas') && category.nav.includes('Legumes') && category.nav.includes('Promoções'),
    `${label}: leftover wrapping Frutas / Legumes / Promoções stay (${category.nav.join(', ')})`);
  ok(category.crumbs[0] === 'Início' && category.crumbs.length === 1,
    `${label}: leftover category breadcrumb stays Início only (got ${category.crumbs.join(', ')})`);
  ok(category.textLink === 'Ver produto', `${label}: leftover Ver produto stays`);
  ok(category.order === 0, `${label}: leftover category pages stay without the order CTA`);
  ok(!category.hamburger, `${label}: leftover SEO pages stay without a hamburger`);
}

async function openHome(page, vw, vh) {
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

try {
  const productDesktop = await browser.newPage();
  productDesktop.on('pageerror', err => errors.push('1280 product pageerror: ' + err.message));
  await leftoverOrderRing(productDesktop, '1280 product');

  const categoryPage = await browser.newPage();
  categoryPage.on('pageerror', err => errors.push('1280 category pageerror: ' + err.message));
  await leftoverCategoryStay(categoryPage, '1280 category');

  const productMobile = await browser.newPage();
  productMobile.on('pageerror', err => errors.push('390 product pageerror: ' + err.message));
  await leftoverOrderRing(productMobile, '390 product');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 home pageerror: ' + err.message));
  await openHome(desktop, 1280, 800);
  const addedDesktop = await desktop.evaluate(() => {
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
  ok(addedDesktop.ok && addedDesktop.count === '1',
    `1280 home: leftover add Melancia 1/4 (count=${addedDesktop.count})`);

  const crawl = await desktop.evaluate(() => {
    const el = document.querySelector('.seo-crawl-links a');
    if (!el) return { present: false };
    el.focus();
    const cs = getComputedStyle(el);
    return {
      present: true,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
    };
  });
  ok(crawl.present, '1280 home: leftover Explorar o catálogo chips stay');
  const crawlHasRing = crawl.outlineStyle && crawl.outlineStyle !== 'none' && parseFloat(crawl.outlineWidth || '0') >= 3;
  ok(!crawlHasRing, `1280 home: leftover crawl chips stay without this run's forest ring (outline=${crawl.outlineStyle}/${crawl.outlineWidth})`);

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 home pageerror: ' + err.message));
  await openHome(mobile, 390, 844);
  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390 home: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390 home: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390 home: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390 home: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390 home: leftover 4-item bar stays (got ${bar.length})`);

  const added = await mobile.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const plus = card.querySelectorAll('.qty-btn')[1];
    if (plus) plus.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '2', `390 home: leftover + increments Melancia 1/4 1→2 (count=${added.count})`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-order-link-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-order-link-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
