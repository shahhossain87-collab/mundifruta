#!/usr/bin/env node
/** Chrome: leftover overlay motion stops under reduced-motion; add Melancia 1/4. */
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

async function openReady(page, vw, vh, reduce) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  if (reduce) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  } else {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  }
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

function noneish(value) {
  if (!value) return false;
  return value.split(',').every(part => {
    const t = part.trim();
    return t === 'none' || /^0s\b/.test(t) || t.includes('0s ');
  });
}

async function leftoverOverlayMotion(page, label, expectNone) {
  const motion = await page.evaluate(() => {
    const ids = {
      toast: 'toast',
      scroll: 'scroll-top',
      product: 'product-modal',
      cabaz: 'cabaz-modal',
      sidebar: 'shop-sidebar',
      cart: 'float-cart',
    };
    const out = {};
    for (const [key, id] of Object.entries(ids)) {
      const el = document.getElementById(id);
      const cs = el ? getComputedStyle(el) : null;
      out[key] = {
        found: !!el,
        transition: cs ? cs.transition : '',
        duration: cs ? cs.transitionDuration : '',
      };
    }
    const productBox = document.querySelector('.product-modal-box');
    const cabazBox = document.querySelector('.cabaz-modal-box');
    out.productBox = {
      found: !!productBox,
      duration: productBox ? getComputedStyle(productBox).transitionDuration : '',
    };
    out.cabazBox = {
      found: !!cabazBox,
      duration: cabazBox ? getComputedStyle(cabazBox).transitionDuration : '',
    };
    const hamburger = document.querySelector('.hamburger');
    out.hamburgerExpanded = hamburger ? hamburger.getAttribute('aria-expanded') : 'missing';
    return out;
  });

  ok(motion.toast.found && motion.scroll.found && motion.product.found && motion.cabaz.found,
    `${label}: leftover toast / scroll-top / product / cabaz stay in the DOM`);
  ok(motion.sidebar.found && motion.cart.found, `${label}: leftover Filtros drawer / float-cart stay`);
  ok(motion.hamburgerExpanded === null || motion.hamburgerExpanded === 'missing',
    `${label}: leftover hamburger stays without expanded (got ${motion.hamburgerExpanded})`);

  const check = (name, duration) => {
    const stopped = noneish(duration);
    if (expectNone) ok(stopped, `${label}: leftover ${name} transition stops (got "${duration}")`);
    else ok(!stopped, `${label}: leftover ${name} still transitions without reduced motion (got "${duration}")`);
  };
  check('toast', motion.toast.duration);
  check('scroll-top', motion.scroll.duration);
  check('product-modal', motion.product.duration);
  check('product-modal-box', motion.productBox.duration);
  check('cabaz-modal', motion.cabaz.duration);
  check('cabaz-modal-box', motion.cabazBox.duration);
  check('float-cart', motion.cart.duration);
  // Phase A drawer transform transition only exists at leftover ≤900px.
  if (expectNone || label.startsWith('390')) check('shop-sidebar', motion.sidebar.duration);
}

async function leftoverBar(page, label) {
  const bar = await page.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), `${label}: 4-item bar still lists Carrinho`);
  ok(bar.some(t => /Promoções/i.test(t)), `${label}: 4-item bar still lists Promoções`);
  ok(bar.some(t => /WhatsApp/i.test(t)), `${label}: 4-item bar still lists WhatsApp`);
  ok(bar.some(t => /Como Chegar/i.test(t)), `${label}: 4-item bar still lists Como Chegar`);
  ok(bar.length === 4, `${label}: leftover 4-item bar stays (got ${bar.length})`);
}

async function leftoverSearch(page, label) {
  const found = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { ok: false };
    input.value = 'morango';
    window.pesquisar();
    const morango = (document.getElementById('catalog-count')?.textContent || '') +
      [...document.querySelectorAll('.shop-main .product-card')].map(c => c.textContent).join(' ');
    input.value = 'tomate';
    window.pesquisar();
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /tomate/i.test(c.textContent || ''));
    input.value = '';
    window.pesquisar();
    return { ok: /morango/i.test(morango), tomate };
  });
  ok(found.ok, `${label}: leftover search morango still finds a card`);
  ok(found.tomate, `${label}: leftover search tomate still finds a card`);
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
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count}${added.reason ? ', ' + added.reason : ''})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800, true);
  await leftoverOverlayMotion(desktop, '1280 reduce', true);
  await leftoverSearch(desktop, '1280');
  await addMelancia(desktop, '1280');

  const desktopMotion = await browser.newPage();
  desktopMotion.on('pageerror', err => errors.push('1280-motion pageerror: ' + err.message));
  await openReady(desktopMotion, 1280, 800, false);
  await leftoverOverlayMotion(desktopMotion, '1280 motion', false);

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844, true);
  await leftoverBar(mobile, '390');
  await leftoverOverlayMotion(mobile, '390 reduce', true);
  await leftoverSearch(mobile, '390');
  await addMelancia(mobile, '390');

  const mobileMotion = await browser.newPage();
  mobileMotion.on('pageerror', err => errors.push('390-motion pageerror: ' + err.message));
  await openReady(mobileMotion, 390, 844, false);
  await leftoverBar(mobileMotion, '390 motion');
  await leftoverOverlayMotion(mobileMotion, '390 motion', false);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-reduced-motion-overlays-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-reduced-motion-overlays-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
