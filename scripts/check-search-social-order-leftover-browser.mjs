#!/usr/bin/env node
/** Chrome: leftover catalog search / social dock ≥44px; leftover order rings; add Melancia 1/4. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
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

async function resetFrutas(page) {
  await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
}

async function addMelancia(page, label) {
  await resetFrutas(page);
  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const badge = document.getElementById('cart-count');
    return { ok: true, count: badge ? badge.textContent : '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

async function checkLeftovers(page, label, { expectDock }) {
  const sizes = await page.evaluate((needDock) => {
    const measure = (el) => {
      if (!el) return { w: 0, h: 0, display: 'none', text: '', minH: '', outline: '', ph: '' };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        minH: cs.minHeight,
        outline: `${cs.outlineStyle} ${cs.outlineWidth}`,
        ph: el.getAttribute('placeholder') || '',
        title: el.getAttribute('title') || '',
      };
    };
    const sheet = [...document.styleSheets].flatMap(s => {
      try { return [...s.cssRules]; } catch { return []; }
    }).map(r => r.cssText).join('\n');

    const search = measure(document.querySelector('.shop-main .search-input'));
    const optBtn = document.getElementById('order-optional-toggle');
    if (optBtn) optBtn.click();
    const nome = measure(document.getElementById('cust-nome'));
    const tel = measure(document.getElementById('cust-telemovel'));
    const hora = measure(document.getElementById('cust-levantamento'));
    const notas = measure(document.getElementById('cust-notas'));

    const dock = [...document.querySelectorAll('.social-link')].map(el => {
      const b = measure(el);
      b.title = el.getAttribute('title') || '';
      return b;
    });

    return {
      search, nome, tel, hora, notas, dock,
      rings: {
        orderIn: sheet.includes('.order-form input:focus-visible'),
        orderTa: sheet.includes('.order-form textarea:focus-visible'),
        social: sheet.includes('.social-link:focus-visible'),
        searchFv: sheet.includes('.shop-main .search-input:focus-visible') ||
          sheet.includes('.search-input:focus-visible'),
        btnWa: sheet.includes('.btn-wa:focus-visible'),
      },
      needDock,
    };
  }, expectDock);

  ok(sizes.search.ph.includes('Pesquisar produto'), `${label}: search placeholder stays`);
  ok(sizes.search.h >= 44, `${label}: catalog search is ${sizes.search.w}×${sizes.search.h}, need height ≥44`);
  ok(sizes.search.minH === '44px', `${label}: catalog search min-height is ${sizes.search.minH}`);

  ok(sizes.nome.ph.includes('O Seu Nome'), `${label}: nome placeholder stays`);
  ok(sizes.tel.ph.includes('Telemóvel'), `${label}: phone placeholder stays`);
  ok(sizes.hora.ph.includes('Hora de levantamento'), `${label}: pickup placeholder stays`);
  ok(sizes.notas.ph.includes('Pedidos especiais'), `${label}: notes placeholder stays`);
  ok(sizes.rings.orderIn && sizes.rings.orderTa, `${label}: leftover order-field peach rings stay in CSS`);
  ok(!sizes.rings.social && !sizes.rings.searchFv && !sizes.rings.btnWa,
    `${label}: must not add leftover social / search / btn-wa rings`);

  if (expectDock) {
    const visibleDock = sizes.dock.filter(d => d.display !== 'none' && d.h > 0);
    ok(visibleDock.length === 4, `${label}: leftover social dock still has 4 chips (got ${visibleDock.length})`);
    ok(visibleDock.every(d => d.h >= 44),
      `${label}: leftover social chips heights ${visibleDock.map(d => d.h).join(',')} need ≥44`);
    ok(visibleDock.some(d => /Fale connosco/i.test(d.title)), `${label}: Fale Connosco chip stays`);
    ok(visibleDock.some(d => /Encomendar/i.test(d.title)), `${label}: Encomendar chip stays`);
  } else {
    const shown = sizes.dock.filter(d => d.display !== 'none' && d.h > 0);
    ok(shown.length === 0, `${label}: social dock stays hidden on small screens (got ${shown.length})`);
  }
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkLeftovers(desktop, '1280', { expectDock: true });
  await addMelancia(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkLeftovers(mobile, '390', { expectDock: false });

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

  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-search-social-order-leftover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-search-social-order-leftover-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
