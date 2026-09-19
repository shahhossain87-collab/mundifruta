#!/usr/bin/env node
/** Chrome: leftover qty groups + leftover order keyboard ring + leftover credits back tap; add Melancia 1/4. */
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

async function openReady(page, vw, vh, path = '/') {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base.replace(/\/$/, '') + path, { waitUntil: 'networkidle0', timeout: 60000 });
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

async function leftoverQtyGroups(page, label) {
  const names = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    let modalGroup = '';
    let modalMinus = '';
    let modalPlus = '';
    let modalAdd = '';
    if (window.abrirProduto && card) {
      window.abrirProduto(card.dataset.productId);
      const group = document.querySelector('#product-modal .product-modal-qty');
      modalGroup = group ? group.getAttribute('aria-label') || '' : '';
      const btns = group ? [...group.querySelectorAll('button')] : [];
      modalMinus = btns[0] ? btns[0].getAttribute('aria-label') || '' : '';
      modalPlus = btns[1] ? btns[1].getAttribute('aria-label') || '' : '';
      modalAdd = (document.getElementById('product-modal-add')?.textContent || '').trim();
      if (window.fecharProduto) window.fecharProduto();
    }
    const stepper = document.querySelector('.oi-stepper');
    const cartBtns = stepper ? [...stepper.querySelectorAll('button')] : [];
    return {
      modalGroup,
      modalMinus,
      modalPlus,
      modalAdd,
      cartGroup: stepper ? stepper.getAttribute('aria-label') || '' : '',
      cartMinus: cartBtns[0] ? cartBtns[0].getAttribute('aria-label') || '' : '',
      cartPlus: cartBtns[1] ? cartBtns[1].getAttribute('aria-label') || '' : '',
    };
  });
  ok(/Melancia 1\/4/i.test(names.modalGroup) && /quantidade/i.test(names.modalGroup),
    `${label}: leftover product-modal qty group names Melancia (got "${names.modalGroup}")`);
  ok(names.modalMinus === 'Diminuir quantidade' && names.modalPlus === 'Aumentar quantidade',
    `${label}: leftover product-modal qty buttons stay generic (PR #32)`);
  ok(names.modalAdd === '＋', `${label}: leftover product-modal add stays a visible plus`);
  ok(/Melancia 1\/4/i.test(names.cartGroup),
    `${label}: leftover cart stepper group names Melancia (got "${names.cartGroup}")`);
  ok(names.cartMinus === 'Menos' && names.cartPlus === 'Mais',
    `${label}: leftover cart Menos/Mais stay (PR #31)`);
}

async function leftoverOrderRing(page, label) {
  await page.focus('#cust-nome');
  const ring = await page.evaluate(() => {
    const field = document.getElementById('cust-nome');
    const cs = field ? getComputedStyle(field) : null;
    return {
      active: document.activeElement === field,
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      boxShadow: cs ? cs.boxShadow : '',
      borderColor: cs ? cs.borderColor : '',
    };
  });
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  const hasShadow = ring.boxShadow && ring.boxShadow !== 'none';
  ok(ring.active && (hasOutline || hasShadow),
    `${label}: leftover order name keyboard ring (outline=${ring.outlineStyle}/${ring.outlineWidth}, shadow=${ring.boxShadow})`);
}

async function leftoverCreditsBack(page, label) {
  const tap = await page.evaluate(() => {
    const back = document.querySelector('.credits-back');
    if (!back) return null;
    const r = back.getBoundingClientRect();
    const cs = getComputedStyle(back);
    return {
      href: back.getAttribute('href') || '',
      text: (back.textContent || '').replace(/\s+/g, ' ').trim(),
      height: r.height,
      minHeight: cs.minHeight,
    };
  });
  ok(tap && tap.href === 'index.html' && /Voltar à loja/i.test(tap.text),
    `${label}: leftover credits back still goes to the shop`);
  ok(tap && (tap.height >= 44 || parseFloat(tap.minHeight) >= 44),
    `${label}: leftover credits back is ≥44px (height=${tap && tap.height}, min=${tap && tap.minHeight})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await addMelancia(desktop, '1280');
  await leftoverQtyGroups(desktop, '1280');
  await leftoverOrderRing(desktop, '1280');

  const creditsDesktop = await browser.newPage();
  creditsDesktop.on('pageerror', err => errors.push('1280 credits pageerror: ' + err.message));
  await openReady(creditsDesktop, 1280, 800, '/creditos.html');
  await leftoverCreditsBack(creditsDesktop, '1280');

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

  const hamburger = await mobile.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    return btn ? {
      expanded: btn.getAttribute('aria-expanded'),
      type: btn.getAttribute('type'),
    } : null;
  });
  ok(hamburger && hamburger.expanded !== 'true',
    '390: leftover hamburger stays without leftover expanded=true (PR #70)');

  await addMelancia(mobile, '390');
  await leftoverQtyGroups(mobile, '390');
  await leftoverOrderRing(mobile, '390');

  const creditsMobile = await browser.newPage();
  creditsMobile.on('pageerror', err => errors.push('390 credits pageerror: ' + err.message));
  await openReady(creditsMobile, 390, 844, '/creditos.html');
  await leftoverCreditsBack(creditsMobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-qty-groups-order-credits-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-qty-groups-order-credits-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
