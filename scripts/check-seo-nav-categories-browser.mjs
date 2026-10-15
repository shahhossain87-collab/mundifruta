#!/usr/bin/env node
/** Chrome: leftover wrapping SEO nav lists Ervas / Época / Cabazes. */
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

const leftoverLabels = ['Início', 'Frutas', 'Legumes', 'Ervas frescas', 'Frutas da época', 'Promoções', 'Cabazes'];

async function leftoverSeoNav(page, path, label, currentLabel, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base + path, { waitUntil: 'networkidle0', timeout: 60000 });
  const nav = await page.evaluate(() => {
    const rootNav = document.querySelector('.seo-nav');
    const links = [...(rootNav?.querySelectorAll('a') || [])].map(a => ({
      text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      href: a.getAttribute('href') || '',
      current: a.getAttribute('aria-current') || '',
    }));
    const currentColor = (() => {
      const current = rootNav?.querySelector('[aria-current="page"]');
      return current ? getComputedStyle(current).color : '';
    })();
    const hamburger = !!document.querySelector('.hamburger, #mobile-menu');
    const footer = (document.querySelector('.seo-footer')?.textContent || '').replace(/\s+/g, ' ').trim();
    const order = (document.querySelector('.seo-order-link')?.textContent || '').trim();
    const heading = (document.querySelector('h1')?.textContent || '').trim();
    const hasHeader = !!document.querySelector('.seo-header');
    return { links, currentColor, hamburger, footer, order, heading, hasHeader };
  });

  ok(nav.heading.length > 0, `${label}: leftover page heading stays`);
  ok(nav.hasHeader, `${label}: leftover wrapping SEO header stays`);
  ok(!nav.hamburger, `${label}: leftover wrapping nav stays (no hamburger)`);
  ok(nav.links.length === leftoverLabels.length, `${label}: leftover wrapping nav has 7 links (got ${nav.links.length})`);
  leftoverLabels.forEach((name, index) => {
    ok(nav.links[index]?.text === name, `${label}: leftover nav[${index}] is ${name} (got "${nav.links[index]?.text}")`);
  });
  const current = nav.links.find(link => link.current === 'page');
  ok(current?.text === currentLabel, `${label}: leftover current page is ${currentLabel} (got "${current?.text}")`);
  ok(nav.links.filter(link => link.current === 'page').length === 1, `${label}: only leftover current category is marked`);
  ok(/rgb\(\s*27,\s*67,\s*50\s*\)/.test(nav.currentColor) || /#1b4332/i.test(nav.currentColor),
    `${label}: leftover current nav uses forest color (got ${nav.currentColor})`);
  ok(/MUNDIFRUTA/.test(nav.footer) && /Carnaxide/.test(nav.footer) && !/932/.test(nav.footer),
    `${label}: leftover footer wordmark stays without new contacts`);
  if (path.startsWith('produtos/')) {
    ok(/Ver no catálogo e encomendar/.test(nav.order), `${label}: leftover product order CTA stays`);
  }
}

async function addMelancia(page, label) {
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
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await leftoverSeoNav(desktop, 'categorias/ervas-frescas/', '1280 ervas', 'Ervas frescas', 1280, 800);
  await leftoverSeoNav(desktop, 'categorias/frutas-da-epoca/', '1280 epoca', 'Frutas da época', 1280, 800);
  await leftoverSeoNav(desktop, 'categorias/cabazes/', '1280 cabazes', 'Cabazes', 1280, 800);
  await leftoverSeoNav(desktop, 'produtos/limao/', '1280 limao', 'Frutas', 1280, 800);

  await desktop.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await desktop.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await desktop.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await desktop.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  await addMelancia(desktop, '1280 home');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await leftoverSeoNav(mobile, 'categorias/ervas-frescas/', '390 ervas', 'Ervas frescas', 390, 844);
  await leftoverSeoNav(mobile, 'produtos/limao/', '390 limao', 'Frutas', 390, 844);

  await mobile.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await mobile.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
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
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);
  await addMelancia(mobile, '390 home');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-nav-categories-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-nav-categories-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
