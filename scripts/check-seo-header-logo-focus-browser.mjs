#!/usr/bin/env node
/** Chrome: leftover catalog header MUNDIFRUTA keyboard forest ring. */
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

async function leftoverHeaderLogoRing(page, path, label) {
  await page.setViewport({
    width: label.includes('390') ? 390 : 1280,
    height: label.includes('390') ? 844 : 800,
    deviceScaleFactor: 1,
    isMobile: label.includes('390'),
  });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });

  const header = await page.evaluate(() => {
    const logo = document.querySelector('.seo-header .logo');
    const cs = logo ? getComputedStyle(logo) : null;
    return {
      text: (logo?.textContent || '').replace(/\s+/g, ''),
      href: logo ? logo.getAttribute('href') : '',
      display: cs ? cs.display : '',
      minHeight: cs ? cs.minHeight : '',
      color: cs ? cs.color : '',
      nav: [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim()),
      crumbs: [...document.querySelectorAll('.seo-breadcrumbs a')].map(a => (a.textContent || '').trim()),
      hamburger: !!document.querySelector('.hamburger'),
      crawl: document.querySelectorAll('.seo-crawl-links a').length,
      textLink: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
      order: (document.querySelector('.seo-order-link')?.textContent || '').trim(),
    };
  });
  ok(header.text === 'MUNDIFRUTA',
    `${label}: leftover catalog header stays MUNDIFRUTA (got ${header.text})`);
  ok(header.href === '../../',
    `${label}: leftover catalog header still points home (got ${header.href})`);
  ok(header.display === 'flex' || header.display === 'inline-flex',
    `${label}: leftover catalog header stays a flex wordmark (got ${header.display})`);
  ok(header.minHeight === '0px' || header.minHeight === 'auto' || header.minHeight === '',
    `${label}: leftover catalog header stays without combined 44px tap (minHeight=${header.minHeight})`);
  ok(!/27,\s*67,\s*50/.test(header.color),
    `${label}: leftover catalog header stays without leftover forest wordmark color (color=${header.color})`);
  ok(header.nav.includes('Frutas') && header.nav.includes('Legumes') && header.nav.includes('Promoções'),
    `${label}: leftover wrapping Frutas / Legumes / Promoções stay (${header.nav.join(', ')})`);
  ok(header.crumbs[0] === 'Início',
    `${label}: leftover Início breadcrumb stays (got ${header.crumbs.join(', ')})`);
  ok(!header.hamburger, `${label}: leftover SEO page stays without a hamburger`);
  ok(header.crawl === 0, `${label}: leftover catalog page stays without homepage crawl chips`);

  await page.$eval('.seo-header .logo', el => el.scrollIntoView({ block: 'center' }));
  await page.focus('.seo-header .logo');
  await new Promise(r => setTimeout(r, 50));
  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    const cs = active ? getComputedStyle(active) : null;
    return {
      tag: active ? active.tagName : '',
      text: active ? (active.textContent || '').replace(/\s+/g, '') : '',
      href: active && active.getAttribute ? active.getAttribute('href') : '',
      cls: active ? active.className : '',
      parent: active && active.parentElement ? active.parentElement.className : '',
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      outlineColor: cs ? cs.outlineColor : '',
    };
  });
  ok(ring.tag === 'A' && ring.cls === 'logo' && /seo-header/.test(ring.parent) && ring.text === 'MUNDIFRUTA',
    `${label}: leftover catalog header MUNDIFRUTA takes keyboard focus (got ${ring.tag} "${ring.text}" ${ring.cls} in ${ring.parent})`);
  ok(ring.href === '../../',
    `${label}: leftover focused catalog header still points home (got ${ring.href})`);
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') >= 3;
  ok(hasOutline && /27,\s*67,\s*50/.test(ring.outlineColor),
    `${label}: leftover catalog header keyboard forest ring (outline=${ring.outlineStyle}/${ring.outlineWidth} ${ring.outlineColor})`);

  await page.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 50));
  const next = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      tag: active ? active.tagName : '',
      text: active ? (active.textContent || '').trim() : '',
      href: active && active.getAttribute ? active.getAttribute('href') : '',
      parent: active && active.parentElement ? active.parentElement.className : '',
    };
  });
  ok(next.tag === 'A' && next.text === 'Início' && /seo-nav/.test(next.parent),
    `${label}: Tab from leftover MUNDIFRUTA lands on leftover wrapping Início (got ${next.tag} "${next.text}" in ${next.parent})`);
}

async function leftoverCategoryStay(page, label) {
  await leftoverHeaderLogoRing(page, 'categorias/frutas/', label);
  const category = await page.evaluate(() => ({
    textLink: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    order: document.querySelectorAll('.seo-order-link').length,
    crumbs: [...document.querySelectorAll('.seo-breadcrumbs a')].map(a => (a.textContent || '').trim()),
  }));
  ok(category.textLink === 'Ver produto', `${label}: leftover Ver produto stays`);
  ok(category.order === 0, `${label}: leftover category pages stay without the order CTA`);
  ok(category.crumbs[0] === 'Início' && category.crumbs.length === 1,
    `${label}: leftover category breadcrumb stays Início only (got ${category.crumbs.join(', ')})`);
}

async function leftoverProductStay(page, label) {
  await leftoverHeaderLogoRing(page, 'produtos/melancia-1-4/', label);
  const product = await page.evaluate(() => ({
    order: (document.querySelector('.seo-order-link')?.textContent || '').trim(),
    href: document.querySelector('.seo-order-link')?.getAttribute('href') || '',
    textLink: !!document.querySelector('.seo-text-link'),
    crumbs: [...document.querySelectorAll('.seo-breadcrumbs a')].map(a => (a.textContent || '').trim()),
  }));
  ok(product.order === 'Ver no catálogo e encomendar',
    `${label}: leftover order CTA stays (${product.order})`);
  ok(product.href === '/?produto=melancia-1-4#produtos',
    `${label}: leftover order CTA still points at catalog (got ${product.href})`);
  ok(!product.textLink, `${label}: leftover product page stays without Ver produto`);
  ok(product.crumbs[0] === 'Início' && product.crumbs.includes('Frutas'),
    `${label}: leftover product breadcrumb stays Início / Frutas (got ${product.crumbs.join(', ')})`);
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
  await leftoverProductStay(productDesktop, '1280 product');

  const categoryDesktop = await browser.newPage();
  categoryDesktop.on('pageerror', err => errors.push('1280 category pageerror: ' + err.message));
  await leftoverCategoryStay(categoryDesktop, '1280 category');

  const productMobile = await browser.newPage();
  productMobile.on('pageerror', err => errors.push('390 product pageerror: ' + err.message));
  await leftoverProductStay(productMobile, '390 product');

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

  const homeLogo = await desktop.evaluate(() => {
    const logo = document.querySelector('#main-nav .logo');
    if (!logo) return { present: false };
    logo.focus();
    const cs = getComputedStyle(logo);
    return {
      present: true,
      parent: logo.parentElement ? logo.parentElement.className : '',
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
    };
  });
  ok(homeLogo.present, '1280 home: leftover homepage wordmark stays');
  const homeHasForest = homeLogo.outlineStyle && homeLogo.outlineStyle !== 'none'
    && parseFloat(homeLogo.outlineWidth || '0') >= 3
    && /27,\s*67,\s*50/.test(homeLogo.outlineColor || '');
  ok(!homeHasForest,
    `1280 home: leftover homepage wordmark stays without this run's forest ring (outline=${homeLogo.outlineStyle}/${homeLogo.outlineWidth} ${homeLogo.outlineColor})`);

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
    console.error('check-seo-header-logo-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-header-logo-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
