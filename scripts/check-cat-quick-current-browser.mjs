#!/usr/bin/env node
/** Chrome: leftover cat-quick current-category markers; add Melancia 1/4. */
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

async function leftoverCatQuick(page, label) {
  const data = await page.evaluate(() => {
    const search = document.getElementById('search-input');
    if (search) {
      search.value = 'morango';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Morango/i.test(c.textContent || ''));
    if (search) {
      search.value = 'tomate';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Tomate/i.test(c.textContent || ''));
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));

    const snapshot = () => ({
      tiles: [...document.querySelectorAll('.cat-quick-btn')].map(btn => ({
        cat: btn.getAttribute('data-cat') || '',
        current: btn.getAttribute('aria-current') || '',
        text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
        order: btn.classList.contains('cq-order'),
      })),
      headerCurrent: [...document.querySelectorAll('.nav-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      crumbCurrent: document.getElementById('crumb-cat')?.getAttribute('aria-current') || '',
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded') || '',
    });

    const pick = (cat) => {
      if (cat === 'cabazes' && window.abrirCabazes) window.abrirCabazes();
      else if (window.mostrarCategoria) window.mostrarCategoria(cat, document.getElementById(`tab-${cat}`));
      return snapshot();
    };

    return {
      morango,
      tomate,
      first: snapshot(),
      legumes: pick('legumes'),
      ervas: pick('ervas'),
      epoca: pick('epoca'),
      promocoes: pick('promocoes'),
      cabazes: pick('cabazes'),
      frutas: pick('frutas'),
    };
  });

  const currentOf = (snap) => snap.tiles.filter(t => t.current === 'true').map(t => t.cat);
  const cartCurrent = (snap) => snap.tiles.some(t => t.order && t.current);
  const labels = (snap) => snap.tiles.map(t => t.text).join(' | ');

  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(currentOf(data.first).join() === 'frutas', `${label}: leftover first paint current is Frutas (got ${currentOf(data.first)})`);
  ok(currentOf(data.legumes).join() === 'legumes', `${label}: leftover Legumes tile is current`);
  ok(currentOf(data.ervas).join() === 'ervas', `${label}: leftover Ervas tile is current`);
  ok(currentOf(data.epoca).join() === 'epoca', `${label}: leftover Época tile is current`);
  ok(currentOf(data.promocoes).join() === 'promocoes', `${label}: leftover Promoções tile is current`);
  ok(currentOf(data.cabazes).join() === 'cabazes', `${label}: leftover Cabazes tile is current`);
  ok(currentOf(data.frutas).join() === 'frutas', `${label}: leftover Frutas tile is current again`);
  ok(!cartCurrent(data.frutas) && !cartCurrent(data.cabazes), `${label}: leftover Carrinho tile stays unmarked`);
  ok(/Frutas/.test(labels(data.first)) && /Legumes/.test(labels(data.first)) && /Carrinho/.test(labels(data.first)),
    `${label}: leftover Frutas / Legumes / Carrinho copy stays`);
  ok(!data.frutas.headerCurrent && data.frutas.crumbCurrent === '',
    `${label}: leftover header spy / crumb current stay for PR #92 / #93`);
  ok(data.frutas.hamburgerExpanded === '', `${label}: leftover hamburger stays without expanded`);
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
  await openReady(desktop, 1280, 800);
  await leftoverCatQuick(desktop, '1280');
  await addMelancia(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

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

  await leftoverCatQuick(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cat-quick-current-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cat-quick-current-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
