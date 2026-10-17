#!/usr/bin/env node
/** Chrome: SEO catalog pages reset homepage padding and keep shop checkout. */
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
const base = `http://127.0.0.1:${port}`;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

async function openPage(page, path, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
}

try {
  for (const vw of [390, 1280]) {
    const page = await browser.newPage();
    page.on('pageerror', err => errors.push(`${vw} seo pageerror: ${err.message}`));
    await openPage(page, '/categorias/frutas/', vw, vw <= 430 ? 844 : 800);
    const cat = await page.evaluate(() => {
      const body = document.body;
      const header = document.querySelector('.seo-header');
      const nav = [...document.querySelectorAll('.seo-nav a')].map(a => ({
        text: (a.textContent || '').trim(),
        current: a.getAttribute('aria-current') === 'page',
      }));
      const footer = [...document.querySelectorAll('.seo-footer-contact a')].map(a => a.getAttribute('href') || '');
      const cs = getComputedStyle(body);
      const headerTop = header ? header.getBoundingClientRect().top : 99;
      return {
        paddingTop: cs.paddingTop,
        headerTop,
        nav: nav.map(n => n.text),
        current: nav.find(n => n.current)?.text || '',
        footer,
        h1: document.querySelector('h1')?.textContent || '',
        cards: document.querySelectorAll('.seo-product-card').length,
        cardHeading: document.querySelector('.seo-product-card h3 a')?.textContent || '',
      };
    });
    ok(cat.paddingTop === '0px', `${vw} frutas: seo-page padding-top should be 0 (got ${cat.paddingTop})`);
    ok(cat.headerTop <= 2, `${vw} frutas: header should sit at the top (top=${cat.headerTop})`);
    ok(cat.h1 === 'Frutas', `${vw} frutas: h1 stays Frutas`);
    ok(cat.nav.includes('Ervas frescas') && cat.nav.includes('Frutas da época') && cat.nav.includes('Cabazes'),
      `${vw} frutas: nav lists leftover category pages`);
    ok(cat.current === 'Frutas', `${vw} frutas: current nav is Frutas (got ${cat.current})`);
    ok(cat.footer.includes('https://wa.me/351932699850') && cat.footer.includes('tel:932699850'),
      `${vw} frutas: footer keeps existing WhatsApp and phone`);
    ok(cat.cards > 10 && /Melancia/i.test(cat.cardHeading), `${vw} frutas: product cards stay (${cat.cards}, first=${cat.cardHeading})`);

    await openPage(page, '/produtos/morango-500g/', vw, vw <= 430 ? 844 : 800);
    const product = await page.evaluate(() => {
      const cta = document.querySelector('.seo-order-link');
      const cs = cta ? getComputedStyle(cta) : null;
      return {
        paddingTop: getComputedStyle(document.body).paddingTop,
        headerTop: document.querySelector('.seo-header')?.getBoundingClientRect().top ?? 99,
        name: document.querySelector('h1')?.textContent || '',
        price: document.querySelector('.seo-product-detail-price')?.textContent || '',
        href: cta ? cta.getAttribute('href') : '',
        ctaWidth: cta ? cta.getBoundingClientRect().width : 0,
        parentWidth: cta ? cta.parentElement.getBoundingClientRect().width : 0,
        display: cs ? cs.display : '',
        og: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      };
    });
    ok(product.paddingTop === '0px', `${vw} morango: seo-page padding-top should be 0 (got ${product.paddingTop})`);
    ok(product.headerTop <= 2, `${vw} morango: header should sit at the top (top=${product.headerTop})`);
    ok(product.name === 'Morango 500g' && /3,99/.test(product.price), `${vw} morango: leftover name and price stay`);
    ok(product.href === '/?produto=morango-500g#produtos', `${vw} morango: order link stays ${product.href}`);
    ok(/morango-500g\.webp$/.test(product.og), `${vw} morango: og:image uses leftover product photo`);
    if (vw <= 430) {
      ok(product.ctaWidth > product.parentWidth * 0.9, `${vw} morango: order CTA is full width (${product.ctaWidth}/${product.parentWidth})`);
    }

    await page.close();
  }

  const home = await browser.newPage();
  home.on('pageerror', err => errors.push('home pageerror: ' + err.message));
  await home.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await home.goto(`${base}/`, { waitUntil: 'networkidle0', timeout: 60000 });
  await home.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await home.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await home.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  const shop = await home.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(el => /Melancia 1\/4/i.test(el.textContent || ''));
    const btn = card ? card.querySelector('.add-btn') : null;
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      hero: !!document.getElementById('inicio'),
      catalog: !!document.getElementById('produtos'),
      count: document.getElementById('cart-count')?.textContent || '',
      search: !!document.getElementById('search-input'),
    };
  });
  ok(shop.hero && shop.catalog && shop.search, 'homepage: leftover hero, catalog, and search stay');
  ok(shop.count === '1', `homepage: leftover add Melancia 1/4 still works (count=${shop.count})`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-page-layout-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-page-layout-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
