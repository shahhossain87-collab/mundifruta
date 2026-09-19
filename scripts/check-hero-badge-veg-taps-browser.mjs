#!/usr/bin/env node
/** Chrome: leftover Comprar Agora / Google badge / veg CTA ≥44px; add Melancia 1/4. */
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

async function checkLeftovers(page, label) {
  const sizes = await page.evaluate(() => {
    const measure = (el) => {
      if (!el) return { w: 0, h: 0, display: 'none', text: '', minH: '', href: '' };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        minH: cs.minHeight,
        href: el.getAttribute('href') || '',
      };
    };
    const sheet = [...document.styleSheets].flatMap(s => {
      try { return [...s.cssRules]; } catch { return []; }
    }).map(r => r.cssText).join('\n');

    const cta = measure(document.querySelector('.hero-ctas .btn-prim'));
    const ctasWrap = document.querySelector('.hero-ctas');
    cta.wrapDisplay = ctasWrap ? getComputedStyle(ctasWrap).display : 'none';
    const badge = measure(document.getElementById('google-badge'));
    const reviewsCta = measure(document.getElementById('reviews-cta'));

    let veg = document.querySelector('.veg-suggestion');
    let injected = false;
    if (!veg) {
      veg = document.createElement('button');
      veg.className = 'veg-suggestion';
      veg.textContent = 'Continuar para Legumes Frescos →';
      document.body.appendChild(veg);
      injected = true;
    }
    const vegSize = measure(veg);
    if (injected) veg.remove();

    return {
      cta, badge, reviewsCta, veg: vegSize, injected,
      rings: {
        btnPrim: sheet.includes('.btn-prim:focus-visible'),
        badge: sheet.includes('.google-badge:focus-visible'),
        veg: sheet.includes('.veg-suggestion:focus-visible'),
        shopLink: sheet.includes('.shop-link:focus-visible'),
        reviews: sheet.includes('.reviews-cta:focus-visible'),
        heroRating: sheet.includes('.hero-rating:focus-visible'),
        search: sheet.includes('.shop-main .search-input:focus-visible') ||
          sheet.includes('.search-input:focus-visible'),
        order: sheet.includes('.order-form input:focus-visible'),
      },
    };
  });

  ok(sizes.cta.text === 'Comprar Agora', `${label}: Comprar Agora copy stays`);
  ok(sizes.cta.href === '#produtos', `${label}: Comprar Agora still jumps to #produtos`);
  ok(sizes.cta.minH === '44px', `${label}: Comprar Agora min-height is ${sizes.cta.minH}`);
  if (sizes.cta.display === 'none' || sizes.cta.wrapDisplay === 'none') {
    ok(true, `${label}: leftover Comprar Agora stays hidden on small screens`);
  } else {
    ok(sizes.cta.h >= 44, `${label}: Comprar Agora is ${sizes.cta.w}×${sizes.cta.h}, need height ≥44`);
  }

  ok(/4,9/.test(sizes.badge.text) && /107/.test(sizes.badge.text), `${label}: Google badge copy stays`);
  ok(sizes.badge.h >= 44, `${label}: Google badge is ${sizes.badge.w}×${sizes.badge.h}, need height ≥44`);
  ok(sizes.badge.minH === '44px', `${label}: Google badge min-height is ${sizes.badge.minH}`);

  ok(/Ver todas as avaliações no Google/.test(sizes.reviewsCta.text), `${label}: reviews CTA copy stays`);
  ok(sizes.veg.minH === '44px' || parseFloat(sizes.veg.minH) >= 44,
    `${label}: leftover veg-suggestion min-height is ${sizes.veg.minH}`);
  ok(sizes.veg.h >= 44, `${label}: leftover veg-suggestion is ${sizes.veg.w}×${sizes.veg.h}, need height ≥44`);

  ok(!sizes.rings.btnPrim && !sizes.rings.badge && !sizes.rings.veg &&
    !sizes.rings.shopLink && !sizes.rings.reviews && !sizes.rings.heroRating &&
    !sizes.rings.search && !sizes.rings.order,
    `${label}: must not add leftover shop-CTA / badge / veg / search / order rings`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkLeftovers(desktop, '1280');
  await addMelancia(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkLeftovers(mobile, '390');

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

  const chips = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.hero-chip')].map(el => getComputedStyle(el).display);
  });
  ok(chips.every(d => d === 'none'), '390: leftover hero WhatsApp/pickup chips stay hidden');

  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-hero-badge-veg-taps-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-hero-badge-veg-taps-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
