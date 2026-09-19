#!/usr/bin/env node
/** Chrome: leftover cabaz-ver name + leftover cabaz grid label; add Melancia 1/4. */
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

async function leftoverCabazVerName(page, label) {
  const info = await page.evaluate(() => {
    const grid = document.getElementById('grid-cabazes');
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const ver = card ? card.querySelector('.cabaz-ver') : null;
    const minus = card ? card.querySelector('.qty-btn') : null;
    const plus = card ? card.querySelectorAll('.qty-btn')[1] : null;
    let modalLabel = '';
    if (window.abrirCabaz && card) {
      window.abrirCabaz(card.dataset.productId);
      modalLabel = document.getElementById('cabaz-modal-add')?.getAttribute('aria-label') || '';
      if (window.fecharCabaz) window.fecharCabaz();
    }
    return {
      gridLabel: grid ? grid.getAttribute('aria-label') || '' : '',
      verText: ver ? (ver.textContent || '').replace(/\s+/g, ' ').trim() : '',
      verLabel: ver ? ver.getAttribute('aria-label') || '' : '',
      verType: ver ? ver.getAttribute('type') : null,
      minus: minus ? minus.getAttribute('aria-label') || '' : '',
      plus: plus ? plus.getAttribute('aria-label') || '' : '',
      modalLabel,
      catalogMinus: document.querySelector('.shop-main .qty-btn')?.getAttribute('aria-label') || '',
    };
  });
  ok(info.gridLabel === 'Os Nossos Cabazes',
    `${label}: leftover cabaz grid label is "${info.gridLabel}"`);
  ok(/Ver o que leva/.test(info.verText),
    `${label}: leftover cabaz-ver visible text stays (got "${info.verText}")`);
  ok(/Cabaz Detox/i.test(info.verLabel) && /Ver o que leva/i.test(info.verLabel),
    `${label}: leftover cabaz-ver names Detox (got "${info.verLabel}")`);
  ok(info.verType !== 'button',
    `${label}: leftover cabaz-ver type stays unset (PR #16)`);
  ok(/Detox/i.test(info.minus) && /Detox/i.test(info.plus),
    `${label}: leftover cabaz qty names stay (PR #61)`);
  ok(/Cabaz Detox/i.test(info.modalLabel),
    `${label}: leftover cabaz-modal add name stays (PR #61)`);
  ok(info.catalogMinus === 'Diminuir',
    `${label}: leftover catalog qty stays generic Diminuir (PR #5)`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCabazVerName(desktop, '1280');
  await addMelancia(desktop, '1280');

  const search = await desktop.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input) return { ok: false };
    input.value = 'morango';
    if (window.pesquisar) window.pesquisar();
    const n = document.querySelectorAll('.shop-main .product-card').length;
    input.value = 'tomate';
    if (window.pesquisar) window.pesquisar();
    const n2 = document.querySelectorAll('.shop-main .product-card').length;
    if (window.limparTudo) window.limparTudo();
    return { ok: n > 0 && n2 > 0, n, n2 };
  });
  ok(search.ok, `1280: search morango/tomate (n=${search.n}/${search.n2})`);

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

  const burger = await mobile.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    return !!(btn && getComputedStyle(btn).display !== 'none');
  });
  ok(burger, '390: leftover hamburger still visible');

  await leftoverCabazVerName(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cabaz-ver-name-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cabaz-ver-name-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
