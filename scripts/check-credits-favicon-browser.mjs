#!/usr/bin/env node
/** Chrome: leftover strawberry favicon on creditos.html; wrapping catalog nav and homepage cart stay. */
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
const leftoverFaviconHref = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍓</text></svg>";
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

async function leftoverCredits(page, path, vw, vh, label) {
  await openPage(page, path, vw, vh);
  const data = await page.evaluate(() => {
    const icon = document.querySelector('link[rel="icon"]');
    const back = document.querySelector('.credits-back');
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map(link => link.getAttribute('href') || '')
      .find(href => href.includes('estilos.css')) || '';
    return {
      iconHref: icon ? icon.getAttribute('href') || '' : '',
      iconCount: document.querySelectorAll('link[rel="icon"]').length,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      title: document.title,
      backHref: back ? back.getAttribute('href') || '' : '',
      backText: back ? (back.textContent || '').replace(/\s+/g, ' ').trim() : '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      cssHref: css,
      creditsPage: document.body.classList.contains('credits-page'),
    };
  });
  ok(data.iconCount === 1 && data.iconHref === leftoverFaviconHref,
    `${label}: leftover strawberry favicon is present (${data.iconHref || 'missing'})`);
  ok(data.h1 === 'Créditos das fotos', `${label}: leftover credits h1 stays`);
  ok(data.title === 'Créditos das fotos — MUNDIFRUTA', `${label}: leftover credits title stays`);
  ok(data.backHref === 'index.html' && /Voltar à loja/i.test(data.backText),
    `${label}: leftover credits back link stays`);
  ok(data.canonical === 'https://mundifruta.com/creditos.html', `${label}: leftover credits canonical stays`);
  ok(data.cssHref.includes('estilos.css?v=64'), `${label}: leftover credits CSS cache stays ?v=64`);
  ok(data.creditsPage, `${label}: leftover credits-page class stays`);
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
  const homeIcon = await page.$eval('link[rel="icon"]', el => el.getAttribute('href') || '');
  ok(homeIcon === leftoverFaviconHref, `${label}: leftover homepage strawberry favicon stays`);
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

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await leftoverCredits(desktop, '/creditos.html', 1280, 800, '1280 credits');

  const frutas = await (async () => {
    await openPage(desktop, '/categorias/frutas/', 1280, 800);
    return desktop.evaluate(() => {
      const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .map(link => link.getAttribute('href') || '')
        .find(href => href.includes('estilos.css')) || '';
      return {
        iconCount: document.querySelectorAll('link[rel="icon"]').length,
        nav,
        h1,
        cssHref: css,
      };
    });
  })();
  ok(frutas.iconCount === 0, '1280 Frutas: leftover catalog favicon stays out (draft #198)');
  ok(frutas.h1 === 'Frutas', '1280 Frutas: leftover h1 stays Frutas');
  ok(frutas.nav.join(' | ') === 'Início | Frutas | Legumes | Promoções',
    `1280 Frutas: leftover wrapping nav stays (${frutas.nav.join(' | ')})`);
  ok(frutas.cssHref.includes('estilos.css?v=65'), '1280 Frutas: generated CSS cache stays ?v=65');

  await openPage(desktop, '/', 1280, 800);
  await leftoverHomepage(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await leftoverCredits(mobile, '/creditos.html', 390, 844, '390 credits');

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
    console.error('check-credits-favicon-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-credits-favicon-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
