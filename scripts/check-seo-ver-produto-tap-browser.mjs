#!/usr/bin/env node
/** Chrome: leftover category-card Ver produto is a 44px tap target on 2-column phones. */
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

async function measureCard(page, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('.seo-product-card')];
    const card = cards.find(c => /Melancia 1\/4/i.test(c.textContent || '')) || cards[0];
    const link = card ? card.querySelector('.seo-text-link') : null;
    const body = card ? card.querySelector('.seo-product-card-body') : null;
    const grid = document.querySelector('.seo-product-grid');
    const cs = link ? getComputedStyle(link) : null;
    const bcs = body ? getComputedStyle(body) : null;
    const gcs = grid ? getComputedStyle(grid) : null;
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const order = document.querySelector('.seo-order-link');
    const bodyBox = body ? body.getBoundingClientRect() : null;
    const contentWidth = bodyBox && bcs
      ? bodyBox.width - parseFloat(bcs.paddingLeft || '0') - parseFloat(bcs.paddingRight || '0')
      : 0;
    return {
      text: (link?.textContent || '').replace(/\s+/g, ' ').trim(),
      href: link?.getAttribute('href') || '',
      width: link ? link.getBoundingClientRect().width : 0,
      height: link ? link.getBoundingClientRect().height : 0,
      bodyWidth: bodyBox ? bodyBox.width : 0,
      contentWidth,
      minHeight: cs ? cs.minHeight : '',
      display: cs ? cs.display : '',
      columns: gcs ? gcs.gridTemplateColumns : '',
      cardCount: cards.length,
      nav,
      hasOrderLink: Boolean(order),
    };
  });
}

async function leftoverHomepageBar(page) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  const snapshot = await page.evaluate(() => {
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing', bar, hero };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      bar,
      hero,
    };
  });
  return snapshot;
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  const phone = await measureCard(mobile, 390, 844);
  ok(phone.text === 'Ver produto', `390: leftover Ver produto copy (got "${phone.text}")`);
  ok(phone.href === '../../produtos/melancia-1-4/', `390: leftover Melancia href (got "${phone.href}")`);
  ok(phone.height >= 44, `390: leftover Ver produto tap height >= 44px (got ${phone.height})`);
  ok(phone.contentWidth > 0 && Math.abs(phone.width - phone.contentWidth) <= 2,
    `390: leftover Ver produto should fill the card content box (link=${phone.width}, content=${phone.contentWidth})`);
  ok((phone.columns || '').split(' ').filter(Boolean).length === 2,
    `390: leftover 2-column category grid (got "${phone.columns}")`);
  ok(phone.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${phone.nav.join(' / ')})`);
  ok(!phone.hasOrderLink, '390: category page should not host leftover product-page seo-order-link');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  const wide = await measureCard(desktop, 1280, 800);
  ok(wide.text === 'Ver produto', `1280: leftover Ver produto copy (got "${wide.text}")`);
  ok(wide.href === '../../produtos/melancia-1-4/', `1280: leftover Melancia href (got "${wide.href}")`);
  ok(wide.contentWidth > 0 && wide.width < wide.contentWidth - 8,
    `1280: leftover Ver produto should hug the label, not fill the card (link=${wide.width}, content=${wide.contentWidth})`);
  ok(wide.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `1280: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${wide.nav.join(' / ')})`);

  const home = await leftoverHomepageBar(mobile);
  ok(home.ok && home.count === '1', `390 homepage: add Melancia 1/4 (count=${home.count})`);
  ok(home.bar.some(t => /Carrinho/i.test(t)), '390 homepage: 4-item bar still lists Carrinho');
  ok(home.bar.some(t => /Promoções/i.test(t)), '390 homepage: 4-item bar still lists Promoções');
  ok(home.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: 4-item bar still lists WhatsApp');
  ok(home.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: 4-item bar still lists Como Chegar');
  ok(home.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${home.bar.length})`);
  ok(home.hero.some(t => /Ver Produtos/i.test(t)), '390 homepage: leftover Ver Produtos stays');
  ok(home.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '390 homepage: leftover Encomendar por WhatsApp stays');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-ver-produto-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-ver-produto-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
