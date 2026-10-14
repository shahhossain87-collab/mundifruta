#!/usr/bin/env node
/** Chrome: leftover SEO header wordmark is forest on white, not white-on-white. */
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
  else if (file.endsWith('/')) file += 'index.html';
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
const forestRgb = 'rgb(27, 67, 50)';

async function openPath(page, path, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });
}

async function seoLogo(page, label) {
  const info = await page.evaluate(() => {
    const logo = document.querySelector('.seo-header .logo');
    const header = document.querySelector('.seo-header');
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const cs = logo ? getComputedStyle(logo) : null;
    const headerCs = header ? getComputedStyle(header) : null;
    return {
      text: (logo?.textContent || '').replace(/\s+/g, ''),
      href: logo ? logo.getAttribute('href') : '',
      color: cs ? cs.color : '',
      headerBg: headerCs ? headerCs.backgroundColor : '',
      nav,
    };
  });
  ok(/MUNDIFRUTA/i.test(info.text), `${label}: leftover wordmark text stays (${info.text})`);
  ok(info.href === '../../', `${label}: leftover wordmark still goes home`);
  ok(info.color === forestRgb, `${label}: leftover SEO wordmark is forest (got ${info.color})`);
  ok(info.headerBg === 'rgb(255, 255, 255)', `${label}: leftover SEO header stays white (got ${info.headerBg})`);
  ok(info.nav.join('|') === 'Início|Frutas|Legumes|Promoções', `${label}: leftover wrapping nav stays (${info.nav.join(', ')})`);
}

try {
  for (const vw of [390, 1280]) {
    const page = await browser.newPage();
    page.on('pageerror', err => errors.push(`${vw} seo pageerror: ` + err.message));
    await openPath(page, 'categorias/frutas/', vw, vw === 390 ? 844 : 800);
    await seoLogo(page, `${vw} Frutas`);
    const frutasH1 = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
    ok(frutasH1.trim() === 'Frutas', `${vw} Frutas: leftover h1 stays Frutas`);

    await openPath(page, 'produtos/morango-500g/', vw, vw === 390 ? 844 : 800);
    await seoLogo(page, `${vw} Morango 500g`);
    const product = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent || '',
      order: document.querySelector('.seo-order-link')?.getAttribute('href') || '',
    }));
    ok(product.h1.trim() === 'Morango 500g', `${vw} Morango 500g: leftover name stays`);
    ok(product.order === '/?produto=morango-500g#produtos', `${vw} Morango 500g: leftover order link stays`);
    await page.close();
  }

  const home = await browser.newPage();
  home.on('pageerror', err => errors.push('homepage pageerror: ' + err.message));
  await home.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await home.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
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
  const homeLogo = await home.evaluate(() => {
    const logo = document.querySelector('#main-nav .logo');
    return logo ? getComputedStyle(logo).color : '';
  });
  ok(homeLogo === 'rgb(255, 255, 255)', `1280 homepage unscrolled wordmark stays white (got ${homeLogo})`);

  const added = await home.evaluate(() => {
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
  ok(added.ok && added.count === '1', `1280: leftover add Melancia 1/4 (count=${added.count})`);

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 homepage pageerror: ' + err.message));
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await mobile.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
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
  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: leftover 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: leftover 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: leftover 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: leftover 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-header-logo-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-header-logo-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
