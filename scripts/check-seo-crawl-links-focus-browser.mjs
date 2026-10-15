#!/usr/bin/env node
/** Chrome: leftover homepage Explorar o catálogo crawl-link keyboard forest ring. */
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

async function leftoverCrawlRing(page, label) {
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('.seo-crawl-links a')].map(a => ({
      text: (a.textContent || '').trim(),
      href: a.getAttribute('href') || '',
    }))
  );
  const labels = links.map(l => l.text);
  ok(labels.includes('Frutas') && labels.includes('Legumes') && labels.includes('Ervas frescas') &&
    labels.includes('Frutas da época') && labels.includes('Promoções') && labels.includes('Cabazes'),
    `${label}: leftover crawl links stay (${labels.join(', ')})`);
  ok(links[0]?.href === 'categorias/frutas/' && links[1]?.href === 'categorias/legumes/',
    `${label}: leftover first crawl links still point at Frutas / Legumes`);

  const title = await page.evaluate(() =>
    (document.getElementById('seo-crawl-title')?.textContent || '').trim()
  );
  ok(title === 'Explorar o catálogo', `${label}: leftover Explorar o catálogo heading stays`);

  const hamburger = await page.evaluate(() => {
    const el = document.querySelector('.hamburger');
    return { present: !!el, expanded: el ? el.getAttribute('aria-expanded') : null };
  });
  ok(hamburger.present && hamburger.expanded === null,
    `${label}: leftover hamburger stays without aria-expanded`);

  await page.$eval('.seo-crawl-links a', el => el.scrollIntoView({ block: 'center' }));
  await page.focus('.seo-crawl-links a');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    const cs = active ? getComputedStyle(active) : null;
    return {
      tag: active ? active.tagName : '',
      text: active ? (active.textContent || '').trim() : '',
      href: active && active.getAttribute ? active.getAttribute('href') : '',
      parent: active && active.closest ? !!active.closest('.seo-crawl-links') : false,
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      outlineColor: cs ? cs.outlineColor : '',
    };
  });
  ok(ring.tag === 'A' && ring.parent && ring.text === 'Legumes',
    `${label}: Tab from leftover Frutas lands on leftover Legumes (got ${ring.tag} "${ring.text}")`);
  ok(ring.href === 'categorias/legumes/',
    `${label}: leftover Legumes crawl link still points at categorias/legumes/ (got ${ring.href})`);
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') >= 3;
  ok(hasOutline && /27,\s*67,\s*50/.test(ring.outlineColor),
    `${label}: leftover SEO crawl-link keyboard forest ring (outline=${ring.outlineStyle}/${ring.outlineWidth} ${ring.outlineColor})`);
}

async function leftoverSeoPagesStay(page, label) {
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(new URL('categorias/frutas/', base).href, { waitUntil: 'networkidle0', timeout: 60000 });
  const category = await page.evaluate(() => ({
    nav: [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim()),
    crumbs: [...document.querySelectorAll('.seo-breadcrumbs a')].map(a => (a.textContent || '').trim()),
    textLink: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    hamburger: !!document.querySelector('.hamburger'),
    crawl: document.querySelectorAll('.seo-crawl-links a').length,
  }));
  ok(category.nav.includes('Frutas') && category.nav.includes('Legumes') && category.nav.includes('Promoções'),
    `${label}: leftover wrapping Frutas / Legumes / Promoções stay (${category.nav.join(', ')})`);
  ok(category.crumbs[0] === 'Início' && category.crumbs.length === 1,
    `${label}: leftover category breadcrumb stays Início only (got ${category.crumbs.join(', ')})`);
  ok(category.textLink === 'Ver produto', `${label}: leftover Ver produto stays`);
  ok(!category.hamburger, `${label}: leftover SEO pages stay without a hamburger`);
  ok(category.crawl === 0, `${label}: leftover category pages stay without homepage crawl chips`);

  await page.goto(new URL('produtos/melancia-1-4/', base).href, { waitUntil: 'networkidle0', timeout: 60000 });
  const product = await page.evaluate(() => ({
    textLink: !!document.querySelector('.seo-text-link'),
    order: (document.querySelector('.seo-order-link')?.textContent || '').trim(),
    hamburger: !!document.querySelector('.hamburger'),
  }));
  ok(!product.textLink, `${label}: leftover product page stays without Ver produto`);
  ok(product.order === 'Ver no catálogo e encomendar',
    `${label}: leftover order CTA stays (${product.order})`);
  ok(!product.hamburger, `${label}: leftover product page stays without a hamburger`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCrawlRing(desktop, '1280 home');

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

  const seo = await browser.newPage();
  seo.on('pageerror', err => errors.push('1280 seo pageerror: ' + err.message));
  await leftoverSeoPagesStay(seo, '1280 seo');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await leftoverCrawlRing(mobile, '390 home');

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
    console.error('check-seo-crawl-links-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-crawl-links-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
