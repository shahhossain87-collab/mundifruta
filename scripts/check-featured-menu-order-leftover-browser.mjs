#!/usr/bin/env node
/** Chrome: leftover featured/search/menu rings exist; order fields ≥44px; add Melancia 1/4. */
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

async function checkLeftovers(page, label, { mobileMenu }) {
  const sizes = await page.evaluate((needMenu) => {
    const measure = (el) => {
      if (!el) return { w: 0, h: 0, display: 'none', text: '', minH: '', outline: '' };
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
      };
    };
    const sheet = [...document.styleSheets].flatMap(s => {
      try { return [...s.cssRules]; } catch { return []; }
    }).map(r => r.cssText).join('\n');
    const hasRing = sel => sheet.includes(`${sel}:focus-visible`) ||
      new RegExp(sel.replace('.', '\\.') + ':focus-visible').test(sheet);

    const optBtn = document.getElementById('order-optional-toggle');
    if (optBtn) optBtn.click();
    const nome = measure(document.getElementById('cust-nome'));
    const tel = measure(document.getElementById('cust-telemovel'));
    const hora = measure(document.getElementById('cust-levantamento'));
    const searchClear = document.querySelector('.shop-main .search-clear');
    const featurePhoto = document.querySelector('.feature-photo');
    const csCard = document.querySelector('.cs-card');

    let menu = [];
    let menuClose = { w: 0, h: 0, text: '' };
    if (needMenu) {
      const burger = document.querySelector('.hamburger');
      if (burger) burger.click();
      menu = [...document.querySelectorAll('.mobile-menu a')].map(el => {
        const b = measure(el);
        b.label = (el.textContent || '').replace(/\s+/g, ' ').trim();
        return b;
      });
      menuClose = measure(document.querySelector('.mobile-close'));
      if (window.toggleMenu) window.toggleMenu();
    }

    return {
      nome, tel, hora,
      searchClearOn: Boolean(searchClear),
      featurePhotoOn: Boolean(featurePhoto),
      csCardOn: Boolean(csCard),
      rings: {
        feature: hasRing('.feature-photo'),
        cs: hasRing('.cs-card'),
        clear: hasRing('.shop-main .search-clear') || sheet.includes('.shop-main .search-clear:focus-visible'),
        menu: hasRing('.mobile-menu a'),
        close: hasRing('.mobile-close'),
      },
      menu, menuClose,
    };
  }, mobileMenu);

  ok(sizes.nome.ph.includes('O Seu Nome'), `${label}: nome placeholder stays`);
  ok(sizes.tel.ph.includes('Telemóvel'), `${label}: phone placeholder stays`);
  ok(sizes.hora.ph.includes('Hora de levantamento'), `${label}: pickup placeholder stays`);
  ok(sizes.nome.h >= 44, `${label}: nome is ${sizes.nome.w}×${sizes.nome.h}, need height ≥44`);
  ok(sizes.tel.h >= 44, `${label}: telemovel is ${sizes.tel.w}×${sizes.tel.h}, need height ≥44`);
  ok(sizes.hora.h >= 44, `${label}: levantamento is ${sizes.hora.w}×${sizes.hora.h}, need height ≥44`);
  ok(sizes.featurePhotoOn, `${label}: leftover featured photo button is present`);
  ok(sizes.searchClearOn, `${label}: leftover catalog search-clear is present`);
  ok(sizes.rings.feature && sizes.rings.cs && sizes.rings.clear && sizes.rings.menu && sizes.rings.close,
    `${label}: leftover featured / CS / search-clear / menu rings stay in CSS`);

  if (mobileMenu) {
    ok(sizes.menu.length === 8, `${label}: mobile menu still has 8 leftover links (got ${sizes.menu.length})`);
    ok(sizes.menu.some(m => m.label === 'Promoções'), `${label}: mobile menu still lists Promoções`);
    ok(sizes.menuClose.text.includes('✕'), `${label}: mobile-close visible glyph stays ✕`);
  }
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkLeftovers(desktop, '1280', { mobileMenu: false });
  await addMelancia(desktop, '1280');
  const csAfterAdd = await desktop.evaluate(() => {
    const pop = document.getElementById('cs-pop');
    const card = document.querySelector('#cs-pop .cs-card');
    return {
      open: pop ? !pop.hidden : false,
      hasCard: Boolean(card),
      name: card ? (card.querySelector('.cs-nome')?.textContent || '').trim() : '',
    };
  });
  ok(csAfterAdd.open && csAfterAdd.hasCard, `1280: add Melancia still opens leftover CS cards (${csAfterAdd.name})`);

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkLeftovers(mobile, '390', { mobileMenu: true });
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-featured-menu-order-leftover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-featured-menu-order-leftover-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
