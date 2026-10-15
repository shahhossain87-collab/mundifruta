#!/usr/bin/env node
/** Chrome: leftover SEO catalog Ver produto keyboard forest ring. */
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

async function leftoverSeoTextLinkRing(page, path, label) {
  await page.setViewport({
    width: label.startsWith('390') ? 390 : 1280,
    height: label.startsWith('390') ? 844 : 800,
    deviceScaleFactor: 1,
    isMobile: label.startsWith('390'),
  });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('.seo-text-link')].map(a => (a.textContent || '').trim())
  );
  ok(links.length > 0 && links.every(t => t === 'Ver produto'),
    `${label}: leftover SEO Ver produto links stay (${links.slice(0, 3).join(', ')}${links.length > 3 ? '…' : ''})`);

  const nav = await page.evaluate(() =>
    [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim())
  );
  ok(nav.includes('Frutas') && nav.includes('Legumes') && nav.includes('Promoções'),
    `${label}: leftover wrapping Frutas / Legumes / Promoções stay (${nav.join(', ')})`);
  const crumbs = await page.evaluate(() =>
    [...document.querySelectorAll('.seo-breadcrumbs a')].map(a => (a.textContent || '').trim())
  );
  ok(crumbs[0] === 'Início' && crumbs.length === 1,
    `${label}: leftover category breadcrumb stays Início only (got ${crumbs.join(', ')})`);
  const hamburger = await page.evaluate(() => !!document.querySelector('.hamburger'));
  ok(!hamburger, `${label}: leftover SEO pages stay without a hamburger`);

  await page.focus('.seo-product-card h2 a');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    const cs = active ? getComputedStyle(active) : null;
    return {
      tag: active ? active.tagName : '',
      className: active ? active.className : '',
      text: active ? (active.textContent || '').trim() : '',
      href: active && active.getAttribute ? active.getAttribute('href') : '',
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      outlineColor: cs ? cs.outlineColor : '',
    };
  });
  ok(ring.tag === 'A' && /\bseo-text-link\b/.test(ring.className) && ring.text === 'Ver produto',
    `${label}: Tab from leftover product title lands on leftover Ver produto (got ${ring.tag}.${ring.className} "${ring.text}")`);
  ok(/melancia-1-4/.test(ring.href || ''),
    `${label}: leftover first Ver produto still points at Melancia 1/4 (got ${ring.href})`);
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') >= 3;
  ok(hasOutline && /27,\s*67,\s*50/.test(ring.outlineColor),
    `${label}: leftover SEO Ver produto keyboard forest ring (outline=${ring.outlineStyle}/${ring.outlineWidth} ${ring.outlineColor})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await leftoverSeoTextLinkRing(desktop, 'categorias/frutas/', '1280 category');

  const product = await browser.newPage();
  product.on('pageerror', err => errors.push('1280 product pageerror: ' + err.message));
  await product.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await product.goto(new URL('produtos/melancia-1-4/', base).href, { waitUntil: 'networkidle0', timeout: 60000 });
  const productCta = await product.evaluate(() => ({
    textLink: !!document.querySelector('.seo-text-link'),
    order: (document.querySelector('.seo-order-link')?.textContent || '').trim(),
    hamburger: !!document.querySelector('.hamburger'),
  }));
  ok(!productCta.textLink, '1280 product: leftover product page stays without Ver produto');
  ok(productCta.order === 'Ver no catálogo e encomendar',
    `1280 product: leftover order CTA stays (${productCta.order})`);
  ok(!productCta.hamburger, '1280 product: leftover SEO pages stay without a hamburger');

  const home = await browser.newPage();
  home.on('pageerror', err => errors.push('390 home pageerror: ' + err.message));
  await home.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await home.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await home.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await home.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await home.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });

  const bar = await home.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390 home: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390 home: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390 home: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390 home: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390 home: leftover 4-item bar stays (got ${bar.length})`);

  const crawl = await home.evaluate(() =>
    [...document.querySelectorAll('.seo-crawl-links a')].map(a => (a.textContent || '').trim())
  );
  ok(crawl.includes('Frutas') && crawl.includes('Legumes') && crawl.includes('Cabazes'),
    `390 home: leftover crawl links stay (${crawl.join(', ')})`);

  const burger = await home.evaluate(() => {
    const el = document.querySelector('.hamburger');
    return {
      present: !!el,
      expanded: el ? el.getAttribute('aria-expanded') : null,
    };
  });
  ok(burger.present && burger.expanded === null, '390 home: leftover hamburger stays without aria-expanded');

  const added = await home.evaluate(() => {
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

  const mobileSeo = await browser.newPage();
  mobileSeo.on('pageerror', err => errors.push('390 seo pageerror: ' + err.message));
  await leftoverSeoTextLinkRing(mobileSeo, 'categorias/frutas/', '390 category');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-text-link-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-text-link-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
